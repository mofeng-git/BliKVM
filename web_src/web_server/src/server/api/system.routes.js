
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
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import { ApiCode, createApiObj } from '../../common/api.js';
import { getSystemInfo, executeCMD, changetoRWSystem, changetoROSystem, getSystemType, getHardwareType } from '../../common/tool.js';
import { HardwareType } from '../../common/enums.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { Notify } from '../../modules/notification.js';
import si from 'systeminformation';
import Logger from '../../log/logger.js';

const logger = new Logger();

// Use Notify singleton throughout

// RFC-1123-ish hostname validator: labels 1-63 chars, letters/digits/hyphen, no leading/trailing hyphen, total <= 253
function isValidHostname(name) {
  if (typeof name !== 'string') return false;
  const hostname = name.trim();
  if (hostname.length === 0 || hostname.length > 253) return false;
  const label = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/;
  const parts = hostname.split('.');
  return parts.every(p => label.test(p));
}

// Ensure /etc/hosts has a 127.0.1.1 line mapping to the new hostname (short + FQDN),
// and replace old hostname tokens if present. No-op if content already matches.
function ensureEtcHostsHostname(oldHostname, newHostname) {
  try {
    const hostsPath = '/etc/hosts';
    const exists = fs.existsSync(hostsPath);
    const original = exists ? fs.readFileSync(hostsPath, 'utf8') : '';
    const lines = original.split(/\r?\n/);

    const shortNew = String(newHostname).split('.')[0];
    const shortOld = oldHostname ? String(oldHostname).split('.')[0] : null;

    let found12701 = false;
    const updated = lines.map(line => {
      // Keep comments/blank lines unchanged
      if (/^\s*#/.test(line) || line.trim() === '') return line;
      const m = line.match(/^\s*(127\.0\.1\.1)\s+(.*)$/);
      if (!m) return line;
      found12701 = true;
      const ip = m[1];
      const rest = m[2].trim();
      const tokens = rest.split(/\s+/);
      // Remove old hostname tokens if present
      const filtered = tokens.filter(t => t !== oldHostname && t !== shortOld);
      // Prepend new short + fqdn, dedup while preserving order
      const next = [shortNew, newHostname, ...filtered].filter((t, i, arr) => t && arr.indexOf(t) === i);
      return `${ip} ${next.join(' ')}`;
    });

    if (!found12701) {
      // Append a sane default mapping line if none exists
      updated.push(`127.0.1.1 ${shortNew} ${newHostname}`);
    }

    const nextContent = updated.join('\n');
    if (nextContent !== original) {
      // Atomic-ish write: write temp then replace
      const tmp = '/etc/.hosts.tmp';
      fs.writeFileSync(tmp, nextContent, 'utf8');
      fs.renameSync(tmp, hostsPath);
      logger.info(`[system] /etc/hosts updated for hostname: ${newHostname}`);
    }
  } catch (e) {
    // Log but do not throw to avoid leaving system in inconsistent RW state
    logger.error(`[system] Failed to update /etc/hosts: ${e?.message || e}`);
  }
}

function apiReboot(req, res, next) {
  try {
    executeCMD('reboot');
  } catch (error) {
    next(error);
  }
}

function readSerialNumber() {
  return new Promise((resolve, reject) => {
    fs.readFile('/proc/device-tree/serial-number', 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data.replace(/\u0000/g, '').trim());
    });
  });
}

