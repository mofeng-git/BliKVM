<!--
****************************************************************************
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
****************************************************************************
-->

<template>
  <!-- Vuetify uses ref, id is old, not necessary. To be refactored -->
  <div id="appkvm">
    <video
      v-if="isVideoActive && isH264"
      id="webrtc-output"
      ref="streamElementRef"
      disablepictureinpicture="true"
      autoplay
      playsinline
      muted
      :class="[`rotate-${device.video.orientation}`, cursorClass]"
      :style="{
        zIndex: zIndex.video,
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        ...videoElementStyle,
      }"
      @click="requestPointerLock"
      @mousemove="handleMouseMoveWithGreenDot"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
      @contextmenu="handleContextMenu"
      @mouseleave="handleMouseLeave"
      @mouseenter="handleMouseEnter"
      @touchmove="handleTouchMove"
      @play="onVideoPlay"
    ></video>

    <img
      v-else-if="isVideoActive && isMjpeg"
      id="mjpeg-output"
      ref="streamElementRef"
      :src="device.mjpegUrl"
      :class="[`rotate-${device.video.orientation}`, cursorClass]"
      :style="{
        zIndex: zIndex.video,
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        ...videoElementStyle,
      }"
      @click="requestPointerLock"
      @mousemove="handleMouseMoveWithGreenDot"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
      @contextmenu="handleContextMenu"
      @mouseleave="handleMouseLeave"
      @mouseenter="handleMouseEnter"
      @touchmove="handleTouchMove"
    />

    <div v-else>
      <AppDiagnosticsSignal v-if="!isVideoActive" :z-index="zIndex.diagnostics" />
      <!-- <AppDiagnosticsSource
        v-else-if="errorSource"
        :z-index="zIndex.diagnostics"
      />
      <AppDiagnosticsTimings
        v-else-if="errorTimings"
        :z-index="zIndex.diagnostics"
      /> -->
    </div>

    <div v-if="ocr.ocrSelection" class="selection-overlay">
      <div class="selection-box" :style="selectionStyle"></div>
    </div>

    <DialogTextExtract />

    <!-- Green dot cursor overlay - only shows on video -->
    <div
      v-if="showGreenDot && greenDotPosition.x !== null"
      class="green-dot-cursor"
      :style="{
        left: greenDotPosition.x + 'px',
        top: greenDotPosition.y + 'px',
        zIndex: zIndex.overlay + 1,
      }"
    />

    <video
      v-if="isExperimental"
      ref="pipVideoElement"
      autoplay
      playsinline
      muted
      style="display: none"
    ></video>

    <audio v-if="isExperimental" ref="audioElement" mute autoplay></audio>
    <!--
    <AudioStreamer />
