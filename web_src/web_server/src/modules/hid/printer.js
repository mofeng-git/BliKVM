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

import ffi from 'ffi-napi';
import ref from 'ref-napi';
import { SymmapModifiers, getSysmap } from './keysym.js';
import { WebModifiers } from './mapping.js';
import Logger from '../../log/logger.js';

const logger = new Logger();

// 定义 XKB 字符串类型
const uint32 = ref.types.uint32;

// 加载 xkbcommon 库
const libxkbcommon = ffi.Library('libxkbcommon', {
    'xkb_utf32_to_keysym': ['uint32', ['uint32']], // xkb_utf32_to_keysym 函数
});

// 将字符转换为 keysym
const chToKeysym = (ch) => {
    if (ch.length !== 1) {
        logger.error(`Input must be a single character${ch}`);
        return null;
    }
    return libxkbcommon.xkb_utf32_to_keysym(ch.charCodeAt(0));
};

function* textToWebKeys(text, lang) {
    const symmap = getSysmap(lang);
    if(symmap === null) {
        logger.error(`symmao is null, Unsupported language: ${lang}`);
        return null;
    }
    let shift = false;
    let altgr = false;
  
    for (let ch of text) {
      let keys = null;
  
      if (ch === "\n") {
        keys = { 0: "Enter" };
      } else if (ch === "\t") {
        keys = { 0: "Tab" };
      } else if (ch === " ") {
        keys = { 0: "Space" };
      } else {
        if (["‚", "‘", "’"].includes(ch)) {
          ch = "'";
        } else if (["„", "“", "”"].includes(ch)) {
          ch = "\"";
        } else if (ch === "–") {  // Short dash
          ch = "-";
        } else if (ch === "—") {  // Long dash
          ch = "--";
        }
        
        if (!/^[\x20-\x7E\u00A0-\uD7FF\uE000-\uFFFF\u2000-\u206F\u2E00-\u2E7F\u2100-\u27BF\u2B50\u2764\uFEFF]+$/u.test(ch)) {
          logger.info(`Skipping non-printable character: ${ch}`);
          continue; // Skip non-printable characters
        }
        try {
          const keysym = chToKeysym(ch);
          if (keysym === null) {
            continue;
          }
          keys = symmap[keysym];
        } catch (error) {
          continue;
        }
      }
  
      for (let [modifiers, key] of Object.entries(keys)) {
        modifiers = parseInt(modifiers); // Convert to integer
  
        // Handle SHIFT modifier
        if ((modifiers & SymmapModifiers.SHIFT) && !shift) {
          yield [WebModifiers.SHIFT_LEFT, true];
          shift = true;
        } else if (!(modifiers & SymmapModifiers.SHIFT) && shift) {
          yield [WebModifiers.SHIFT_LEFT, false];
          shift = false;
        }
  
        // Handle ALTGR modifier
        if ((modifiers & SymmapModifiers.ALTGR) && !altgr) {
          yield [WebModifiers.ALT_RIGHT, true];
          altgr = true;
        } else if (!(modifiers & SymmapModifiers.ALTGR) && altgr) {
          yield [WebModifiers.ALT_RIGHT, false];
          altgr = false;
        }
  
        // Yield the key press and release
        yield [key, true];
        yield [key, false];
        break;
      }
    }
  
    // If shift or altgr is still active, release them at the end
    if (shift) {
      yield [WebModifiers.SHIFT_LEFT, false];
    }
    if (altgr) {
      yield [WebModifiers.ALT_RIGHT, false];
    }
  }

export {chToKeysym, textToWebKeys};

