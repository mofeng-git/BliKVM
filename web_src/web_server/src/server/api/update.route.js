/*****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
*****************************************************************************/
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import https from 'https';
import Logger from '../../log/logger.js';

const logger = new Logger();
const UPDATE_UNIT = 'blikvm-update'; // fixed unit name to ensure single instance via systemd
const TMP_SCRIPT = '/tmp/update.py'; // 下载后保存的位置

// 下载 update.py ，优先 GitHub，10s 超时再尝试 Gitee
async function downloadUpdatePy() {
  const urls = [
    'https://raw.githubusercontent.com/blikvm/blikvm/master/script/update.py',
    'https://gitee.com/blikvm/blikvm/raw/master/script/update.py',
  ];

  for (const url of urls) {
    logger.info(`[update] downloading update.py from ${url}`);
    try {
      await new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          const file = fs.createWriteStream(TMP_SCRIPT, { mode: 0o755 });
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      logger.info(`[update] downloaded update.py from ${url}`);
      return TMP_SCRIPT;
    } catch (err) {
      logger.warn(`[update] failed to download from ${url}: ${err.message}`);
    }
  }
  throw new Error('Failed to download update.py from all sources');
}

// (old file-lock helpers removed; concurrency now enforced by systemd fixed unit or flock)

function checkSystemdUnitActive(unit) {
  return new Promise((resolve) => {
    if (!unit) return resolve(false);
    const p = spawn('systemctl', ['is-active', unit], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', d => out += d.toString());
    p.on('close', (code) => {
      const txt = (out || '').trim();
      resolve(code === 0 && txt === 'active');
    });
    p.on('error', () => resolve(false));
  });
}

// Helper to write SSE event (no-op if closed)
function makeSseWriter(res, isClosedRef) {
  return (event) => {
    if (isClosedRef.closed) return;
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // Ignore write after end
      isClosedRef.closed = true;
    }
  };
}

