// Validate display.secondaryIP in config against current network interfaces
// If the configured interface no longer exists (excluding 'lo'), clear it to ''
import si from 'systeminformation';
import { readJson, writeJsonAtomic } from '../common/atomic-file.js';
import { CONFIG_PATH } from '../common/constants.js';
import Logger from '../log/logger.js';
import { getHardwareType } from '../common/tool.js';
import { HardwareType } from '../common/enums.js';

const logger = new Logger();

/**
 * Checks config.display.secondaryIP and clears it if the iface is not present.
 * - Reads current network interfaces via systeminformation
 * - Builds netDataFilter like other APIs: [{ iface }], excluding 'lo'
 * - If secondaryIP not in the iface list, sets it to '' using atomic write
 *
 * @returns {Promise<{ updated: boolean, reason?: string, error?: string }>} result
 */
async function validateSecondaryIP() {
    try {
        const config = await readJson(CONFIG_PATH);
        const secondaryIP = config?.display?.secondaryIP ?? '';

        // Nothing to validate
        if (typeof secondaryIP !== 'string' || secondaryIP.trim() === '') {
            return { updated: false, reason: 'empty-or-not-set' };
        }

        // Get current interfaces and filter like in system.routes.js
        const networkData = await si.networkInterfaces();
        const netDataFilter = networkData
            .filter((netInterface) => netInterface.iface !== 'lo')
            .map((netInterface) => ({ iface: netInterface.iface }));

        const exists = netDataFilter.some((n) => n.iface === secondaryIP);
        if (exists) return { updated: false, reason: 'iface-exists' };

        // Clear invalid value atomically
        await writeJsonAtomic(CONFIG_PATH, (cfg) => {
            if (!cfg.display) cfg.display = {};
            cfg.display.secondaryIP = '';
        });

        logger.warn(`start_check: Cleared invalid display.secondaryIP '${secondaryIP}' (iface not found)`);
        return { updated: true };
    } catch (err) {
        logger.error(`start_check: validateSecondaryIP failed: ${err?.message || err}`);
        return { updated: false, error: String(err?.message || err) };
    }
}

// Exported aggregator for all startup checks (extend here with more checks later)
export async function startCheck() {
    const results = {};
    results.secondaryIP = await validateSecondaryIP();
    if (results.secondaryIP.updated) {
        logger.info('start_check: secondaryIP adjusted');
    }
    // 设备型号标准化
    results.deviceVersion = await normalizeDeviceVersion();
    return results;
}

// 独立封装：标准化 config.app.json 中的 deviceVersion 字段
export async function normalizeDeviceVersion() {
    try {
        const hw = getHardwareType(); // 同步函数
        const config = await readJson(CONFIG_PATH);
        const current = config?.deviceVersion || '';
        let expected = null;
        switch (hw) {
            case HardwareType.PI4B:
                expected = 'BliKVM v3 HAT';
                break;
            case HardwareType.CM4:
                expected = 'BliKVM CM4';
                break;
            case HardwareType.MangoPi:
                expected = 'BliKVM v4';
                break;
            case HardwareType.BliKVMV5CM4:
                expected = 'BliKVM v5 CM4';
                break;
            default:
                break;
        }
        if (expected && current !== expected) {
            await writeJsonAtomic(CONFIG_PATH, (cfg) => {
                cfg.deviceVersion = expected;
            });
            logger.info(`start_check: deviceVersion normalized from '${current}' to '${expected}'`);
            return { updated: true, from: current, to: expected };
        }
        return { updated: false, value: current || expected };
    } catch (e) {
        logger.error('start_check: deviceVersion normalization failed: ' + (e?.message || e));
        return { updated: false, error: String(e?.message || e) };
    }
}