-->
    <AppOverlay v-if="showDiagnostics" :z-index="zIndex.overlay" />
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
  import Config from '@/config.js';
  import { useAppStore } from '@/stores/stores';
  import { useHealth } from '@/composables/useHealth.js';
  import { storeToRefs } from 'pinia';
  import { startSession } from '@/composables/session.js';
  import { useDevice } from '@/composables/useDevice';
  import { usePointerLock } from '@/composables/usePointerLock';
  import { useKeyboard } from '@/composables/useKeyboard-new';
  import { useVideo } from '@/composables/useVideo';
  import { useMouse } from '@/composables/useMouse';
  import { RateLimitedMouse } from '../utils/mouse.js';
  import { useExtractText } from '@/composables/useExtractText';
  import { useCamera } from '@/composables/useCameraWithSwitch.js';
  import { useAppKVMVideo } from '@/composables/useAppKVMVideo.js';
  import { zIndex } from '@/styles/zIndex'; // TODO should be constants!

  // Stores & States
  const store = useAppStore();
  const {
    showResolution,
    showDiagnostics,
    isCameraOn,
    isShowingPiP,
    pipVideoElement,
    isTakingScreenshot,
    isRecording,
    isExperimental,
    errorSource,
    errorTimings,
    misc,
  } = storeToRefs(store); //ocr

  const { device } = useDevice();
  const { startCamera, stopCamera, enterPiP, exitPiP } = useCamera(device); //error

  const { isVideoActive, isH264, isMjpeg, videoElementStyle } = useAppKVMVideo(device);
  const { getHealthThreshold } = useHealth();

  // DOM Refs
  const streamElementRef = ref(null);
  const audioElement = ref(null);

  const showOverlay = ref(true);
  const previousResolution = ref(device.value.video.resolution);

  // Green dot cursor state
  const greenDotPosition = ref({ x: null, y: null });
  const isMouseOverVideo = ref(false);

  // Show green dot only when cursor is set to green-dot and mouse is over video
  const showGreenDot = computed(() => {
    return (
      misc.value.isLocalCursorVisible &&
      misc.value.currentCursor === 'cursor-green-dot' &&
      isMouseOverVideo.value
    );
  });

  // Computed cursor class
  const cursorClass = computed(() => {
    if (!misc.value.isLocalCursorVisible) return 'cursor-none';
    // Green dot gets its own special class
    if (misc.value.currentCursor === 'cursor-green-dot') return 'cursor-green-dot';
    return `cursor-${misc.value.currentCursor}`;
  });

  // WebSocket Init
  device.value.mjpegUrl = `${Config.http_protocol}//${Config.host_ip}${Config.host_port}/video/stream`;
  const wasNoSignal = ref(true);
  startSession();

  const { requestPointerLock, exitPointerLock, isPointerLocked } = usePointerLock(
    //document.pointerLockElement,
    device,
    (locked) => {
      console.log('Pointer lock status:', locked);
    },
    (error) => {
      console.warn('Pointer lock error:', error);
    }
  );

  // Video, Mouse, Keyboard, OCR, Camera
  const { keyPress, handleKeyDown, handleKeyUp, releaseAllKey } = useKeyboard();
  const {
    initVideo,
    destroyJanusConnection,
    clearImageSource,
    adjustVolume,
    onVideoPlay,
    captureAndDownloadImage,
  } = useVideo();

  const {
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    onMouseEnter,
    onMouseLeave,
    handleWheel,
    handleContextMenu,
    setMousePollingInterval,
    handleTouchMove,
  } = useMouse(device, streamElementRef);

  const { ocr, selectionStyle, selection } = useExtractText();
  const mousePollingInterval = computed(() => device.value.hid.mouse.mousePollingInterval);

  // Wrapper functions for mouse events to handle green dot
  const handleMouseMoveWithGreenDot = (event) => {
    // Update green dot position relative to the video element
    const rect = streamElementRef.value?.getBoundingClientRect();
    if (rect) {
      greenDotPosition.value = {
        x: event.clientX,
        y: event.clientY,
      };
    }
    // Call original handler
    handleMouseMove(event);
  };

  const handleMouseEnter = (event) => {
    isMouseOverVideo.value = true;
    onMouseEnter(event);
  };

  const handleMouseLeave = (event) => {
    isMouseOverVideo.value = false;
    greenDotPosition.value = { x: null, y: null };
    onMouseLeave(event);
  };

  // Track if we're intentionally closing (moved to device state for consistency)

  // Watchers & Listeners

  watch(mousePollingInterval, (newValue) => {
    console.log('mousePollingInterval:', newValue);
    setMousePollingInterval(newValue);
  });

  // Watch for changes in the audioStream and attach it to the audio element
  watch(
    () => device.value.video.audioStream,
    (newStream) => {
      if (audioElement.value) {
        console.log(device.value.video.audioStream?.getAudioTracks()[0]);
        audioElement.value.srcObject = newStream || null;
      }
    }
  );

  // watch(
  //   () => isCameraOn.value,
  //   (newValue) => {
  //     if (newValue) {
  //       startCamera();
  //     } else {
  //       stopCamera();
  //     }
  //   }
  // );

  // watch(
  //   () => isShowingPiP.value,
  //   (newValue) => {
  //     if (newValue) {
  //       enterPiP(pipVideoElement.value);
  //     } else {
  //       exitPiP(document);
  //     }
  //   }
  // );

  // Bind camera stream to pipVideoElement
  watch(
    () => device.value.video.videoStream,
    (newStream) => {
      if (pipVideoElement.value) {
        pipVideoElement.value.srcObject = newStream;
        pipVideoElement.value.play();
      }
    }
  );

  watch(
    () => device.value.video.isTakeScreenshot,
    (newValue) => {
      if (newValue) {
        captureAndDownloadImage();
        // Reset the flag after taking the screenshot
        device.value.video.isTakeScreenshot = false;
      }
    }
  );

  watch(
    () => device.value.video.audioVolume,
    (newVal) => {
      if (device.value.video.videoMode === 'h264' && newVal != null) {
        console.log('adjust volme', newVal / 100);
        adjustVolume(newVal / 100);
      }
      if (newVal === 0) {
        device.value.video.audioMuted = true;
      }
    }
  );

  watch(keyPress, (newVal) => {
    device.value.hid.keyboard.keyPress = newVal;
  });

  watch(
    () => device.value.video.resolution,
    (newVal, oldVal) => {
      if (newVal !== previousResolution.value) {
        showResolution.value = true;
        setTimeout(() => {
          showResolution.value = false;
        }, 2500); // specific timeout
        previousResolution.value = newVal;
      }
    }
  );

  watch(
    () => ({
      mode: device.value.video.videoMode,
      fps: device.value.video.capturedFps,
      height: device.value.video.resolutionHeight,
      active: device.value.video.isActive,
    }),
    (val) => {
      const isNowSignal =
        (val.mode === 'h264' || val.mode === 'mjpeg') &&
        val.fps > 0 &&
        val.height > 0 &&
        val.active === true;

      if (wasNoSignal.value && isNowSignal) {
        console.log(
          `Signal detected  : mode=${val.mode}, fps=${val.fps}, height=${val.height}, active=${val.active}`
        );

        if (val.mode === 'h264') {
          destroyJanusConnection(); // clean up Janus if leaving h264 mode
          clearImageSource(); // stop MJPEG
          // DOM patched (flush:'post'); ref is ready
          initVideo(); // start Janus WebRTC
        } else if (val.mode === 'mjpeg') {
          destroyJanusConnection(); // clean up Janus if leaving h264 mode
          device.value.mjpegUrl = `${Config.http_protocol}//${Config.host_ip}${Config.host_port}/video/stream`;
        }
      }

      // Update previous state
      wasNoSignal.value = !isNowSignal;
    },
    { deep: true, flush: 'post' }
  );

  // Watch for specific video state to know when we've checked
  // Only watch isActive which indicates actual signal check
  watch(
    () => isVideoActive.value,
    (isActive) => {
      if (isActive === false) {
        device.value.video.connectionState = 'no-signal';
      }
    }
  );

  onMounted(() => {
    console.log('AppKVM mounted');
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pagehide', releaseAllKey);
    window.addEventListener('blur', releaseAllKey);
    const savedVideoMode = localStorage.getItem('videoMode');
    if (savedVideoMode) {
      device.value.video.videoMode = savedVideoMode;
    } else {
      if (device.value.board.type === 'mangopi') {
        device.value.video.videoMode = 'mjpeg'; // default for mangopi
      } else {
        device.value.video.videoMode = 'h264'; // default for other boards
      }
    }
    const savedWheelDirection = parseInt(localStorage.getItem('wheelDeriction'));
    if (savedWheelDirection) {
      device.value.hid.mouse.wheelReverse = savedWheelDirection === -1;
      RateLimitedMouse.setWheelDeriction(savedWheelDirection);
    }
    const mouseSensitivity = parseFloat(localStorage.getItem('mouseSensitivity'));
    if (mouseSensitivity) {
      device.value.hid.mouse.relativeSensitivity = mouseSensitivity;
    }
    getHealthThreshold();
  });

  // Inside onBeforeUnmount of your component
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('pagehide', releaseAllKey);
    window.removeEventListener('blur', releaseAllKey);
    destroyJanusConnection(); // centralized video cleanup

    // Clean up WebSocket
    if (device.value.ws) {
      device.value.isIntentionalClose = true; // Indicate that we are closing intentionally
      device.value.ws.close(); // Close WebSocket connection
      device.value.ws = null;
    }

    // Clear any pending reconnection timeout
    if (device.value.reconnectTimeout) {
      clearTimeout(device.value.reconnectTimeout);
      device.value.reconnectTimeout = null;
    }
  });
