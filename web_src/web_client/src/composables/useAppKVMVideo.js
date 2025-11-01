'use strict';

import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

// Stores & States
const store = useAppStore();
const { misc, devices } = storeToRefs(store);

const isVideoActive = computed(() => {
  return (
    devices.value.video.capturedFps > 0 &&
    devices.value.video.resolutionHeight > 0 &&
    devices.value.video.isActive === true
  );
});

export function useAppKVMVideo(device) {
  const isH264 = computed(() => device.value.video.videoMode === 'h264');
  const isMjpeg = computed(() => device.value.video.videoMode === 'mjpeg');

  const videoElementStyle = computed(() => {
    return {
      transform: `scale(${device.value.scale / 100})`,
    };
  });

  return {
    isVideoActive,
    isH264,
    isMjpeg,
    videoElementStyle,
  };
}
