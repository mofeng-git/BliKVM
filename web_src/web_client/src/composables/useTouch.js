'use strict';
//
import { RateLimitedMouse } from '../utils/mouse.js';
import { useDevice } from '@/composables/useDevice';

const { device } = useDevice();

export function useTouch() {
  let rateLimitedMouse = null;

  const handleMouseEvent = (event) => {
    const obj = {
      m: event,
      ts: performance.now(),
    };

    if (device.value.ws && device.value.ws.readyState === WebSocket.OPEN) {
      try {
        device.value.ws.send(JSON.stringify(obj));
        //        console.log(JSON.stringify(obj))
      } catch (error) {
        console.error('Error sending mouse:', error);
      }
    }
  };

  const handleTouchClick = (type) => {
    if (rateLimitedMouse) {
      rateLimitedMouse.sendButtonEvent(type);
    } else {
      console.error('RateLimitedMouse is not initialized');
    }
  };

  const handleTouchHoldStart = (button) => {
    if (rateLimitedMouse) {
      rateLimitedMouse.onTouchHoldStart(button);
    } else {
      console.error('RateLimitedMouse is not initialized');
    }
  };

  const handleTouchHoldEnd = (button) => {
    if (rateLimitedMouse) {
      rateLimitedMouse.onTouchHoldEnd(button);
    } else {
      console.error('RateLimitedMouse is not initialized');
    }
  };

  onMounted(() => {
    if (rateLimitedMouse === null) {
      rateLimitedMouse = RateLimitedMouse.getInstance(
        device.value?.hid.mouse.mousePollingInterval,
        handleMouseEvent,
        device.value?.hid?.mouse?.mouseMode
      );
    }
  });

  return {
    handleTouchClick,
    handleTouchHoldStart,
    handleTouchHoldEnd,
  };
}
