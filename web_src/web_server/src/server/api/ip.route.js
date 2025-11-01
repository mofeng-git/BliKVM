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
import util from 'util';
import { exec } from 'child_process';
import { createApiObj, ApiCode } from '../../common/api.js';
import { changetoRWSystem, changetoROSystem, getSystemType, sleep } from '../../common/tool.js';

const execAsync = util.promisify(exec);

async function getConnectionNameByIface(iface) {
    // Try active first
    try {
        const { stdout } = await execAsync('nmcli -t -f NAME,DEVICE,TYPE connection show --active');
        const line = stdout.split('\n').find(l => l.includes(`:${iface}:`));
        if (line) return line.split(':')[0];
    } catch { }
    // Fallback: any connection bound to iface
    try {
        const { stdout } = await execAsync('nmcli -t -f NAME,DEVICE,TYPE connection show');
        const line = stdout.split('\n').find(l => l.includes(`:${iface}:`));
        if (line) return line.split(':')[0];
    } catch { }
    return null;
}

function toCidr(address, prefix) {
    if (!address) return null;
    if (address.includes('/')) return address; // already CIDR
    if (prefix === undefined || prefix === null) return null;
    return `${address}/${prefix}`;
}

async function getConfigurableIfaceSet() {
    try {
        const { stdout } = await execAsync('nmcli -t -f DEVICE,TYPE device');
        const lines = stdout.trim().split('\n').filter(Boolean);
        const allowed = new Set();
        for (const line of lines) {
            const [device, type] = line.split(':');
            if (!device || !type) continue;
            if (device === 'lo') continue;
            if (/^p2p-/i.test(device)) continue;
            if (type === 'ethernet' || type === 'wifi') {
                allowed.add(device);
            }
        }
        return allowed;
    } catch {
        return new Set();
    }
}

// GET /api/ip/interfaces
async function listInterfaces(req, res) {
    const ret = createApiObj();
    try {
        const { stdout } = await execAsync('nmcli -t -f DEVICE,TYPE,STATE device');
        const devices = stdout
            .trim()
            .split('\n')
            .filter(Boolean)
            .map(line => {
                const [device, type, state] = line.split(':');
                return { device, type, state };
            })
            // keep only devices that can set static IP (ethernet/wifi), exclude loopback and p2p virtual
            .filter(d => ['ethernet', 'wifi'].includes(d.type))
            .filter(d => d.device !== 'lo' && !/^p2p-/i.test(d.device));
        ret.data = { devices };
        ret.code = ApiCode.OK;
        res.json(ret);
    } catch (error) {
        ret.code = ApiCode.INTERNAL_SERVER_ERROR;
        ret.msg = error.message;
        res.json(ret);
    }
}

// GET /api/ip/:iface
async function getInterfaceConfig(req, res) {
    const ret = createApiObj();
    try {
        const { iface } = req.params || {};
        if (!iface) {
            ret.code = ApiCode.INVALID_INPUT_PARAM;
            ret.msg = 'iface required';
            return res.json(ret);
        }
        // validate iface is configurable
        const allowSet = await getConfigurableIfaceSet();
        if (!allowSet.has(iface)) {
            ret.code = ApiCode.INVALID_INPUT_PARAM;
            ret.msg = `iface ${iface} is not configurable`;
            ret.data = { connected: false };
            return res.json(ret);
        }
        const conName = await getConnectionNameByIface(iface);
        if (!conName) {
            ret.data = { iface, connected: false };
            ret.code = ApiCode.OK;
            return res.json(ret);
        }
        // runtime IPv4 from device (matches ifconfig): addresses/gateway/dns
        let addresses = [];
        let gateway = '';
        let dns = [];
        try {
            const { stdout: addrOut } = await execAsync(`nmcli -t -g IP4.ADDRESS device show "${iface}"`);
            // One per line; normalize separators just in case
            addresses = (addrOut || '').trim().split(/[\n\s,;|]+/).filter(Boolean);
        } catch { }
        try {
            const { stdout: gwOut } = await execAsync(`nmcli -t -g IP4.GATEWAY device show "${iface}"`);
            gateway = (gwOut || '').trim();
        } catch { }
        try {
            const { stdout: dnsOut } = await execAsync(`nmcli -t -g IP4.DNS device show "${iface}"`);
            dns = (dnsOut || '').trim().split(/[\n\s,;|]+/).filter(Boolean);
        } catch { }
        // connection setting: ipv4.method（manual|auto|disabled...）
        let method = '';
        try {
            const { stdout: methodOut } = await execAsync(`nmcli -g ipv4.method connection show "${conName}"`);
            method = (methodOut || '').trim();
        } catch { }
        const dhcp = method === 'auto';
        const gatewayNorm = ((gateway || '').trim().split(/[\s,;|]+/).filter(Boolean)[0]) || '';
        ret.data = { iface, connection: conName, dhcp, addresses, gateway: gatewayNorm, dns };
        ret.code = ApiCode.OK;
        res.json(ret);
    } catch (error) {
        ret.code = ApiCode.INTERNAL_SERVER_ERROR;
        ret.msg = error.message;
        res.json(ret);
    }
}

