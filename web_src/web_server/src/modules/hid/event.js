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
import {KEYMAP} from './mapping.js';


// USB 键类的定义
class KeyEvent{
    constructor(key, state) {
        this.key = key;   // 按键的 USB 信息
        this.state = state;  // 按键的状态（按下或松开）

        // 确保这个按键不是修饰键
        if (this.key.isModifier) {
            throw new Error("KeyEvent cannot be a modifier key.");
        }
    }
}

class ModifierEvent {
    constructor(modifier, state) {
        this.modifier = modifier;  // 修饰键的 USB 信息
        this.state = state;        // 修饰键的状态（按下或松开）

        // 确保这是一个修饰键
        if (!this.modifier.isModifier) {
            throw new Error("ModifierEvent must be for a modifier key.");
        }
    }
}

function makeKeyboardEvent(key, state) {
    const usbKey = KEYMAP[key].usb; // 获取键盘映射中的 USB 键信息
    
    // 如果是修饰键，返回 ModifierEvent
    if (usbKey.isModifier) {
        return new ModifierEvent(usbKey, state);
    }

    // 否则返回普通的 KeyEvent
    return new KeyEvent(usbKey, state);
}

function makeKeyboardReport(pressedModifiers, pressedKeys) {
    let modifiers = 0;
    for (const modifier of pressedModifiers) {
        modifiers |= modifier.code;
    }

    if (pressedKeys.length !== 6) {
        throw new Error('pressedKeys must have a length of 6');
    }

    const keys = pressedKeys.map(key => (key === null ? 0 : key.code));

    return Buffer.from([modifiers, 0, ...keys]);
}

export {KeyEvent, ModifierEvent, makeKeyboardEvent, makeKeyboardReport};