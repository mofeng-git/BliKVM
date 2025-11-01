#!/usr/bin/env node
/**
 * EEPROM JSON reader for I2C address 0x51 (typical 24Cxx EDID / system info)
 * - Gracefully handles device not present (returns null)
 * - Reads a configurable number of bytes (default 512) and attempts to parse JSON
 * - Trims trailing 0xFF / 0x00 padding
 * - Exports readEepromJson() for programmatic use and supports CLI execution
 */
import i2c from 'i2c-bus';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// 固定使用 I2C 总线 8（需求：0x51 只在 bus 8 上）
const DEFAULT_BUS = 8;
const BUS_LIST = [DEFAULT_BUS];
// 固定地址 0x50
const EEPROM_ADDR = 0x50;
const READ_LENGTH = parseInt(process.env.EEPROM_READ_LEN || '512', 10);
// Timeouts: 放宽到 1000ms 以避免由于组合事务或总线繁忙导致的误判
const PROBE_TIMEOUT_MS = parseInt(process.env.EEPROM_PROBE_TIMEOUT_MS || '1000', 10);
const READ_TIMEOUT_MS = parseInt(process.env.EEPROM_READ_TIMEOUT_MS || '1000', 10); // per page

/**
 * Attempt to open i2c bus and detect if the EEPROM at 0x51 responds.
 * Some i2c-bus versions support i2cFuncs / deviceId, but simplest is try/catch a read.
 */
// Error codes that indicate the EEPROM is not present or not responding
const MISSING_DEVICE_CODES = ['ENXIO', 'EREMOTEIO', 'EIO', 'ETIMEDOUT', 'ENOENT', 'ENODEV'];

// 常量：读取标志（兼容旧版本没有 i2cTransfer）
const I2C_M_RD = (i2c && i2c.I2C_M_RD) || 0x0001;

function emulateTransfer(bus, addr, msgs, cb) {
    // 只支持 pattern: [write(>0 bytes)], [read(n bytes)]
    if (msgs.length !== 2 || (msgs[0].flags & I2C_M_RD) || !(msgs[1].flags & I2C_M_RD)) {
        return cb(new Error('emulateTransfer only supports write+read pattern'));
    }
    const w = msgs[0];
    const r = msgs[1];
    bus.i2cWrite(addr, w.byteLength, w.buffer, (err) => {
        if (err) return cb(err);
        bus.i2cRead(addr, r.byteLength, r.buffer, (err2) => {
            if (err2) return cb(err2);
            cb(null);
        });
    });
}

// 适配：同时支持 callback 风格与 promise 风格 (openPromisified 返回的 bus)
async function i2cWriteCompat(bus, addr, len, buf) {
    try {
        if (bus.i2cWrite.length <= 3) { // promise 版本: (addr, len, buf)
            await bus.i2cWrite(addr, len, buf);
        } else {
            await new Promise((resolve, reject) => bus.i2cWrite(addr, len, buf, (e) => e ? reject(e) : resolve()));
        }
    } catch (e) { throw e; }
}

async function i2cReadCompat(bus, addr, len, buf) {
    try {
        if (bus.i2cRead.length <= 3) { // promise 版本
            await bus.i2cRead(addr, len, buf);
        } else {
            await new Promise((resolve, reject) => bus.i2cRead(addr, len, buf, (e, _bytes, _buf) => e ? reject(e) : resolve()));
        }
    } catch (e) { throw e; }
}

async function writeThenRead(bus, addr, writeBuf, readBuf) {
    await i2cWriteCompat(bus, addr, writeBuf.length, writeBuf);
    await i2cReadCompat(bus, addr, readBuf.length, readBuf);
}

