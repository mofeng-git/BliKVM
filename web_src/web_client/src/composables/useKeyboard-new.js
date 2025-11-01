'use strict';

// useKeyboard.js
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { keytoCode } from '../utils/virtualKeyboard.js';
import { useDevice } from '@/composables/useDevice';

const keyPress = ref('');
const pressedKeys = ref([]);
const { device } = useDevice();
let keyboardWatcherRegistered = false;

export function useKeyboard() {
  const handlePressedKeysChange = (newVal) => {
    const obj = {
      k: newVal,
      ts: performance.now(),
    };

    if (device.value.ws && device.value.ws.readyState === WebSocket.OPEN) {
      try {
        //console.log('Sending pressed keys:', JSON.stringify(obj));
        device.value.ws.send(JSON.stringify(obj));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyDown = (event) => {
    event.preventDefault();
    const code = event.code;
    if (!pressedKeys.value.includes(code)) {
      device.value.hid.keyboard.inputKey = code;
      keyPress.value = code;
      pressedKeys.value.push(code);
    }
    //console.log("down code:", code, "pressedKeys:", pressedKeys.value);
  };

  ///
  const handleKeyUp = (event) => {
    event.preventDefault();
    const code = event.code;
    const index = pressedKeys.value.indexOf(code);
    if (index > -1) {
      pressedKeys.value.splice(index, 1);
    } else {
      console.error('Key not found in pressedKeys:', code);
    }
    if (code === 'MetaLeft' || code === 'MetaRight') {
      while (pressedKeys.value.length > 0) {
        pressedKeys.value.pop();
      }
      return;
    }
    //console.log("up: code:", code, "pressedKeys:", pressedKeys.value);
  };

  // TODO this is not called?
  const handleKeyPress = (button) => {
    const keyCode = keytoCode(button);
    console.log('pressed keyCode:', keyCode);
    if (!pressedKeys.value.includes(keyCode)) {
      pressedKeys.value.push(keyCode);
    }
  };

  // TODO this is not called?
  const handleKeyReleased = (button) => {
    const keyCode = keytoCode(button);
    console.log('release keyCode:', keyCode);
    const index = pressedKeys.value.indexOf(keyCode);
    if (index > -1) {
      pressedKeys.value.splice(index, 1);
    } else {
      console.error('Key not found in pressedKeys:', keyCode);
    }
  };

  const releaseAllKey = () => {
    console.log('release all key len:', pressedKeys.value.length);
    while (pressedKeys.value.length > 0) {
      console.log('pressedKeys up:', pressedKeys.value);
      pressedKeys.value.pop();
    }
  };

  // 只注册一次监听，避免多个组件重复发送
  if (!keyboardWatcherRegistered) {
    watch(
      pressedKeys,
      (newVal) => {
        handlePressedKeysChange(newVal);
      },
      { deep: true }
    );
    keyboardWatcherRegistered = true;
  }

  return {
    keyPress,
    handleKeyPress,
    handleKeyReleased,
    handleKeyDown,
    handleKeyUp,
    releaseAllKey,
  };
}
