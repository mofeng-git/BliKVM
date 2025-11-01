'use strict';

// contains all session related code

import Config from '@/config.js';

export function useSessionUtils(device) {
  const isSessionValid = () => {
    const currentTime = Date.now();
    const expiration = localStorage.getItem('sessionExpiration');
    return expiration && currentTime < expiration;
  };

  const inactivateDevice = () => {
    localStorage.removeItem('token');

    //   device.value.isDisconnected = true; // TODO need to stop seConnection watcher, there is a pattern for it

    device.value.video.isActive = false;
    device.value.hid.keyboard.isActive = false;
    device.value.hid.mouse.isActive = false;
    device.value.video.audioMuted = true;
    device.value.video.audioVolume = 0;
    device.value.health.isPowerLedActive = false;
  };

  return {
    isSessionValid,
    inactivateDevice,
  };
}
