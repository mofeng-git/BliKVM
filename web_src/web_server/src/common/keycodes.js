// Centralized whitelist of supported KeyboardEvent.code values
// Used by APIs that accept key sequences (e.g., shortcuts)

export const ALLOWED_KEY_CODES = new Set([
  // Controls
  'Backspace','Tab','Enter','ShiftLeft','ShiftRight','AltLeft','AltRight',
  'PrintScreen','Pause','ScrollLock','ControlLeft','ControlRight','MetaLeft','MetaRight',
  'CapsLock','Escape','Space','PageUp','PageDown','End','Home',
  'ArrowLeft','ArrowUp','ArrowRight','ArrowDown','Insert','Delete',

  // Digits
  'Digit0','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9',

  // Letters
  'KeyA','KeyB','KeyC','KeyD','KeyE','KeyF','KeyG','KeyH','KeyI','KeyJ','KeyK','KeyL','KeyM',
  'KeyN','KeyO','KeyP','KeyQ','KeyR','KeyS','KeyT','KeyU','KeyV','KeyW','KeyX','KeyY','KeyZ',

  // Symbols
  'Minus','Equal','BracketLeft','BracketRight','Backslash','Backquote','Semicolon','Quote',
  'Comma','Period','Slash',

  // Numpad
  'Numpad0','Numpad1','Numpad2','Numpad3','Numpad4','Numpad5','Numpad6','Numpad7','Numpad8','Numpad9',
  'NumLock','NumpadMultiply','NumpadAdd','NumpadSubtract','NumpadDecimal','NumpadDivide','NumpadEnter',

  // Function keys
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
]);

export function isValidKeyCode(code) {
  return typeof code === 'string' && ALLOWED_KEY_CODES.has(code.trim());
}
