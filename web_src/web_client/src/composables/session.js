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
import Config from '@/config.js';
import { RateLimitedMouse } from '@/utils/mouse.js';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { useDevice } from '@/composables/useDevice';
import { useAlert } from '@/composables/useAlert';
import { useState } from '@/composables/useState.js';

const store = useAppStore();
const { misc, isHidActive, notification } = storeToRefs(store);

const { device } = useDevice();
const { sendAlert } = useAlert();
const { apiBinState } = useState();

let __ping_timer = null;
const pingTimeout = 1000;
let __ws = null;
let __missed_heartbeats = 0;

// Method to build the ws URL
const buildWsUrl = () => {
  const wsProtocol = Config.http_protocol === 'https:' ? 'wss' : 'ws';
  const token = localStorage.getItem('token');
  return `${wsProtocol}://${Config.host_ip}${Config.host_port}/wss?token=${token}`;
};

const startSession = () => {
  if (__ws && (__ws.readyState === WebSocket.OPEN || __ws.readyState === WebSocket.CONNECTING)) {
    device.value.isIntentionalClose = true;
    __ws.close();
    __ws = null; // Clear reference
  }
  const wsUrl = buildWsUrl();
  __ws = new WebSocket(wsUrl);
  __ws.onopen = __wsOpenHandler;
  __ws.onmessage = (event) => handleWSMessage(event.data);
  __ws.onclose = __wsCloseHandler;
  __ws.onerror = __wsErrorHandler;
}

const __wsOpenHandler = () => {
  device.value.isDisconnected = false;
  device.value.userCancelledReconnect = false; // Reset cancel flag on successful connection
  device.value.lastDisconnectTime = null; // Clear disconnect time on successful connection
  device.value.reconnectCount = 0; // Reset reconnect count on successful connection
  device.value.isIntentionalClose = false; // Reset intentional close flag
  console.log(`WebSocket connection established for ${device.value.wsUrl}`);
  device.value.ws = __ws;
  __missed_heartbeats = 0;
  __ping_timer = setInterval(__pingServer, 1000);
}


