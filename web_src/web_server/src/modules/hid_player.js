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

import fs from 'fs';
import path from 'path';
import { RECORD_DIR } from '../common/constants.js';
import Mouse from '../server/mouse.js';
import Keyboard from '../server/keyboard.js';

function resolveRecordFile(basename) {
  if (!basename || basename.includes('/') || basename.includes('..')) {
    return null;
  }
  const full = path.join(RECORD_DIR, basename);
  if (!fs.existsSync(full)) return null;
  return full;
}

function readEventsFromFile(fullPath) {
  const text = fs.readFileSync(fullPath, 'utf8');
  // 文件是有效的 JSON 数组: [\n  {...},\n  {...}\n]\n
  try {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch (e) {
    // 兜底：尝试按行解析（若出现尾逗号导致语法问题，可扩展为 JSONL 解析）
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const events = [];
    for (const line of lines) {
      if (line === '[' || line === ']') continue;
      const clean = line.replace(/,\s*$/, '');
      try { events.push(JSON.parse(clean)); } catch (_) {}
    }
    return events;
  }
}

class HIDPlayer {
  constructor() {
    this._mouse = new Mouse();
    this._keyboard = new Keyboard();
    this._timer = null;
    this._stopped = false;
  }

  stop() {
    this._stopped = true;
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
  }

  /**
   * 回放指定文件，按照 { type, dt, event } 依次调度
   * @param {string} fileName - 录制文件名（位于 RECORD_DIR 下的 basename）
   * @param {{ speed?: number, onEnd?: Function }} options
   * @returns {{ stop: Function }} 控制器
   */
  play(fileName, { speed = 1.0, onEnd } = {}) {
    const full = resolveRecordFile(fileName);
    if (!full) throw new Error('record file not found or invalid name');

    const events = readEventsFromFile(full);
    let idx = 0;
    let acc = 0; // 累计延迟
    this._stopped = false;

    const dispatch = (env) => {
      const { type, event } = env || {};
      if (type === 'mouse') {
        this._mouse.handleEvent(event);
      } else if (type === 'keyboard') {
        this._keyboard.handleEvent(event.keys);
      } else {

      }
    };

    const next = () => {
      if (this._stopped) return;
      if (idx >= events.length) {
        if (onEnd) onEnd();
        return;
      }
      const env = events[idx++];
      const dt = Math.max(0, Number(env?.dt ?? 0));
      const delay = speed > 0 ? Math.round(dt / speed) : 0;
      acc += delay;
      this._timer = setTimeout(() => {
        dispatch(env);
        next();
      }, delay);
    };

    next();
    return { stop: () => this.stop() };
  }
}

const hidPlayer = new HIDPlayer();
export { HIDPlayer, hidPlayer };
