
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
/**
 * This module defines the keyboard event handler.
 * @module api/http_api/keyboard
 */


import Logger from '../log/logger.js';
import HIDDevice from '../modules/hid_devices.js';
import { textToWebKeys } from '../modules/hid/printer.js';
import { makeKeyboardEvent } from '../modules/hid/event.js';
import KeyboardProcessor from '../modules/hid/keyboard_processor.js';

const logger = new Logger();

class Keyboard extends HIDDevice {

  constructor() {
    if (!Keyboard._instance) {
      super();
      Keyboard._instance = this;
      this._devicePath = '/dev/hidg0';
      this.open();
      this.startWriteToHid();
    }
    return Keyboard._instance;
  }

  /**
   * Handles the keyboard event and writes the keyboard data to /dev/hidg0.
   * @param {Event} event - The keyboard event.
   */
  handleEvent(event) {
    const keyboardData = this._packData(event);
    this.writeToQueue(keyboardData);
  }

  pasteData(data, lang) {
    const web_keys = textToWebKeys(data, lang);
    if (web_keys === null) {
      return false;
    }
    const keyboardProcessor = new KeyboardProcessor();
  
    let delay = 0;
    for (let [key, state] of web_keys) {
      setTimeout(() => {
        const event = makeKeyboardEvent(key, state);
        const data = keyboardProcessor.processEvent(event);
        this.writeToQueue(data);
      }, delay);
      delay += 5;
    }
    return true;
  }
  

  shortcuts(data) {
    this.handleEvent(data);
    setTimeout(() => {
      const releaseData = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
      this._writeData(releaseData);
    }, 50);
  }

  /**
   * Packs the given data into a binary format.
   * @param {string[]} data - The array of keycodes to be packed.
   * @returns {Uint8Array} - The packed binary data.
   * @private
   */
  _packData(data) {
    const special = [
      'ShiftLeft',
      'ControlLeft',
      'AltLeft',
      'MetaLeft',
      'MetaRight',
      'ShiftRight',
      'ControlRight',
      'AltRight'
    ];
    let d1 = 0;
    const dn = [];

    for (const keycode of data) {
      if (special.includes(keycode)) {
        d1 = this._addSpecialKey(d1, keycode);
      } else {
        this._addNormalKey(dn, keycode);
      }
    }

    if (dn.length < 6) {
      const pad = 6 - dn.length;
      for (let i = 0; i < pad; i++) {
        dn.push(0);
      }
    }

    const binData = new Uint8Array([d1, 0, dn[0], dn[1], dn[2], dn[3], dn[4], dn[5]]);
    return binData;
  }

  /**
   * Adds a special key to the current key value.
   * @param {number} current - The current key value.
   * @param {string} add - The special key to add.
   * @returns {number} - The updated key value.
   * @private
   */
  _addSpecialKey(current, add) {
    const shift = 0x02;
    const ctrl = 0x01;
    const alt = 0x04;
    const cmd = 0x08;
    const rctrl = 0x10;
    const rshift = 0x20;
    const ralt = 0x40;
    const rcmd = 0x80;

    if (add === 'ShiftLeft') {
      current |= shift;
    }
    if (add === 'ControlLeft') {
      current |= ctrl;
    }
    if (add === 'AltLeft') {
      current |= alt;
    }
    if (add === 'MetaLeft') {
      current |= cmd;
    }
    if (add === 'ShiftRight') {
      current |= rshift;
    }
    if (add === 'ControlRight') {
      current |= rctrl;
    }
    if (add === 'AltRight') {
      current |= ralt;
    }
    if (add === 'MetaRight') {
      current |= rcmd;
    }

    return current;
  }

  /**
   * Adds a normal key to the current array.
   * @param {Array} current - The current array of keys.
   * @param {string} add - The key to be added.
   * @private
   */
  _addNormalKey(current, add) {
    if (current.length > 6) {
      return;
    }
    const keycode = this._keyCodeMapping(add);
    current.push(keycode);
  }

