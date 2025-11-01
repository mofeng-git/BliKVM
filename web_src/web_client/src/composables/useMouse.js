'use strict';
//
import { RateLimitedMouse } from '../utils/mouse.js';
import { useExtractText } from '@/composables/useExtractText';

const { ocr, startSelection, updateSelection, endSelection } = useExtractText();

export function useMouse(device, videoElement, pointerLockElement) {
  // TODO where is the relevancy of isMouseInside ??
  const isMouseInside = ref(false);
  let rateLimitedMouse = null;

  const mouseMode = computed(() => device.value?.hid?.mouse?.mouseMode);
  const absoluteMode = computed(() => device.value?.hid?.mouse?.absoluteMode);
  const mousePollingInterval = computed(() => device.value?.hid?.mouse?.mousePollingInterval);

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

  const handleMouseDown = (event) => {
    if (absoluteMode.value !== false && !isMouseInside.value) return;
    event.preventDefault();
    // console.log('ocr.value.ocrSelection:', ocr.value.ocrSelection);
    if (ocr.value.ocrSelection === true) {
      startSelection(event, videoElement);
      return;
    }
    //console.log("handleMouseDown", event);
    rateLimitedMouse?.onMouseDown(event);
  };

  const handleMouseUp = (event) => {
    if (mouseMode.value !== 'absolute' && !isMouseInside.value) return;
    event.preventDefault();
    if (ocr.value.ocrSelection === true && ocr.value.isSelecting === true) {
      endSelection();
      return;
    }

    rateLimitedMouse?.onMouseUp(event);
  };

  const handleMouseMove = (event) => {
    if (mouseMode.value !== 'absolute' && !isMouseInside.value) return;

    event.preventDefault();
    if (ocr.value.ocrSelection === true && ocr.value.isSelecting === true) {
      updateSelection(event, videoElement);
      return;
    }

    if (rateLimitedMouse != null) {
      rateLimitedMouse.onMouseMove(event);
    }
  };

  const handleTouchMove = (event) => {
    event.preventDefault();
    if (rateLimitedMouse != null) {
      rateLimitedMouse.onTouchMove(event);
    } else {
      console.log('rateLimitedMouse is null');
    }
  };

  const onMouseEnter = () => {
    isMouseInside.value = true;
  };

  const onMouseLeave = () => {
    isMouseInside.value = false;
  };

  const handleWheel = (event) => {
    if (mouseMode.value !== 'absolute' && !isMouseInside.value) return;

    event.preventDefault();
    rateLimitedMouse?.onWheel(event);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  const setMousePollingInterval = (newValue) => {
    rateLimitedMouse.setTimeoutWindow(newValue);
  };

  onMounted(() => {
    if (device.value?.hid.mouse.mousePollingInterval && mouseMode) {
      rateLimitedMouse = RateLimitedMouse.getInstance(
        device.value?.hid.mouse.mousePollingInterval,
        handleMouseEvent,
        mouseMode
      );
    }

    // Optional: setup pointer lock or event listeners here
    if (pointerLockElement?.value) {
      pointerLockElement.value.addEventListener('mouseenter', () => {});
      pointerLockElement.value.addEventListener('mouseleave', () => {});
    }
  });

  onBeforeUnmount(() => {
    if (pointerLockElement?.value) {
      pointerLockElement.removeEventListener('mouseenter', () => {});
      pointerLockElement.removeEventListener('mouseleave', () => {});
    }

    rateLimitedMouse = null;
  });

  return {
    isMouseInside,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    onMouseEnter,
    onMouseLeave,
    handleWheel,
    handleContextMenu,
    setMousePollingInterval,
    handleTouchMove,
  };
}
