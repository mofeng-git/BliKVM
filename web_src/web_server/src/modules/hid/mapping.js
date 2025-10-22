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

class McuKey {
  constructor(code) {
      this.code = code;
  }
}

class UsbKey {
  constructor(code, isModifier) {
      this.code = code;
      this.isModifier = isModifier;
  }
}

class Key {
  constructor(mcu, usb) {
      this.mcu = mcu;
      this.usb = usb;
  }
}

const KEYMAP = {
  "KeyA": new Key(new McuKey(1), new UsbKey(4, false)),
  "KeyB": new Key(new McuKey(2), new UsbKey(5, false)),
  "KeyC": new Key(new McuKey(3), new UsbKey(6, false)),
  "KeyD": new Key(new McuKey(4), new UsbKey(7, false)),
  "KeyE": new Key(new McuKey(5), new UsbKey(8, false)),
  "KeyF": new Key(new McuKey(6), new UsbKey(9, false)),
  "KeyG": new Key(new McuKey(7), new UsbKey(10, false)),
  "KeyH": new Key(new McuKey(8), new UsbKey(11, false)),
  "KeyI": new Key(new McuKey(9), new UsbKey(12, false)),
  "KeyJ": new Key(new McuKey(10), new UsbKey(13, false)),
  "KeyK": new Key(new McuKey(11), new UsbKey(14, false)),
  "KeyL": new Key(new McuKey(12), new UsbKey(15, false)),
  "KeyM": new Key(new McuKey(13), new UsbKey(16, false)),
  "KeyN": new Key(new McuKey(14), new UsbKey(17, false)),
  "KeyO": new Key(new McuKey(15), new UsbKey(18, false)),
  "KeyP": new Key(new McuKey(16), new UsbKey(19, false)),
  "KeyQ": new Key(new McuKey(17), new UsbKey(20, false)),
  "KeyR": new Key(new McuKey(18), new UsbKey(21, false)),
  "KeyS": new Key(new McuKey(19), new UsbKey(22, false)),
  "KeyT": new Key(new McuKey(20), new UsbKey(23, false)),
  "KeyU": new Key(new McuKey(21), new UsbKey(24, false)),
  "KeyV": new Key(new McuKey(22), new UsbKey(25, false)),
  "KeyW": new Key(new McuKey(23), new UsbKey(26, false)),
  "KeyX": new Key(new McuKey(24), new UsbKey(27, false)),
  "KeyY": new Key(new McuKey(25), new UsbKey(28, false)),
  "KeyZ": new Key(new McuKey(26), new UsbKey(29, false)),
  "Digit1": new Key(new McuKey(27), new UsbKey(30, false)),
  "Digit2": new Key(new McuKey(28), new UsbKey(31, false)),
  "Digit3": new Key(new McuKey(29), new UsbKey(32, false)),
  "Digit4": new Key(new McuKey(30), new UsbKey(33, false)),
  "Digit5": new Key(new McuKey(31), new UsbKey(34, false)),
  "Digit6": new Key(new McuKey(32), new UsbKey(35, false)),
  "Digit7": new Key(new McuKey(33), new UsbKey(36, false)),
  "Digit8": new Key(new McuKey(34), new UsbKey(37, false)),
  "Digit9": new Key(new McuKey(35), new UsbKey(38, false)),
  "Digit0": new Key(new McuKey(36), new UsbKey(39, false)),
  "Enter": new Key(new McuKey(37), new UsbKey(40, false)),
  "Escape": new Key(new McuKey(38), new UsbKey(41, false)),
  "Backspace": new Key(new McuKey(39), new UsbKey(42, false)),
  "Tab": new Key(new McuKey(40), new UsbKey(43, false)),
  "Space": new Key(new McuKey(41), new UsbKey(44, false)),
  "Minus": new Key(new McuKey(42), new UsbKey(45, false)),
  "Equal": new Key(new McuKey(43), new UsbKey(46, false)),
  "BracketLeft": new Key(new McuKey(44), new UsbKey(47, false)),
  "BracketRight": new Key(new McuKey(45), new UsbKey(48, false)),
  "Backslash": new Key(new McuKey(46), new UsbKey(49, false)),
  "Semicolon": new Key(new McuKey(47), new UsbKey(51, false)),
  "Quote": new Key(new McuKey(48), new UsbKey(52, false)),
  "Backquote": new Key(new McuKey(49), new UsbKey(53, false)),
  "Comma": new Key(new McuKey(50), new UsbKey(54, false)),
  "Period": new Key(new McuKey(51), new UsbKey(55, false)),
  "Slash": new Key(new McuKey(52), new UsbKey(56, false)),
  "CapsLock": new Key(new McuKey(53), new UsbKey(57, false)),
  "F1": new Key(new McuKey(54), new UsbKey(58, false)),
  "F2": new Key(new McuKey(55), new UsbKey(59, false)),
  "F3": new Key(new McuKey(56), new UsbKey(60, false)),
  "F4": new Key(new McuKey(57), new UsbKey(61, false)),
  "F5": new Key(new McuKey(58), new UsbKey(62, false)),
  "F6": new Key(new McuKey(59), new UsbKey(63, false)),
  "F7": new Key(new McuKey(60), new UsbKey(64, false)),
  "F8": new Key(new McuKey(61), new UsbKey(65, false)),
  "F9": new Key(new McuKey(62), new UsbKey(66, false)),
  "F10": new Key(new McuKey(63), new UsbKey(67, false)),
  "F11": new Key(new McuKey(64), new UsbKey(68, false)),
  "F12": new Key(new McuKey(65), new UsbKey(69, false)),
  "PrintScreen": new Key(new McuKey(66), new UsbKey(70, false)),
  "Insert": new Key(new McuKey(67), new UsbKey(73, false)),
  "Home": new Key(new McuKey(68), new UsbKey(74, false)),
  "PageUp": new Key(new McuKey(69), new UsbKey(75, false)),
  "Delete": new Key(new McuKey(70), new UsbKey(76, false)),
  "End": new Key(new McuKey(71), new UsbKey(77, false)),
  "PageDown": new Key(new McuKey(72), new UsbKey(78, false)),
  "ArrowRight": new Key(new McuKey(73), new UsbKey(79, false)),
  "ArrowLeft": new Key(new McuKey(74), new UsbKey(80, false)),
  "ArrowDown": new Key(new McuKey(75), new UsbKey(81, false)),
  "ArrowUp": new Key(new McuKey(76), new UsbKey(82, false)),
  "ControlLeft": new Key(new McuKey(77), new UsbKey(1, true)),
  "ShiftLeft": new Key(new McuKey(78), new UsbKey(2, true)),
  "AltLeft": new Key(new McuKey(79), new UsbKey(4, true)),
  "MetaLeft": new Key(new McuKey(80), new UsbKey(8, true)),
  "ControlRight": new Key(new McuKey(81), new UsbKey(16, true)),
  "ShiftRight": new Key(new McuKey(82), new UsbKey(32, true)),
  "AltRight": new Key(new McuKey(83), new UsbKey(64, true)),
  "MetaRight": new Key(new McuKey(84), new UsbKey(128, true)),
  "Pause": new Key(new McuKey(85), new UsbKey(72, false)),
  "ScrollLock": new Key(new McuKey(86), new UsbKey(73, false)),
  "Numpad0": new Key(new McuKey(87), new UsbKey(82, false)),
  "Numpad1": new Key(new McuKey(88), new UsbKey(79, false)),
  "Numpad2": new Key(new McuKey(89), new UsbKey(80, false)),
  "Numpad3": new Key(new McuKey(90), new UsbKey(81, false)),
  "Numpad4": new Key(new McuKey(91), new UsbKey(75, false)),
  "Numpad5": new Key(new McuKey(92), new UsbKey(76, false)),
  "Numpad6": new Key(new McuKey(93), new UsbKey(77, false)),
  "Numpad7": new Key(new McuKey(94), new UsbKey(71, false)),
  "Numpad8": new Key(new McuKey(95), new UsbKey(72, false)),
  "Numpad9": new Key(new McuKey(96), new UsbKey(73, false)),
  "NumpadAdd": new Key(new McuKey(97), new UsbKey(69, false)),
  "NumpadSubtract": new Key(new McuKey(98), new UsbKey(69, false)),
  "NumpadMultiply": new Key(new McuKey(99), new UsbKey(69, false)),
  "NumpadDivide": new Key(new McuKey(100), new UsbKey(69, false)),
};

const WebModifiers = {
    SHIFT_LEFT: "ShiftLeft",
    SHIFT_RIGHT: "ShiftRight",
    SHIFTS: new Set(["ShiftLeft", "ShiftRight"]),
  
    ALT_LEFT: "AltLeft",
    ALT_RIGHT: "AltRight",
    ALTS: new Set(["AltLeft", "AltRight"]),
  
    CTRL_LEFT: "ControlLeft",
    CTRL_RIGHT: "ControlRight",
    CTRLS: new Set(["ControlLeft", "ControlRight"]),
  };

  

  export {KEYMAP, WebModifiers };