  /**
   * Maps a keyboard code to a corresponding value.
   * @param {string} bCode - The keyboard code to be mapped.
   * @returns {number|string} - The mapped value for the keyboard code.
   * @private
   */
  _keyCodeMapping(bCode) {
    const mapping = {
      KeyA: 4,
      KeyB: 5,
      KeyC: 6,
      KeyD: 7,
      KeyE: 8,
      KeyF: 9,
      KeyG: 10,
      KeyH: 11,
      KeyI: 12,
      KeyJ: 13,
      KeyK: 14,
      KeyL: 15,
      KeyM: 16,
      KeyN: 17,
      KeyO: 18,
      KeyP: 19,
      KeyQ: 20,
      KeyR: 21,
      KeyS: 22,
      KeyT: 23,
      KeyU: 24,
      KeyV: 25,
      KeyW: 26,
      KeyX: 27,
      KeyY: 28,
      KeyZ: 29,
      Digit1: 30,
      Digit2: 31,
      Digit3: 32,
      Digit4: 33,
      Digit5: 34,
      Digit6: 35,
      Digit7: 36,
      Digit8: 37,
      Digit9: 38,
      Digit0: 39,
      Enter: 40,
      Escape: 41,
      Backspace: 42,
      Tab: 43,
      Space: 44,
      Minus: 45,
      Equal: 46,
      BracketLeft: 47,
      BracketRight: 48,
      Backslash: 49,
      Semicolon: 51,
      Quote: 52,
      Backquote: 53,
      Comma: 54,
      Period: 55,
      Slash: 56,
      CapsLock: 57,
      F1: 58,
      F2: 59,
      F3: 60,
      F4: 61,
      F5: 62,
      F6: 63,
      F7: 64,
      F8: 65,
      F9: 66,
      F10: 67,
      F11: 68,
      F12: 69,
      PrtSc: 70,
      ScrollLock: 71,
      Pause: 72,
      Insert: 73,
      Home: 74,
      PgUp: 75,
      Delete: 76,
      End: 77,
      PgDn: 78,
      ArrowRight: 79,
      ArrowLeft: 80,
      ArrowDown: 81,
      ArrowUp: 82,
      NumLock: 83,
      NumpadDivide: 84,
      NumpadMultiply: 85,
      NumpadSubtract: 86,
      NumpadAdd: 87,
      NumpadEnter: 88,
      Numpad1: 89,
      Numpad2: 90,
      Numpad3: 91,
      Numpad4: 92,
      Numpad5: 93,
      Numpad6: 94,
      Numpad7: 95,
      Numpad8: 96,
      Numpad9: 97,
      Numpad0: 98,
      NumpadDecimal: 99
    };

    if (Object.prototype.hasOwnProperty.call(mapping, bCode)) {
      return mapping[bCode];
    }

    return bCode;
  }

  _charKeyCodeMapping(char) {
    const mapping = {
      'a': 4, 'b': 5, 'c': 6, 'd': 7, 'e': 8, 'f': 9, 'g': 10, 'h': 11, 'i': 12,
      'j': 13, 'k': 14, 'l': 15, 'm': 16, 'n': 17, 'o': 18, 'p': 19, 'q': 20,
      'r': 21, 's': 22, 't': 23, 'u': 24, 'v': 25, 'w': 26, 'x': 27, 'y': 28, 'z': 29,
      '1': 30, '2': 31, '3': 32, '4': 33, '5': 34, '6': 35, '7': 36, '8': 37, '9': 38, '0': 39,
      '\n': 40, '\t': 43, ' ': 44, '-': 45, '=': 46, '[': 47, ']': 48, '\\': 49,
      ';': 51, "'": 52, '`': 53, ',': 54, '.': 55, '/': 56
    };

    const shiftMapping = {
      'A': 4, 'B': 5, 'C': 6, 'D': 7, 'E': 8, 'F': 9, 'G': 10, 'H': 11, 'I': 12,
      'J': 13, 'K': 14, 'L': 15, 'M': 16, 'N': 17, 'O': 18, 'P': 19, 'Q': 20,
      'R': 21, 'S': 22, 'T': 23, 'U': 24, 'V': 25, 'W': 26, 'X': 27, 'Y': 28, 'Z': 29,
      '!': 30, '@': 31, '#': 32, '$': 33, '%': 34, '^': 35, '&': 36, '*': 37,
      '(': 38, ')': 39, '_': 45, '+': 46, '{': 47, '}': 48, '|': 49, ':': 51,
      '"': 52, '~': 53, '<': 54, '>': 55, '?': 56
    };

    if (mapping.hasOwnProperty(char)) {
      return [false, mapping[char]];
    }

    if (shiftMapping.hasOwnProperty(char)) {
      return [true, shiftMapping[char]];
    }

    return [false, 0];
  }

  _char2hid(char) {
    let d1 = 0;
    let dn = [];
    const [needShift, code] = this._charKeyCodeMapping(char);

    if (needShift) {
      d1 |= 0x02;
    }

    dn[0] = code;

    // Node.js uses Buffer for binary data
    const buffer = Buffer.alloc(8);
    buffer.writeUInt8(d1, 0);
    buffer.writeUInt8(0, 1);
    buffer.writeUInt8(dn[0], 2);
    buffer.writeUInt8(0, 3);
    buffer.writeUInt8(0, 4);
    buffer.writeUInt8(0, 5);
    buffer.writeUInt8(0, 6);
    buffer.writeUInt8(0, 7);

    return buffer;
  }

}

export default Keyboard;
