
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
const keytoCode = (key) => {
  // console.log("keytoCode:",key)
  return (
    {
      "{backspace}": "Backspace",
      "{tab}": "Tab",
      "{enter}": "Enter",
      "{shiftleft}": "ShiftLeft",
      "{shiftright}": "ShiftRight",
      "{altleft}": "AltLeft",
      "{altright}": "AltRight",
      "{prtscr}": "PrtScr",
      "{pause}": "Pause",
      "{scrolllock}": "ScrollLock",
      "{controlleft}": "ControlLeft",
      "{controlright}": "ControlRight",
      "{metaleft}": "MetaLeft",
      "{metaright}": "MetaRight",
      //
      "{capslock}": "CapsLock",
      //
      "{escape}": "Escape",
      "{space}": "Space",
      "{pageup}": "PageUp",
      "{pagedown}": "PageDown",
      "{end}": "End",
      "{home}": "Home",
      "{arrowleft}": "ArrowLeft",
      "{arrowup}": "ArrowUp",
      "{arrowright}": "ArrowRight",
      "{arrowdown}": "ArrowDown",
      "{insert}": "Insert",
      "{delete}": "Delete",
      // Digits keys
      1: "Digit1",
      2: "Digit2",
      3: "Digit3",
      4: "Digit4",
      5: "Digit5",
      6: "Digit6",
      7: "Digit7",
      8: "Digit8",
      9: "Digit9",
      0: "Digit0",
      //
      "!": "Digit1", // ! maps to the '1' key
      "@": "Digit2", // @ maps to the '2' key
      "#": "Digit3", // # maps to the '3' key
      $: "Digit4", // $ maps to the '4' key
      "%": "Digit5", // % maps to the '5' key
      "^": "Digit6", // ^ maps to the '6' key
      "&": "Digit7", // & maps to the '7' key
      "*": "Digit8", // * maps to the '8' key
      "(": "Digit9", // ( maps to the '9' key
      ")": "Digit0", // ) maps to the '0' key

      a: "KeyA",
      b: "KeyB",
      c: "KeyC",
      d: "KeyD",
      e: "KeyE",
      f: "KeyF",
      g: "KeyG",
      h: "KeyH",
      i: "KeyI",
      j: "KeyJ",
      k: "KeyK",
      l: "KeyL",
      m: "KeyM",
      n: "KeyN",
      o: "KeyO",
      p: "KeyP",
      q: "KeyQ",
      r: "KeyR",
      s: "KeyS",
      t: "KeyT",
      u: "KeyU",
      v: "KeyV",
      w: "KeyW",
      x: "KeyX",
      y: "KeyY",
      z: "KeyZ",
      //
      A: "KeyA",
      B: "KeyB",
      C: "KeyC",
      D: "KeyD",
      E: "KeyE",
      F: "KeyF",
      G: "KeyG",
      H: "KeyH",
      I: "KeyI",
      J: "KeyJ",
      K: "KeyK",
      L: "KeyL",
      M: "KeyM",
      N: "KeyN",
      O: "KeyO",
      P: "KeyP",
      Q: "KeyQ",
      R: "KeyR",
      S: "KeyS",
      T: "KeyT",
      U: "KeyU",
      V: "KeyV",
      W: "KeyW",
      X: "KeyX",
      Y: "KeyY",
      Z: "KeyZ",
      "-": "Minus",
      _: "Minus",
      "=": "Equal",
      "+": "Equal",
      "[": "BracketLeft",
      "{": "BracketLeft",
      "]": "BracketRight",
      "}": "BracketRight",
      "|": "Backslash",
      "\\": "Backslash",
      "`": "Backquote",
      "~": "Backquote",
      ";": "Semicolon",
      ":": "Semicolon",
      "'": "Quote",
      '"': "Quote",
      ",": "Comma",
      "<": "Comma",
      ".": "Period",
      ">": "Period",
      "/": "Slash",
      "?": "Slash",

      // Numpad keys
      "{numpad0}": "Numpad0",
      "{numpad1}": "Numpad1",
      "{numpad2}": "Numpad2",
      "{numpad3}": "Numpad3",
      "{numpad4}": "Numpad4",
      "{numpad5}": "Numpad5",
      "{numpad6}": "Numpad6",
      "{numpad7}": "Numpad7",
      "{numpad8}": "Numpad8",
      "{numpad9}": "Numpad9",
      "{numlock}": "numlock",
      "{numpadmultiply}": "NumpadMultiply",
      "{numpadadd}": "NumpadAdd",
      "{numpadsubtract}": "NumpadSubtract",
      "{numpaddecimal}": "NumpadDecimal",
      "{numpaddivide}": "NumpadDivide",
      "{numpadenter}": "NumpadEnter",
      // Function keys
      "{f1}": "F1",
      "{f2}": "F2",
      "{f3}": "F3",
      "{f4}": "F4",
      "{f5}": "F5",
      "{f6}": "F6",
      "{f7}": "F7",
      "{f8}": "F8",
      "{f9}": "F9",
      "{f10}": "F10",
      "{f11}": "F11",
      "{f12}": "F12",
    }[key] ||
    key ||
    ""
  );
};

export { keytoCode };