const handleWSMessage = (event) => {
  const message = JSON.parse(event); // Assuming the message is in the correct format

  if (message.data?.systemInfo) {
    const systemInfo = message.data.systemInfo;

    // Update CPU load, uptime and timezone
    device.value.cpuLoad = systemInfo?.cpuLoad || device.value.cpuLoad;
    device.value.uptime = systemInfo?.uptime || device.value.uptime;

    // Update temperature
    device.value.board.cpu.temperature = systemInfo.temperature;

    device.value.clientsConnected = systemInfo?.clientsConnected || device.value.clientsConnected;
  }

  if (message.data?.clientsConnected) {
    device.value.clientsConnected = message.data.clientsConnected || device.value.clientsConnected;
  }

  // Handle HID status (mouse, keyboard)
  if (message.data?.hidStatus) {
    if (message.data.hidStatus.mouseMode === 'dual') {
      device.value.hid.mouse.mouseMode = 'dual';
    } else if (message.data.hidStatus.mouseMode === 'absolute') {
      device.value.hid.mouse.mouseMode = 'absolute';
      device.value.hid.mouse.absoluteMode = true;
      RateLimitedMouse.setMode(true);
    } else if (message.data.hidStatus.mouseMode === 'relative') {
      device.value.hid.mouse.mouseMode = 'relative';
      device.value.hid.mouse.absoluteMode = false;
      RateLimitedMouse.setMode(false);
    }
    device.value.hid.isActive = message.data.hidStatus.enable;
    device.value.hid.mouse.jigglerInterval = message.data.hidStatus.jigglerInterval;
    device.value.hid.passThrough = message.data.hidStatus.passThrough;
  }

  //  handle keyboard
  if (message.data?.keyboardStatus != null) {
    device.value.hid.keyboard.isActive = message.data.keyboardStatus.onlineStatus;
    device.value.hid.keyboard.isCapsLock = message.data.keyboardStatus.CapsLockLed;
    device.value.hid.keyboard.isNumLock = message.data.keyboardStatus.NumLockLed;
    device.value.hid.keyboard.isScrollLock = message.data.keyboardStatus.ScrollLockLed;
  }

  // handle mouse
  if (message.data?.mouseStatus != null) {
    device.value.hid.mouse.isActive = message.data.mouseStatus;
  }

  const getAspectRatio = (width, height) => {
    const gcd = (a, b) => {
      return b === 0 ? a : gcd(b, a % b);
    };
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  // handle video
  if (message.data?.videoStatus != null) {
    device.value.video.isActive = message.data.videoStatus.isActive;
    const resolutionWidth = message.data.videoStatus.width;
    const resolutionHeight = message.data.videoStatus.height;
    device.value.video.resolutionWidth = resolutionWidth;
    device.value.video.resolutionHeight = resolutionHeight;
    device.value.video.resolution = `${resolutionWidth}x${resolutionHeight}`;
    device.value.video.resolutionRatio = getAspectRatio(
      message.data.videoStatus.width,
      message.data.videoStatus.height
    );
    device.value.video.capturedFps = message.data.videoStatus.capturedFps;
  }

  if (typeof message?.data?.pong === 'number') {
    __missed_heartbeats = 0;
    let timestamp = new Date().getTime();
    let delay = (timestamp - message.data.pong) / 2;
    device.value.networkLatency = Math.ceil(delay);

    device.value.isDisconnected = false; // Connection is alive
  }

  if (Array.isArray(message?.data?.notification)) {
    const incoming = message.data.notification.map((m) => ({
      timestamp: m.timestamp,
      type: m.type,
      module: m.module,
      text: m.text,
    }));
    // Append incoming messages; ensure we only keep the last 20
    const merged = (notification.value.list || []).concat(incoming);
    notification.value.list = merged.slice(-20);
  }

  if (message.data?.alert != null) {
    // TODO
    const xtitle = 'Error';
    const xmessage = message.data.alert;
    sendAlert('error', xtitle, xmessage);
  }

  if (message.data?.atxStatus != null) {
    device.value.atx.isActive = message.data.atxStatus.isActive;
    device.value.atx.isPowerLedActive = message.data.atxStatus.ledPwr;
    device.value.atx.isHDDLedActive = message.data.atxStatus.ledHDD;
  }
};

const __pingServer = () => {
    try {
      __missed_heartbeats += 1;
      if (__missed_heartbeats >= 15) {
				throw new Error("Too many missed heartbeats");
			}
      const timestamp = new Date().getTime();
      __ws.send(JSON.stringify({ ping: timestamp }));
    } catch (error) {
      __wsErrorHandler(error.message);
    }
};

const __wsErrorHandler = (error) => {
  console.error('Session: socket error:', error);
  if(__ws){
    	__ws.onclose = null;
			__ws.close();
			__wsCloseHandler(null);
  }
}

const attemptReconnect = () => {
    // Check if this was an intentional close
    if (device.value.isIntentionalClose) {
      return;
    }

    // Check if user manually cancelled reconnection
    if (device.value.userCancelledReconnect) {
      console.log('Reconnection cancelled by user');
      return;
    }

    // Clear any existing timeout to prevent duplicates
    if (device.value.reconnectTimeout) {
      clearTimeout(device.value.reconnectTimeout);
      device.value.reconnectTimeout = null;
    }

    // Increment count immediately to prevent race conditions
    const currentAttempt = device.value.reconnectCount;
    device.value.reconnectCount++;

    // Exponential backoff algorithm: 1s, 10s, 20s, then 40s
    const delays = [1000, 10000, 20000, 40000];
    const delay = delays[Math.min(currentAttempt, delays.length - 1)];

    console.log(
      `Reconnecting in ${(delay / 1000).toFixed(0)}s (attempt ${device.value.reconnectCount})`
    );
    apiBinState(); // Check API status on each reconnect attempt

    device.value.reconnectTimeout = setTimeout(() => {
      startSession();
    }, delay);
}

const __wsCloseHandler = (ev) => {
  console.log("Session: socket closed:", ev);
  if (__ping_timer) {
		clearInterval(__ping_timer);
		__ping_timer = null;
	}
  if (!device.value.isIntentionalClose) {
    device.value.isDisconnected = true;
    device.value.video.isActive = false; // Stop video stream
    if (!device.value.lastDisconnectTime) {
      device.value.lastDisconnectTime = Date.now();
    }
    } else {
    // Reset flag for next connection
    device.value.isIntentionalClose = false;
  }
  
  __ws = null;
  attemptReconnect();
  // setTimeout(() => startSession(), 1000);
}

export { startSession };
