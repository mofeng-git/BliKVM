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
import { makeKeyboardReport ,  ModifierEvent, KeyEvent } from './event.js';

class KeyboardProcessor {
    constructor() {
        this.__pressed_modifiers = new Set(); // 存储按下的修饰键
        this.__pressed_keys = Array(6).fill(null); // 假设最多可以有6个按下的键
    }

    processEvent(event) {
        if (event instanceof ModifierEvent) {
            return this.processModifierEvent(event);
        } else if (event instanceof KeyEvent) {
            return this.processKeyEvent(event);
        } else {
            throw new Error(`Not implemented event: ${event}`);
        }
    }

    // 处理修饰键事件
    processModifierEvent(event) {
        if (this.__pressed_modifiers.has(event.modifier)) {
            // 之前按下的修饰键被释放
            this.__pressed_modifiers.delete(event.modifier);
            return this.__make_report();
        }
        if (event.state) {
            // 按下修饰键
            this.__pressed_modifiers.add(event.modifier);
            return this.__make_report();
        }
    }

    // 处理普通键事件
    processKeyEvent(event) {
        const keyIndex = this.__pressed_keys.indexOf(event.key);
        if (keyIndex !== -1) {
            // 之前按下的键被释放
            this.__pressed_keys[keyIndex] = null;
            return this.__make_report();
        } else if (event.state && this.__pressed_keys.includes(null) === false) {
            // 如果没有空位，并且需要按下一个新的键，释放所有键
            this.__clear_keys();
            return this.__make_report();
        }
        if (event.state) {
            // 按下新的键
            const emptySlotIndex = this.__pressed_keys.indexOf(null);
            if (emptySlotIndex !== -1) {
                this.__pressed_keys[emptySlotIndex] = event.key;
                return this.__make_report();
            }
        }
    }

    // 生成报告的函数
    __make_report() {
        // 假设你在这里生成报告，具体实现根据你的需求来
        return makeKeyboardReport(this.__pressed_modifiers, this.__pressed_keys);
    }

    // 清除所有按键的状态
    __clear_keys() {
        this.__pressed_keys.fill(null);
    }
}

export default KeyboardProcessor;