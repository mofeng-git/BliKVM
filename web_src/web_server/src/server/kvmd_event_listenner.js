import fs from 'fs';
import path from 'path';
import EvdevReader from 'evdev';  
import Logger from '../log/logger.js';
import Keyboard from './keyboard.js';
import Mouse from './mouse.js';
import { CONFIG_PATH, UTF8 } from '../common/constants.js';


const logger = new Logger();

const EventCodeToHIDCode = {
  "KEY_BACKSPACE": "Backspace",
  "KEY_TAB": "Tab",
  "KEY_ENTER": "Enter",
  "KEY_LEFTSHIFT": "ShiftLeft",
  "KEY_RIGHTSHIFT": "ShiftRight",
  "KEY_LEFTALT": "AltLeft",
  "KEY_RIGHTALT": "AltRight",
  "KEY_SYSRQ": "PrtScr",
  "KEY_PAUSE": "Pause",
  "KEY_SCROLLLOCK": "ScrollLock",
  "KEY_LEFTCTRL": "ControlLeft",
  "KEY_RIGHTCTRL": "ControlRight",
  "KEY_LEFTMETA": "MetaLeft",
  "KEY_RIGHTMETA": "MetaRight",
  //
  "KEY_CAPSLOCK": "CapsLock",
  //
  "KEY_ESC": "Escape",
  "KEY_SPACE": "Space",
  "KEY_PAGEUP": "PageUp",
  "KEY_PAGEDOWN": "PageDown",
  "KEY_END": "End",
  "KEY_HOME": "Home",
  "KEY_LEFT": "ArrowLeft",
  "KEY_UP": "ArrowUp",
  "KEY_RIGHT": "ArrowRight",
  "KEY_DOWN": "ArrowDown",
  "KEY_INSERT": "Insert",
  "KEY_DELETE": "Delete",
  // Digits keys
  "KEY_1": "Digit1",
  "KEY_2": "Digit2",
  "KEY_3": "Digit3",
  "KEY_4": "Digit4",
  "KEY_5": "Digit5",
  "KEY_6": "Digit6",
  "KEY_7": "Digit7",
  "KEY_8": "Digit8",
  "KEY_9": "Digit9",
  "KEY_0": "Digit0",
  //
  "KEY_A": "KeyA",
  "KEY_B": "KeyB",
  "KEY_C": "KeyC",
  "KEY_D": "KeyD",
  "KEY_E": "KeyE",
  "KEY_F": "KeyF",
  "KEY_G": "KeyG",
  "KEY_H": "KeyH",
  "KEY_I": "KeyI",
  "KEY_J": "KeyJ",
  "KEY_K": "KeyK",
  "KEY_L": "KeyL",
  "KEY_M": "KeyM",
  "KEY_N": "KeyN",
  "KEY_O": "KeyO",
  "KEY_P": "KeyP",
  "KEY_Q": "KeyQ",
  "KEY_R": "KeyR",
  "KEY_S": "KeyS",
  "KEY_T": "KeyT",
  "KEY_U": "KeyU",
  "KEY_V": "KeyV",
  "KEY_W": "KeyW",
  "KEY_X": "KeyX",
  "KEY_Y": "KeyY",
  "KEY_Z": "KeyZ",
  "KEY_MINUS": "Minus",
  "KEY_EQUAL": "Equal",
  "KEY_LEFTBRACE": "BracketLeft",
  "KEY_RIGHTBRACE": "BracketRight",

  "KEY_BACKSLASH": "Backslash",
  "KEY_GRAVE": "Backquote",
  "KEY_SEMICOLON": "Semicolon",
  "KEY_APOSTROPHE": "Quote",
  "KEY_COMMA": "Comma",
  "KEY_DOT": "Period",
  "KEY_SLASH": "Slash",

  // Numpad keys
  "KEY_KP0": "Numpad0",
  "KEY_KP1": "Numpad1",
  "KEY_KP2": "Numpad2",
  "KEY_KP3": "Numpad3",
  "KEY_KP4": "Numpad4",
  "KEY_KP5": "Numpad5",
  "KEY_KP6": "Numpad6",
  "KEY_KP7": "Numpad7",
  "KEY_KP8": "Numpad8",
  "KEY_KP9": "Numpad9",

  
  "KEY_NUMLOCK": "numlock",
  "KEY_KPASTERISK": "NumpadMultiply",
  "KEY_KPPLUS": "NumpadAdd",
  "KEY_KPMINUS": "NumpadSubtract",
  "KEY_KPDOT": "NumpadDecimal",
  "KEY_KPSLASH": "NumpadDivide",
  "KEY_KPENTER": "NumpadEnter",
  // Function keys
  "KEY_F1": "F1",
  "KEY_F2": "F2",
  "KEY_F3": "F3",
  "KEY_F4": "F4",
  "KEY_F5": "F5",
  "KEY_F6": "F6",
  "KEY_F7": "F7",
  "KEY_F8": "F8",
  "KEY_F9": "F9",
  "KEY_F10": "F10",
  "KEY_F11": "F11",
  "KEY_F12": "F12",
}

