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

import { RECORD_DIR } from '../common/constants.js';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import Logger from '../log/logger.js';

const logger = new Logger();

class Recorder {
    static _instance = null;
    _recordering = false;
    _fileStream = null;
    _currentFile = null;
    _idleTimer = null;
    _idleTimeoutMs = 60000; // 默认 60s 无事件自动停止
    constructor() {
        if (!Recorder._instance) {
            Recorder._instance = this;
            if (!fs.existsSync(RECORD_DIR)) {
                fs.mkdirSync(RECORD_DIR, { recursive: true });
            }
        }
        return Recorder._instance;
    }

    /**
     * 开始录制
     * @param {string} filename 传入的文件名(不含扩展名或可含). 自动追加 .json
     * @returns {object} { ok:true, file: 'xxx.json', fullPath }
     */
    startRecording(filename, options = {}) {
        if (this._recordering) {
            return { ok: false, error: 'already recording' };
        }
        if (!filename || typeof filename !== 'string') {
            return { ok: false, error: 'invalid filename' };
        }
        // 配置空闲自动停止超时时间
        const idleMs = Number(options.idleTimeoutMs);
        if (!Number.isNaN(idleMs) && idleMs > 0) {
            this._idleTimeoutMs = idleMs;
        } else {
            this._idleTimeoutMs = 60000;
        }
        // 安全化文件名
        let base = filename.trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
        if (base.length === 0) base = 'record';
        if (!base.endsWith('.json')) base += '.json';
        const fullPath = path.join(RECORD_DIR, base);

        if (fs.existsSync(fullPath)) {
            return { ok: false, error: 'file exists' };
        }

        try {
            this._fileStream = fs.createWriteStream(fullPath, { flags: 'wx' });
            this._recordering = true;
            this._currentFile = fullPath;
            this._hasFirst = false; // 重置首条标志
            this._hires = (typeof performance !== 'undefined' && performance.now) ? true : false;
            const baseNow = Date.now();
            this._startTime = baseNow; // 记录开始绝对时间(ms)
            this._startPerf = this._hires ? performance.now() : baseNow; // 高精度起点
            this._lastEventTime = this._startPerf; // 上一事件时间（统一使用 _startPerf 参考系）
            // 可先写一个空数组开头或元数据
            this._fileStream.write('[\n'); // 后续事件以 JSON 对象+逗号写入，stop 时补 ']'
            // 启动空闲自动停止计时
            this._armIdleTimer();
            return { ok: true, file: base, fullPath };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    /**
     * 停止录制并关闭文件
     */
    stopRecording() {
        if (!this._recordering) return { ok: false, error: 'not recording' };
        this._recordering = false;
        this._clearIdleTimer();
        logger.info('Recorder: stop HID Record');
        if (this._fileStream) {
            // 尝试去掉最后一个逗号（如果有的话）简单方案：追加一个占位再关闭
            this._fileStream.write('\n]\n');
            this._fileStream.end();
            const f = this._currentFile;
            this._fileStream = null;
            this._currentFile = null;
            return { ok: true, file: f };
        }

        return { ok: true };
    }

    /**
     * 可在后续添加写事件的方法
     * @param {object} eventObj
     */
    appendEvent(eventObj, type) {
        if (!this._recordering || !this._fileStream) return false;

        // 计算与上一条的间隔 (毫秒)
        const now = this._hires ? performance.now() : Date.now();
        let dt = 0;
        // 第一条事件 dt 固定为 0；之后按与上一条的间隔计算
        if (this._hasFirst) {
            dt = now - this._lastEventTime;
        } else {
            dt = 0;
        }
        this._lastEventTime = now;

        // 有新事件，重置空闲自动停止计时
        this._armIdleTimer();

        // 外层包裹：{ type, dt, event }
        // 优先使用调用方传入的 type；若未传且事件自身含有 type，则抽取后从 payload 移除
        let evType = type;
        const payload = (eventObj && typeof eventObj === 'object') ? { ...eventObj } : eventObj;
        if (evType === undefined && payload && typeof payload === 'object' && 'type' in payload) {
            evType = payload.type;
            // 不把内部 type 保留到 payload
            try { delete payload.type; } catch (_) {}
        }
        // 确保 payload 不带 dt（统一外层携带）
        if (payload && typeof payload === 'object' && 'dt' in payload) {
            try { delete payload.dt; } catch (_) {}
        }

        const envelope = {
            type: evType,
            dt: Math.round(dt),
            event: payload
        };

        const line = JSON.stringify(envelope);
        if (!this._hasFirst) {
            this._fileStream.write(`  ${line}`);
            this._hasFirst = true;
        } else {
            this._fileStream.write(`,\n  ${line}`);
        }
        return true;
    }

    isRecording() {
        return this._recordering;
    }

    

    // 内部：启动/重置空闲自动停止计时器
    _armIdleTimer() {
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
            this._idleTimer = null;
        }
        if (this._idleTimeoutMs > 0) {
            this._idleTimer = setTimeout(() => {
                if (this._recordering) {
                    // 自动停止录制，避免长时间无事件导致录制挂起
                    try { this.stopRecording(); } catch (_) {}
                }
            }, this._idleTimeoutMs);
        }
    }

    // 内部：清理空闲自动停止计时器
    _clearIdleTimer() {
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
            this._idleTimer = null;
        }
    }

}

export { Recorder };