</script>

<style scoped>
  .rotate-0 {
    transform: rotate(0deg) !important;
  }

  .rotate-90 {
    transform: rotate(90deg) !important;
  }

  .rotate-180 {
    transform: rotate(180deg) !important;
  }

  .rotate-270 {
    transform: rotate(270deg) !important;
  }

  .selection-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    /* Make sure overlay does not block other elements */
  }

  .selection-box {
    border: 2px dashed #007bff;
    background-color: rgba(0, 123, 255, 0.1);
    /* Ensure the box is visible */
  }

  /* Cursor classes */
  .cursor-none {
    cursor: none !important;
  }

  .cursor-default {
    cursor: default !important;
  }

  .cursor-grab {
    cursor: grab !important;
  }

  .cursor-crosshair {
    cursor: crosshair !important;
  }

  .cursor-text {
    cursor: text !important;
  }

  /* Green dot cursor - just hide the cursor, we'll handle the dot separately */
  .cursor-green-dot {
    cursor: none !important;
  }

  /* Green dot visual */
  .green-dot-cursor {
    position: fixed;
    width: 12px;
    height: 12px;
    background: radial-gradient(circle, #76ff03 0%, #4caf50 70%, #2e7d32 100%);
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow:
      0 0 4px rgba(118, 255, 3, 0.6),
      0 0 8px rgba(118, 255, 3, 0.3);
    pointer-events: none;
    transform: translate(-50%, -50%);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow:
        0 0 4px rgba(118, 255, 3, 0.6),
        0 0 8px rgba(118, 255, 3, 0.3);
    }
    50% {
      box-shadow:
        0 0 8px rgba(118, 255, 3, 0.8),
        0 0 16px rgba(118, 255, 3, 0.4);
    }
  }

  #appkvm {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
  }
</style>