function apiGetSystemInfo(req, res, next) {
  try {
    Promise.all([si.system(), si.cpu(),si.networkInterfaces(), si.osInfo(), readSerialNumber(), getSystemInfo(),si.mem(), si.diskLayout(),si.fsSize(),si.time() ])
      .then(([systemData, cpuData, networkData, osData, serialNumber, systemInfo,memData, disks, fsData,siTime]) => {
        const netDataFilter = networkData.filter(netInterface => netInterface.iface !== 'lo')
        .map(netInterface => ({
          iface: netInterface.iface,   
          ip4: netInterface.ip4,       
          mac: netInterface.mac,
          virtual: netInterface.virtual,
          type: netInterface.type,
          dhcp: netInterface.dhcp    
        }));
        const osDataFilter = {
          platform: osData.platform,
          distro: osData.distro,
          release: osData.release,
          codename: osData.codename,
          kernel: osData.kernel,
          arch: osData.arch,
          hostname: osData.hostname,
          fqdn: osData.fqdn,
          codepage: osData.codepage
        };
        const returnObject = createApiObj();
        returnObject.code = ApiCode.OK;

        // Find the SD card by checking for 'mmcblk0'
        let sdTotalSpace = 0;
        const sdCard = disks.find(disk => disk.device === '/dev/mmcblk0'); 
        if (sdCard) {
          sdTotalSpace = sdCard.size;
        }
        let sdAvailableSpace = fsData
        .filter(fs => fs.fs.startsWith('/dev/mmcblk0'))
        .reduce((total, partition) => total + partition.available, 0);
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
        let deviceVersion = config.deviceVersion;
        // console.log('systemData:', systemData);
        returnObject.data = {
          cpuLoad: systemInfo.cpuLoad,
          uptime: systemInfo.uptime,
          timezone: siTime.timezone,
          timezoneName: siTime.timezoneName,
          temperature: systemInfo.temperature,
          auth:{
            isEnabled: config.server.auth
          },
          config:{
            isATXActive: config.atx.isActive
          },
          board: {
            deviceType: 'KVM-over-IP',
            deviceVersion: deviceVersion || 'Unknown',
            manufacturer: systemData.manufacturer || 'Unknown',
            model: systemData.model || 'Unknown',
            version: systemData.version || 'Unknown',
            serial: systemData.serial || 'Unknown',
            type: systemData.type || 'Unknown',
            cpu: {
              manufacturer: cpuData.manufacturer || 'Unknown',
              processor: cpuData.brand || 'Unknown',
              revision: cpuData.revision || 'Unknown',
              vendor: cpuData.vendor || 'Unknown',            
            }
          },
          os: osDataFilter,
          mem:{
            total: memData.total,
            actual: memData.free
          },
          storage:{
            total: sdTotalSpace,
            actual: sdAvailableSpace
          },
          mic:{
            isRegistered: config.mic?.isRegistered ?? false
          },
          network: netDataFilter
        };
        const hdType = getHardwareType();
        if(hdType === HardwareType.MangoPi){
          returnObject.data.board.manufacturer = "MangoPi";
          returnObject.data.board.model = "MangoPi MCore";
          returnObject.data.board.serial = serialNumber;
          returnObject.data.board.type = "mangopi";
          returnObject.data.board.cpu.manufacturer = "Allwinner Technology Co";
          returnObject.data.board.cpu.processor = "H316 or H616";
        }else if(hdType === HardwareType.PI4B || hdType === HardwareType.CM4){
          returnObject.data.board.type = systemData.raspberry.type;
        }
        
        res.json(returnObject);
      })
      .catch(error => {
        next(error);
      });
  } catch (error) {
    next(error);
  }
}

async function apiUpdateHostname(req, res, next){
  try {
    const { hostname } = req.body;
    if (!isValidHostname(hostname)) {
      return res.status(400).json({ code: ApiCode.ERROR, message: 'Invalid hostname (RFC-1123: letters/digits/hyphen, no leading/trailing hyphen, labels <=63, total <=253)' });
    }

    // Remember original root mount state and switch to RW if needed
    const originalState = getSystemType(); // 'ro' | 'rw' | 'error'
    if (originalState === 'ro') {
      const ok = changetoRWSystem();
      if (!ok) {
        return res.status(500).json({ code: ApiCode.INTERNAL_SERVER_ERROR, message: 'Failed to remount / as read-write' });
      }
    }

    try {
      // Capture current hostname (short best-effort)
      let oldHostname = '';
      try {
        const osData = await si.osInfo();
        oldHostname = osData?.hostname || '';
      } catch (e) {
        // ignore, continue
      }

      // Set static hostname to ensure /etc/hostname is updated
      await executeCMD(`hostnamectl set-hostname --static ${hostname}`);

      // Keep /etc/hosts consistent to avoid sudo: unable to resolve host <name>
      ensureEtcHostsHostname(oldHostname, hostname);
    } finally {
      // Restore to RO if it was RO before
      if (originalState === 'ro') {
        changetoROSystem();
      }
    }

    const returnObject = createApiObj();
    si.osInfo()
      .then(osData => {
        returnObject.code = ApiCode.OK;
        returnObject.msg = 'Hostname updated successfully';
        returnObject.data = {
          hostname: osData.hostname || 'Unknown'
        };
        res.json(returnObject);
      })
      .catch(error => {
        next(error);
      });
  } catch (error) {
    next(error);
  }
}

const apiGetLogs = async (req, res, next) => {
  try {
    const { log } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const returnObject = createApiObj();

    const logDir = path.dirname(log.file.fileName);
    const logBaseName = path.basename(log.file.fileName);
    const logFiles = [
      path.join(logDir, logBaseName),
      path.join(logDir, `${logBaseName}.1`),
      path.join(logDir, `${logBaseName}.2`)
    ];

    const latestLogFile = logFiles
      .map(logFile => {
        if (fs.existsSync(logFile)) {
          return { file: logFile, mtime: fs.statSync(logFile).mtimeMs };
        }
        return null;
      })
      .filter(Boolean) 
      .sort((a, b) => b.mtime - a.mtime)[0]?.file;

    if (!latestLogFile) {
      Notify.error('No log files found');
      return;
    }

    exec(`tail -n 20 ${latestLogFile}`, (err, stdout, stderr) => {
      if (err) {
        return next(err);
      }

      returnObject.code = ApiCode.OK;
      returnObject.data = stdout;
      res.json(returnObject);
    });
  } catch (error) {
    next(error);
  }
};



export { apiReboot, apiGetSystemInfo, apiGetLogs, apiUpdateHostname };