const getFilteredEventDevices = () => {
  const devices = fs.readFileSync('/proc/bus/input/devices', UTF8);
  const eventDevices = [];

  const lines = devices.split('\n');
  let currentDevice = {};

  lines.forEach(line => {
    if (line.startsWith('I:')) {
      currentDevice = {};
    }

    if (line.startsWith('H:')) {
      const handlers = line.split(' ').slice(1);
      handlers.forEach(handler => {
        if (handler.startsWith('event')) {
          currentDevice.event = handler;
        }
      });
    }

    if (line.startsWith('N:')) {
      currentDevice.name = line.split('=')[1].trim();
    }

    if (line === '') {
      if (currentDevice.event && currentDevice.name) {
        const name = currentDevice.name.toLowerCase();
        if ((name.includes('mouse') || name.includes('keyboard')) && 
            !(name.includes('keyboard') && name.includes('control'))) {
            eventDevices.push(currentDevice);
            currentDevice = {};
        }
      }
    }
  });

  return eventDevices;
};

class InputEventListener {

  static blockFlag = false;

  constructor() {
      this.reader = new EvdevReader();
      this.keyboard = new Keyboard();
      this.mouse = new Mouse();

      this.handleKeyEvent = this.handleKeyEvent.bind(this);
      this.handleRelEvent = this.handleRelEvent.bind(this);
      this.handleAbsEvent = this.handleAbsEvent.bind(this);
      this.handleError = this.handleError.bind(this);

      this.pressedKeys = new Set();
      this.mouse_button = 0;
      const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      this.mouse_sensitivity = hid.pass_through.mouse_sensitivity;
  }

  // 初始化事件监听器
  open( device) {
    // 监听不同类型的输入事件
    this.reader.on("EV_KEY", this.handleKeyEvent)
      .on("EV_ABS", this.handleAbsEvent)
      .on("EV_REL", this.handleRelEvent)
      .on("error", this.handleError);

    this.reader.open(device);
    logger.info(`${device} listener opened.`);
  }

  close() {
    this.reader.close();
    logger.info(`${this.reader} Input listener closed.`);
  }

  handleKeyDown(key){
    const keyCode = EventCodeToHIDCode[key];
    if(keyCode && !this.pressedKeys.has(keyCode)){ 
      this.pressedKeys.add(keyCode);
      this.keyboard.handleEvent(this.pressedKeys);
    }
  }

  handleKeyUp(key){
    const keyCode = EventCodeToHIDCode[key];
    if(keyCode && this.pressedKeys.has(keyCode)){ 
      this.pressedKeys.delete(keyCode);
      this.keyboard.handleEvent(this.pressedKeys);
    }
  }

  handMouseKey( button){
    const  mouse_event = {
      buttons: button,
      relativeX: 0,
      relativeY: 0, 
      verticalWheelDelta: 0,
      horizontalWheelDelta: 0,
      isAbsoluteMode: false,
      sensitivity: 0.8
    }
    this.mouse.handleEvent(mouse_event);
  }