async function probeDevice(bus) {
    try {
        if (process.env.DEBUG_EEPROM) console.error('[EEPROM] probe start bus=8 (transfer or emulate)');
        const writeBuf = Buffer.from([0x00, 0x00]);
        const readBuf = Buffer.alloc(1);
        const runnerTransfer = (bus.i2cTransfer ? (done) => bus.i2cTransfer(EEPROM_ADDR, [
            { byteLength: writeBuf.length, buffer: writeBuf },
            { byteLength: readBuf.length, buffer: readBuf, flags: I2C_M_RD },
        ], done) : null);
        const runnerEmulate = (done) => emulateTransfer(bus, EEPROM_ADDR, [
            { byteLength: writeBuf.length, buffer: writeBuf, flags: 0 },
            { byteLength: readBuf.length, buffer: readBuf, flags: I2C_M_RD },
        ], done);
        // 顺序尝试多种方式
        // 优先尝试直接写两字节指针再读 1 字节（兼容 promise/callback）
        try {
            await withTimeout(writeThenRead(bus, EEPROM_ADDR, writeBuf, readBuf), PROBE_TIMEOUT_MS, 'probe-writeThenRead');
            if (process.env.DEBUG_EEPROM) console.error('[EEPROM] probe success via writeThenRead first byte=', readBuf[0]);
        } catch (e) {
            if (process.env.DEBUG_EEPROM) console.error('[EEPROM] primary probe path failed', e.code, e.message);
            // 退回 emulate (callback 组合) 方式
            await withTimeout(new Promise((resolve, reject) => runnerEmulate(err => err ? reject(err) : resolve())), PROBE_TIMEOUT_MS, 'probe-emulate');
            if (process.env.DEBUG_EEPROM) console.error('[EEPROM] probe success via emulate first byte=', readBuf[0]);
        }
        return true;
    } catch (err) {
        if (process.env.DEBUG_EEPROM) console.error('[EEPROM] probe error', err.code, err.message);
        if (MISSING_DEVICE_CODES.includes(err.code)) return false;
        if (err.code === 'ETIMEOUT') {
            if (process.env.DEBUG_EEPROM) console.error('[EEPROM] probe timeout treated as not present');
            return false;
        }
        return false; // 其他错误也当作不存在，避免终止
    }
}

/**
 * Read raw bytes from EEPROM starting at offset 0.
 * This implementation uses page-safe small chunk reads to avoid issues with some chips.
 */
async function readRaw(bus, length = READ_LENGTH) {
    const PAGE = 32;
    const out = Buffer.alloc(length);
    let offset = 0;
    while (offset < length) {
        const chunk = Math.min(PAGE, length - offset);
        if (process.env.DEBUG_EEPROM) console.error(`[EEPROM] read page offset=${offset} size=${chunk} (${bus.i2cTransfer ? 'i2cTransfer' : 'emulate'})`);
        const addrHi = (offset >> 8) & 0xFF;
        const addrLo = offset & 0xFF;
        const ptrBuf = Buffer.from([addrHi, addrLo]);
        await withTimeout((async () => {
            const readBuf = Buffer.alloc(chunk);
            try {
                // 使用统一 promise/callback 兼容路径
                await writeThenRead(bus, EEPROM_ADDR, ptrBuf, readBuf);
            } catch (e) {
                if (process.env.DEBUG_EEPROM) console.error('[EEPROM] chunk writeThenRead failed trying emulate', e.code, e.message);
                await new Promise((resolve, reject) => emulateTransfer(bus, EEPROM_ADDR, [
                    { byteLength: 2, buffer: ptrBuf, flags: 0 },
                    { byteLength: chunk, buffer: readBuf, flags: I2C_M_RD },
                ], err => err ? reject(err) : resolve()));
            }
            readBuf.copy(out, offset);
        })(), READ_TIMEOUT_MS, `read@${offset}`);
        offset += chunk;
    }
    return out;
}

async function readRawPerByte(bus, length = READ_LENGTH) {
    const out = Buffer.alloc(length);
    for (let addr = 0; addr < length; addr++) {
        const addrHi = (addr >> 8) & 0xFF;
        const addrLo = addr & 0xFF;
        const ptrBuf = Buffer.from([addrHi, addrLo]);
        if (process.env.DEBUG_EEPROM && addr % 32 === 0) console.error(`[EEPROM] per-byte fallback offset=${addr}`);
        await withTimeout(new Promise((resolve, reject) => {
            emulateTransfer(bus, EEPROM_ADDR, [
                { byteLength: 2, buffer: ptrBuf, flags: 0 },
                { byteLength: 1, buffer: out.slice(addr, addr + 1), flags: I2C_M_RD },
            ], (err) => err ? reject(err) : resolve());
        }), READ_TIMEOUT_MS, `readByte@${addr}`);
    }
    return out;
}