// POST /api/ip/:iface/static
// body: { address: "192.168.1.10"|"192.168.1.10/24", prefix?: 24, gateway?: "192.168.1.1", dns?: ["8.8.8.8","1.1.1.1"] }
async function setStaticIPv4(req, res) {
    const ret = createApiObj();
    let originalState = 'error';
    try {
        const { iface } = req.params || {};
        let { address, prefix, gateway, dns } = req.body || {};
        if (!iface) {
            ret.code = ApiCode.INVALID_INPUT_PARAM;
            ret.msg = 'iface required';
            return res.json(ret);
        }
        // validate iface is configurable
        const allowSet = await getConfigurableIfaceSet();
        if (!allowSet.has(iface)) {
            ret.code = ApiCode.INVALID_INPUT_PARAM;
            ret.msg = `iface ${iface} is not configurable`;
            ret.data = { connected: false };
            return res.json(ret);
        }
        const cidr = toCidr(address, prefix);
        if (!cidr) {
            ret.code = ApiCode.INVALID_INPUT_PARAM;
            ret.msg = 'address (CIDR or ip+prefix) required';
            return res.json(ret);
        }
        const conName = await getConnectionNameByIface(iface);
        if (!conName) {
            ret.code = ApiCode.INVALID_INPUT_PARAM;
            ret.msg = `no connection bound to iface ${iface}`;
            return res.json(ret);
        }
        if (!Array.isArray(dns)) dns = dns ? [String(dns)] : [];

        try { originalState = getSystemType(); } catch { }
        if (originalState === 'ro') { try { changetoRWSystem(); } catch { } }

        await execAsync(`nmcli connection modify "${conName}" ipv4.method manual ipv4.addresses "${cidr}"`);
        if (gateway) {
            await execAsync(`nmcli connection modify "${conName}" ipv4.gateway "${gateway}"`);
        } else {
            await execAsync(`nmcli connection modify "${conName}" -ipv4.gateway`);
        }
        if (dns && dns.length) {
            await execAsync(`nmcli connection modify "${conName}" ipv4.dns "${dns.join(' ')}"`);
        } else {
            await execAsync(`nmcli connection modify "${conName}" -ipv4.dns`);
        }
        // restart connection to apply
        try { await execAsync(`nmcli connection down "${conName}" || true`); } catch { }
        await execAsync(`nmcli connection up "${conName}"`);

        ret.data = { iface, connected: true, dhcp: false };
        ret.code = ApiCode.OK;
    } catch (error) {
        ret.code = ApiCode.INTERNAL_SERVER_ERROR;
        ret.msg = error.message;
        ret.data = { connected: false };
    } finally {
        if (originalState === 'ro') { try { changetoROSystem(); } catch { } }
        if (!res.headersSent) res.json(ret);
    }
}

// POST /api/ip/:iface/dhcp
async function setDHCPv4(req, res) {
    const ret = createApiObj();
    let originalState = 'error';
    try {
        const { iface } = req.params || {};
        if (!iface) {
            ret.code = ApiCode.INVALID_INPUT_PARAM;
            ret.msg = 'iface required';
            return res.json(ret);
        }
        // validate iface is configurable
        const allowSet = await getConfigurableIfaceSet();
        if (!allowSet.has(iface)) {
            ret.code = ApiCode.INVALID_INPUT_PARAM;
            ret.msg = `iface ${iface} is not configurable`;
            ret.data = { connected: false };
            return res.json(ret);
        }
        const conName = await getConnectionNameByIface(iface);
        if (!conName) {
            ret.code = ApiCode.INVALID_INPUT_PARAM;
            ret.msg = `no connection bound to iface ${iface}`;
            return res.json(ret);
        }
        try { originalState = getSystemType(); } catch { }
        if (originalState === 'ro') { try { changetoRWSystem(); } catch { } }

        await execAsync(`nmcli connection modify "${conName}" ipv4.method auto`);
        try { await execAsync(`nmcli connection modify "${conName}" -ipv4.addresses`); } catch { }
        try { await execAsync(`nmcli connection modify "${conName}" -ipv4.gateway`); } catch { }
        try { await execAsync(`nmcli connection modify "${conName}" -ipv4.dns`); } catch { }
        try { await execAsync(`nmcli connection down "${conName}" || true`); } catch { }
        await execAsync(`nmcli connection up "${conName}"`);

        ret.data = { iface, connected: true, dhcp: true };
        ret.code = ApiCode.OK;
    } catch (error) {
        ret.code = ApiCode.INTERNAL_SERVER_ERROR;
        ret.msg = error.message;
        ret.data = { connected: false };
    } finally {
        if (originalState === 'ro') { try { changetoROSystem(); } catch { } }
        if (!res.headersSent) res.json(ret);
    }
}

export { listInterfaces, getInterfaceConfig, setStaticIPv4, setDHCPv4 };