  // 键盘事件处理
  // mouse code left:1 right:2 middle:4
  handleKeyEvent(data) {

    if (InputEventListener.blockFlag) {
      return;
    }

    const BUTTON_LEFT = 0b00000001;
    const BUTTON_RIGHT = 0b00000010;
    const BUTTON_MIDDLE = 0b00000100;

    if (data.code === 'BTN_LEFT') {
        if (data.value === 1) {
            this.mouse_button|= BUTTON_LEFT; // Set left button bit
        } else if (data.value === 0) {
            this.mouse_button&= ~BUTTON_LEFT; // Clear left button bit
        }
        this.handMouseKey(this.mouse_button);
    } else if (data.code === 'BTN_RIGHT') {
        if (data.value === 1) {
            this.mouse_button|= BUTTON_RIGHT; // Set right button bit
        } else if (data.value === 0) {
            this.mouse_button&= ~BUTTON_RIGHT; // Clear right button bit
        }
        this.handMouseKey(this.mouse_button);
    } else if (data.code === 'BTN_MIDDLE') {
        if (data.value === 1) {
            this.mouse_button|= BUTTON_MIDDLE; // Set middle button bit
        } else if (data.value === 0) {
            this.mouse_button&= ~BUTTON_MIDDLE; // Clear middle button bit
        }
        this.handMouseKey(this.mouse_button);
    }else if(data.value === 1) {
      this.handleKeyDown(data.code);
    }else if(data.value === 0) {
      this.handleKeyUp(data.code);
    }
  }

  // 相对坐标事件处理
  // code 0:x 1:y wheel: 8 and 11
  // value 
  handleRelEvent(data) {

    if (InputEventListener.blockFlag) {
      return;
    }

    //console.log("Relative axis event:", data);
    let relativeX = 0;
    let relativeY = 0;
    let verticalWheelDelta = 0;
    if(data.code === 0) {
      relativeX = data.value;
    }else if(data.code === 1) {
      relativeY = data.value;
    }else if(data.code === 8) {
      verticalWheelDelta = data.value;
    }
    const  mouse_event = {
      buttons: this.mouse_button,
      relativeX: relativeX,
      relativeY: relativeY, 
      verticalWheelDelta: verticalWheelDelta,
      horizontalWheelDelta: 0,
      isAbsoluteMode: false,
      sensitivity: this.mouse_sensitivity
    }
    this.mouse.handleEvent(mouse_event);
  }

  // 绝对坐标事件处理
  handleAbsEvent(data) {
    //console.log("Absolute axis event:", data);
  }

  // 错误处理
  handleError(e) {
    logger.error(`Input listenner error:${e}`);
    //this.close();
  }

  static setBlockFlag(flag) {
    if(InputEventListener.blockFlag !== flag) {
      InputEventListener.blockFlag = flag;
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      config.hid.pass_through.blockFlag = flag;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), UTF8);
      logger.info(`InputEventListener blockFlag set to ${flag}`);
    }else{
      logger.warn(`InputEventListener blockFlag already set to ${flag}`);
    }
  }

  static getBlockFlag() {
    return InputEventListener.blockFlag;
  }

}

const watchInputDir = () => {
  const inputDir = '/dev/input';

  fs.watch(inputDir, (eventType, filename) => {
    if (eventType === 'rename' && filename.startsWith('event')) {
      const filePath = path.join(inputDir, filename);
      if (fs.existsSync(filePath)) {
        logger.info(`New event file detected: ${filename}`);
        const eventDevices = getFilteredEventDevices();
        const eventDevice = eventDevices.find(device => device.event === filename);
        if (eventDevice) {
          const inputEventListener = new InputEventListener();
          inputEventListener.open(filePath);
        }
      }
    }
  });
};

watchInputDir();

export  {InputEventListener, getFilteredEventDevices};