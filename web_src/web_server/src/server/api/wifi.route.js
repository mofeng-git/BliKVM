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
import { exec } from 'child_process';
import util from 'util';
import { createApiObj, ApiCode } from '../../common/api.js';
import { changetoRWSystem, changetoROSystem, sleep, getSystemType } from '../../common/tool.js';

const execAsync = util.promisify(exec);

function parseScanOutput(raw) {
  const lines = raw.split('\n').filter(l => l.trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.trim().split(/\s{2,}/).filter(Boolean);
    if (parts.length < 4) continue;
    const ssid = parts[0];
    const signal = parts[parts.length - 2];
    const security = parts[parts.length - 1];
    results.push({ ssid, signal, security });
  }
  return results;
}

async function scanWifi(req, res, next) {
  const returnObject = createApiObj();
  try {
    await execAsync('nmcli device wifi rescan');
    const { stdout } = await execAsync('nmcli -f SSID,CHAN,SIGNAL,SECURITY device wifi list');
    // 获取当前激活的 Wi-Fi SSID（可能为空）
    const activeInfo = await getActiveWifiInternal();
    const list = parseScanOutput(stdout).map(n => ({ ...n, active: activeInfo && activeInfo.ssid === n.ssid }));
    returnObject.data = { networks: list, active: activeInfo || null };
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  } catch (error) {
    returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
    returnObject.msg = error.message;
    res.json(returnObject);
  }
}

// 内部工具：解析当前激活 Wi-Fi
async function getActiveWifiInternal() {
  try {
    // 使用 terse 输出：ACTIVE:SSID:BSSID:CHAN:SIGNAL:SECURITY
    const { stdout } = await execAsync('nmcli -t -f ACTIVE,SSID,BSSID,CHAN,SIGNAL,SECURITY device wifi');
    const line = stdout.split('\n').find(l => l.startsWith('yes:'));
    if (!line) return null;
    const parts = line.split(':');
    // yes:<ssid>:<bssid>:<chan>:<signal>:<security>
    return {
      ssid: parts[1] || '',
      bssid: parts[2] || '',
      chan: parts[3] || '',
      signal: parts[4] || '',
      security: parts[5] || ''
    };
  } catch {
    return null;
  }
}

async function wifiStatus(req, res, next) {
  const returnObject = createApiObj();
  try {
    const active = await getActiveWifiInternal();
    returnObject.data = {
      connected: !!active,
      active
    };
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  } catch (error) {
    returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
    returnObject.msg = error.message;
    res.json(returnObject);
  }
}

async function connectWifi(req, res, next) {
  const returnObject = createApiObj();
  let rwChanged = false;
  let roRecovered = false;
  let prepPerformed = false;
  let originalState = 'error';
  try {
    const { ssid, password } = req.body || {};

    // 仅当根分区为只读时才切换为可写
    try { originalState = getSystemType(); } catch { }
    if (originalState === 'ro') {
      try { rwChanged = changetoRWSystem(); } catch { }
    }

    if (!ssid) {
      returnObject.code = ApiCode.BAD_REQUEST;
      returnObject.msg = 'ssid required';
      returnObject.data = { connected: false };
      return; // 在 finally 中统一输出
    }

    // 每次调用都做一次权限 + NM 重启（只读系统会被恢复）
    if (process.getuid && process.getuid() === 0) {
      try {
        await execAsync('chmod 777 -R /etc/NetworkManager/system-connections || true');
        await execAsync('systemctl restart NetworkManager');
        await sleep(1500); // 等待 NM 重新加载
        prepPerformed = true;
      } catch { }
    }

    const escapedSsid = ssid.replace(/"/g, '\\"');
    const escapedPwd = (password || '').replace(/"/g, '\\"');
    const cmd = password ? `nmcli device wifi connect "${escapedSsid}" password "${escapedPwd}"` : `nmcli device wifi connect "${escapedSsid}"`;
    await execAsync(cmd);
    returnObject.data = { connected: true };
    returnObject.code = ApiCode.OK;
  } catch (error) {
    returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
    returnObject.msg = error?.message || '';
    // 明确返回连接失败
    returnObject.data = { connected: false };
  } finally {
    // 仅当最初是只读时才恢复为只读
    if (originalState === 'ro') {
      try { roRecovered = changetoROSystem(); } catch { }
    }
    // 返回体仅包含连接是否成功
    if (!res.headersSent) res.json(returnObject);
  }
}

async function disconnectWifi(req, res, next) {
  const returnObject = createApiObj();
  let rwChanged = false;
  let roRecovered = false;
  try {
    let originalState = 'error';
    try { originalState = getSystemType(); } catch { }
    if (originalState === 'ro') {
      try { rwChanged = changetoRWSystem(); } catch { }
    }
    const { ssid } = req.body || {};
    if (ssid) {
      const escaped = ssid.replace(/"/g, '\\"');
      try { await execAsync(`nmcli connection down id "${escaped}"`); } catch { }
    } else {
      try {
        const cmd = "nmcli connection down id $(nmcli -t -f NAME,TYPE connection show --active | awk -F: '" + '$2=="wifi" {print $1; exit}' + "')";
        await execAsync(cmd);
      } catch { }
    }
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'disconnected';
    returnObject.data = { rwChanged };
  } catch (error) {
    returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
    returnObject.msg = error.message;
    returnObject.data = { rwChanged };
  } finally {
    // 仅当最初是只读时才恢复为只读
    try {
      const st = getSystemType();
      if (st === 'ro') {
        try { roRecovered = changetoROSystem(); } catch { }
      }
    } catch { }
    if (!returnObject.data) returnObject.data = {}; // ensure object
    returnObject.data.roRecovered = roRecovered;
    if (!res.headersSent) res.json(returnObject);
  }
}

export { scanWifi, connectWifi, disconnectWifi, wifiStatus };