// GET /api/update/stream?version=vX.Y.Z&source=github|gitee&pingCount=3
async function apiUpdateStream(req, res, next) {
  try {
    // Prepare SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Allow CORS for dev environment
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.flushHeaders && res.flushHeaders();

    // SSE writer with close guard
    const closed = { closed: false };
    const sse = makeSseWriter(res, closed);
    sse({ type: 'info', message: 'During the upgrade process, the system may experience lag, so try to avoid other operations as much as possible. Downloading update script, please wait...' });

    // Build update.py command
    const scriptPath = await downloadUpdatePy();

    const pyArgs = [scriptPath];

    const { version, source, pingCount } = req.query || {};
    if (version) pyArgs.push(String(version));
    if (source) {
      pyArgs.push('--source', String(source));
    }
    if (pingCount) {
      pyArgs.push('--ping-count', String(pingCount));
    }
    pyArgs.push('--progress-mode', 'pct'); // Use percentage mode for better SSE compatibility

    // Concurrency guard with fixed systemd unit: if active, attach; else try to start
    try {
      const active = await checkSystemdUnitActive(UPDATE_UNIT);
      if (active) {
        sse({ type: 'start', mode: 'attach', unit: UPDATE_UNIT });
        const j = spawn('journalctl', ['-fu', UPDATE_UNIT, '-n', '0', '--output', 'cat'], { stdio: ['ignore', 'pipe', 'pipe'] });
        const onJOut = (d) => d.toString().split(/\r?\n/).forEach(line => line && sse({ type: 'log', line }));
        const onJErr = (d) => d.toString().split(/\r?\n/).forEach(line => line && sse({ type: 'err', line }));
        j.stdout.on('data', onJOut);
        j.stderr.on('data', onJErr);
        j.on('close', (code, signal) => {
          sse({ type: 'end', unit: UPDATE_UNIT, code, signal });
          if (!closed.closed) { try { res.end(); } catch { } }
          closed.closed = true;
        });
        j.on('error', (e) => {
          logger.error(`[update] journalctl error (attach): ${e?.message || e}`);
          sse({ type: 'error', message: String(e?.message || e) });
          if (!closed.closed) { try { res.end(); } catch { } }
          closed.closed = true;
        });
        const handleDisconnect = () => {
          if (closed.closed) return;
          closed.closed = true;
          try { j.kill('SIGTERM'); } catch { }
          try { res.end(); } catch { }
          logger.info('[update] client disconnected (attach); update continues in background');
        };
        req.on('close', handleDisconnect);
        res.on && res.on('close', handleDisconnect);
        return;
      }
    } catch (e) {
      logger.warn(`[update] active check failed: ${e?.message || e}`);
    }

    // Prefer running as a transient systemd unit so it survives web stop
    const unit = UPDATE_UNIT;
    const sdArgs = [
      '--unit', unit,
      '--collect',
      '--property', 'Restart=no',
      '--property', 'KillMode=process',
      '--property', `WorkingDirectory=${path.dirname(scriptPath)}`,
      'python3',
      ...pyArgs
    ];

    const startBySystemdRun = () => new Promise((resolve, reject) => {
      logger.info(`[update] starting update by systemd-run as unit ${unit}`);
      const p = spawn('systemd-run', sdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      let err = '';
      p.stdout.on('data', d => out += d.toString());
      p.stderr.on('data', d => err += d.toString());
      p.on('close', (code) => {
        if (code === 0) resolve({ out, err }); else reject(new Error(err || out || `systemd-run exit ${code}`));
      });
      p.on('error', reject);
    });

    const followJournal = (unitName) => {
      // Follow unit logs
      sse({ type: 'start', mode: 'systemd', unit: unitName, cmd: 'python3', args: pyArgs });
      const j = spawn('journalctl', ['-fu', unitName, '-n', '0', '--output', 'cat'], { stdio: ['ignore', 'pipe', 'pipe'] });
      const onJOut = (d) => d.toString().split(/\r?\n/).forEach(line => line && sse({ type: 'log', line }));
      const onJErr = (d) => d.toString().split(/\r?\n/).forEach(line => line && sse({ type: 'err', line }));
      j.stdout.on('data', onJOut);
      j.stderr.on('data', onJErr);
      j.on('close', (code, signal) => {
        sse({ type: 'end', unit: unitName, code, signal });
        if (!closed.closed) { try { res.end(); } catch { } }
        closed.closed = true;
          
      });
      j.on('error', (e) => {
        logger.error(`[update] journalctl error: ${e?.message || e}`);
        sse({ type: 'error', message: String(e?.message || e) });
        if (!closed.closed) { try { res.end(); } catch { } }
        closed.closed = true;
      });

      const handleDisconnect = () => {
        if (closed.closed) return;
        closed.closed = true;
        try { j.stdout.off('data', onJOut); j.stderr.off('data', onJErr); } catch { }
        try { j.kill('SIGTERM'); } catch { }
        try { res.end(); } catch { }
        logger.info('[update] client disconnected; update continues in background');
      };
      req.on('close', handleDisconnect);
      res.on && res.on('close', handleDisconnect);
    };
    try {
      await startBySystemdRun();
      followJournal(unit);
    } catch (e) {
      // Fallback: direct spawn (no survival if web service stops)
      logger.warn(`[update] systemd-run unavailable or failed, fallback to direct spawn with flock: ${e?.message || e}`);
      sse({ type: 'start', mode: 'direct', method: 'flock', cmd: 'python3', args: pyArgs });
      const lockFile = '/run/blikvm-update.lock';
      const cmdStr = `python3 ${pyArgs.map(a => String(a)).join(' ')}`;
      const child = spawn('flock', ['-n', lockFile, '-c', cmdStr], {
        cwd: path.dirname(scriptPath),
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      const onData = (data, stream) => {
        const text = data.toString();
        text.split(/\r?\n/).forEach(line => { if (!line) return; sse({ type: stream, line }); });
      };
      const onStdout = (d) => onData(d, 'log');
      const onStderr = (d) => onData(d, 'err');
      child.stdout.on('data', onStdout);
      child.stderr.on('data', onStderr);
      child.on('error', (err) => {
        logger.error(`[update] spawn error: ${err?.message || err}`);
        sse({ type: 'error', message: String(err?.message || err) });
        if (!closed.closed) { try { res.end(); } catch { } }
        closed.closed = true;
      });
      child.on('close', (code, signal) => {
        if (code && code !== 0) {
          // Non-zero close from flock usually means lock held by another instance
          sse({ type: 'busy', message: 'Another update is in progress (flock)' });
        } else {
          sse({ type: 'end', code, signal });
        }
        if (!closed.closed) { try { res.end(); } catch { } }
        closed.closed = true;
      });
      const handleDisconnect = () => {
        if (closed.closed) return;
        closed.closed = true;
        try { child.stdout.off('data', onStdout); child.stderr.off('data', onStderr); } catch { }
        try { res.end(); } catch { }
        logger.info('[update] client disconnected (direct mode); update process may be terminated if web stops');
      };
      req.on('close', handleDisconnect);
      res.on && res.on('close', handleDisconnect);
    }
  } catch (error) {
    next(error);
  }
}

export { apiUpdateStream };