/**
 * Heuristically trim padding (0xFF or 0x00) from the tail and attempt JSON parse.
 */
function extractJson(buffer) {
    // Convert to string first (assuming ASCII/UTF-8 JSON)
    // Strip trailing 0xFF/0x00
    let end = buffer.length;
    while (end > 0) {
        const b = buffer[end - 1];
        if (b === 0xFF || b === 0x00 || b === 0x0A || b === 0x0D) {
            end--;
            continue;
        }
        break;
    }
    const trimmed = buffer.slice(0, end).toString('utf8');
    // Find first '{' and last '}' to reduce noise / random data ahead or after
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    const candidate = trimmed.slice(first, last + 1);
    try {
        return JSON.parse(candidate);
    } catch (e) {
        return null;
    }
}

/**
 * Public function: read EEPROM and return parsed JSON or null if absent/not parseable.
 */
export async function readEepromJson(options = {}) {
    const {
        busNumber = DEFAULT_BUS,
        length = READ_LENGTH,
        raw = false, // if true returns Buffer even if JSON fails
        returnMeta = true,
    } = options;
    let bus;
    // 先检查设备节点是否存在，避免直接 open 抛出未捕获异常
    const devPath = `/dev/i2c-${busNumber}`;
    if (!fs.existsSync(devPath)) {
        if (process.env.DEBUG_EEPROM) console.error('[EEPROM] device node missing:', devPath);
        return returnMeta ? { present: false, json: null, raw: null, reason: 'bus-missing' } : null;
    }
    try {
        bus = await i2c.openPromisified(busNumber);
    } catch (openErr) {
        // 设备节点不存在或总线不可用时，按“不存在”处理
        if (['ENOENT', 'ENODEV', 'ENXIO'].includes(openErr.code)) {
            if (process.env.DEBUG_EEPROM) console.error('[EEPROM] open bus failed, treat as absent', openErr.code);
            return returnMeta ? { present: false, json: null, raw: null, reason: 'bus-missing' } : null;
        }
        throw openErr;
    }
    try {
        if (process.env.DEBUG_EEPROM && bus.i2cFuncs) {
            try { bus.i2cFuncs((e, f) => { if (!e) console.error('[EEPROM] i2cFuncs', f); }); } catch (_) { }
        }
        const present = await probeDevice(bus);
        if (!present) {
            return returnMeta ? { present: false, json: null, raw: null } : null;
        }
        let data;
        try {
            data = await readRaw(bus, length);
        } catch (readErr) {
            if (MISSING_DEVICE_CODES.includes(readErr.code)) {
                return returnMeta ? { present: false, json: null, raw: null } : null;
            }
            if (readErr.code === 'ETIMEOUT') {
                if (process.env.DEBUG_EEPROM) console.error('[EEPROM] read timeout treated as not present');
                // 尝试每字节回退
                try { if (process.env.DEBUG_EEPROM) console.error('[EEPROM] trying per-byte fallback'); data = await readRawPerByte(bus, length); }
                catch (pbErr) { if (process.env.DEBUG_EEPROM) console.error('[EEPROM] per-byte fallback failed', pbErr.code, pbErr.message); return returnMeta ? { present: false, json: null, raw: null } : null; }
                // 若成功读取 data 继续后续 JSON 解析
            }
            throw readErr;
        }
        const json = extractJson(data);
        if (returnMeta) return { present: true, json, raw: raw ? data : undefined };
        return json;
    } finally {
        await bus.close();
    }
}

// Helper: wrap a promise with timeout
function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            const err = new Error(`${label} timeout after ${ms}ms`);
            err.code = 'ETIMEOUT';
            reject(err);
        }, ms);
        promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
    });
}

export default readEepromJson;
