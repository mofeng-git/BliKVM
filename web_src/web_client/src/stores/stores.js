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
// Utilities
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  persist: {
    pick: ['settings', 'systeminfo', 'mic'], // Persist settings and systeminfo
  },
  state: () => ({
    // default store values
    productVersion: 'v2.0.0-alpha',
    serverVersion: '1.0.0',
    isTouchDevice: false,
    devices: {
      deviceId: '',
      ws: null,
      wsUrl: '',
      baseUrl: '',
      isDisconnected: false,
      reconnectTimeout: null,
      userCancelledReconnect: false, // Track if user manually cancelled
      lastDisconnectTime: null, // Track when disconnection occurred
      reconnectCount: 0, // Track number of reconnection attempts for backoff
      isIntentionalClose: false, // Track if WebSocket was closed intentionally
      clientsConnected: 0,
      cpuLoad: 2.92,
      timezone: 'Europe/London (GMT, +0000)',
      uptime: '0d 0h 0m 0s',
      showSSHTerminal: false,
      meta: {
        deviceType: 'KVM-over-IP', // TODO for testing
        manufacturer: 'BliCube LLC',
        monitorName: 'BliKVM KVM-over-IP',
        productId: '34953',
        serial: '2290649089',
      },
      health: {
        hasUndervoltage: true,
        ramThreshold: 0, // gb
        networkLatencyThreshold: 15, // ms
        storageThreshold: 0, // gb
        temperatureThreshold: 80,
        isFSReadOnly: false,
        status: 'Degraded',
      },
      board: {
        manufacturer: 'Raspberry Pi Foundation',
        model: 'Raspberry Pi Compute Module 4 Rev 1.1',
        version: 'c03141',
        serial: '100000003c0638f9',
        type: 'CM4',
        cpu: {
          manufacturer: 'Sony UK',
          processor: 'BCM2711',
          revision: 'c03141',
          vendor: 'ARM',
          temperature: 0,
        },
      },
      os: {
        platform: 'linux',
        distro: 'Debian GNU/Linux',
        release: '11',
        codename: 'bullseye',
        kernel: '5.15.84-v8+',
        arch: 'arm64',
        fqdn: '',
        codepage: 'UTF-8',
      },
      mem: {
        actual: 0,
      },
      storage: {
        actual: 0,
      },
      network: {
        protocol: 'https',
        httpPort: 80,
        httpsPort: 443,
        isDiscoverable: false,
        isHttpsConnectionEnabled: false,
        interfaces: [],
      },
      mic: {
        isRegistered: false,
      },
      api: {
        prometheus: {
          isActive: false,
          endpoint: 'https://blikvmip/api/export/prometheus/metrics',
          refreshInterval: 15,
        },
        snmp: {
          isEnabled: false,
          snmpVersion: '',
          snmpCommunityString: '',
          snmpHostname: '',
          snmpOid: '',
        },
      },
      networkLatency: 0,
      video: {
        streamElementRef: null, // TODO move to video
        audioMuted: false,
        audioVolume: 0,
        desiredFps: 30,
        capturedFps: 0,
        WebRTCGop: 30,
        WebRTCMbps: 5,
        audioStream: null,
        pipVideoElement: null,
        isLoading: false,
        isPlaying: false,
        isActive: false,
        excludeFromStreaming: true,
        mjpegUrl: null,
        mjpegQuality: 80,
        orientation: 0,
        preferredVideoMode: 'mjpeg',
        resolution: '',
        resolutionRatio: '',
        resolutionHeight: 0,
        resolutionWidth: 0,
        showOverlay: 'true',
        queuedFps: 0, // TODO purpose and where is this used?
        videoMode: 'h264', // h264 // mjpeg
        videoPort: 10004,
        videoStream: null,
        videoUri: '/video/stream',
        isRequesting: false,
        webrtcOutput: null,
        isTakeScreenshot: false,
        connectionState: 'connecting', // 'connecting', 'no-signal', 'connection-failed'
        connectingTimeout: null,
        bitrate: 0,
        fps: 0,
      },
      hid: {
        isActive: false,
        passThrough: false,
        passThroughWheelReverse: false,
        keyboard: {
          isActive: false, // TODO which one is this exactly. there is also one without HID?
          isCapsLock: false,
          isNumLock: false,
          isScrollLock: false,
          isKeyboardCollapsed: true,
          isKeyboardDetached: false,
          isKeyboardOpen: false,
          isKeyboardShortcutsOpen: false,
          keyboardLanguage: 'english',
          keyPress: '',
          pressedKeys: [],
          keyboardOpacity: 100,
          opacity: 100, // TODO duplicate?
          inputKey: '',
        },
        mouse: {
          isActive: false, // TODO maybe not granular enoughm there is also one without HID?
          jigglerInterval: 60,
          absoluteMode: true,
          mouseMode: 'dual',
          mousePollingInterval: 10,
          mouseStatus: false, // TODO check purpose
          relativeSensitivity: 1.0,
          wheelReverse: false, // TODO new
        },
      },
      display: {
        isActive: true,
        mode: 'boot',
        modes: [
          { value: 'off', title: 'Off' },
          { value: 'always', title: 'Always on' },
          { value: 'boot', title: 'Keep on after boot' },
          { value: 'interval', title: 'Interval' },
        ],
        displayBootTime: 3600,
        totalCycleTime: 300,
        displayOnInterval: 0,
        secondaryIP: '',
      },
      fan: {
        tempThreshold: 67,
      },
      reset: {
        retainPassword: true,
      },
      //////////////////////
      msd: {
        isMsdCreated: false,
        isMsdConnected: false,
        msdDeviceFile: '/dev/mmcblk0p3',
        imageSize: 5,
        mntTotalSize: 20,
        mntUsedSize: 0,
      },
      kvmSwitch: {
        //      isActive: true,
        activeSwitchId: null,
      },
      atx: {
        // / TODO not in favour of name of this variables
        command: '',
        isATXActive: false,
        isHDDLedActive: false,
        isPowerLedActive: false, // TODO not in favour of name of this variable. check what does the Power LED represents?
      },
      //
      mjpegUrl: null,
      //

      // TODO these should come from server
      capability: {
        // TODO the server needs to determin the following
        videoInputDevice: 'TC358743 HDMI-to-CSI2 Converter',
        capabilities: {
          resolutions: [
            '1920x1080',
            '1600x1200',
            '1360x768',
            '1280x1024',
            '1280x960',
            '1280x720',
            '800x600',
            '720x480',
            '640x480',
          ],
        },
      },
      refreshRate: '60Hz',
      codec: 'VP9',
      networkBandwidth: '50 Mbps',
      // TODO refactor and change WebRTC to WebRTC
      codecs: ['h264', 'MJPEG'],
      performanceMetrics: {
        frameRate: '120 FPS',
        latency: '40ms',
        bitrate: '40 Mbps',
        adaptiveCodec: false,
      },
      ///////////////////////////////
      hasAtx: false,
      hasKvmSwitch: false,
      hasMsd: false,
    },
    settings: {
      isVisible: true,
      targetOS: 'windows',
    },
    systeminfo: {
      hostname: 'blikvm',
      deviceVersion: '',
      memTotal: 0,
      storageTotal: 0,
    },
    misc: {
      alert: {
        isEnabled: true,
        isActive: false,
        text: '',
        title: '',
        type: '',
        location: '',
      },
      cocUrl: '',
      isLocalCursorVisible: true,
      currentCursor: 'default',
      language: 'en',
      showCoc: true,
      temperatureUnit: 'C',
    },
    account: {
      accountOperation: '',
      isMenuActive: false, // TODO rename
      user: '',
      userRole: '', // TODO temporary till this can come from login
    },
    keyboard: {
      color: 'red',
    },
    kvmSwitchGUI: {
      isMenuActive: false,
    },
    network: {
      isDiscoverable: false,
    },
    security: {
      authType: 'disabled',
      redirectHttps: true,
      iam: {
        authMethod: [],
        authMethods: ['SSH', 'Web UI', 'API'],
        system: 'FreeIPA',
      },
      session: {
        isAutoLogout: true,
        sessionDuration: 4,
        vpnList: [
          { id: 'tailscale', title: 'Tailscale', ip: 'http://1.1.1.1' },
          { id: 'wireguard', title: 'WireGuard', ip: 'http://2.2.2.2' },
          { id: 'zerotier', title: 'Zerotier', ip: 'http://3.3.3.3' },
        ],
        activeVpns: [], // store array of active VPN ids
      },
      isAuthEnabled: true,
      is2FaEnabled: false,
    },
    videoSettings: {
      edidInfo: {
        manufacturer: 'TSB',
        model: '34952',
        productName: 'Toshiba-H2C',
        serialNumber: '1234567890',
        productDetails: 'Display Product Name',
      },
      // Other settings
    },
    toolbar: {
      expanded: true,
      pinned: true,
      visible: true,
    },
    footer: {
      showFooter: true,
      pinnedFooter: true,
    },
    ocr: {
      isMenuActive: false,
      isOcrStarted: false, // TODO cannot be derived?
      isSelecting: false,
      ocrLanguage: 'eng',
      ocrSelection: false,
      showOcrDialog: false,
      showOcrOutputDialog: false,
    },
    wol: {
      isMenuActive: false,
    },
    terminal: {
      hasSSHConnection: false,
    },
    paste: {
      isConfirmActive: true,
      isHideInputActive: false,
      isMenuActive: false,
      selectedKeymap: 'en-us',
      characterDelay: 5,
    },
    notification: {
      isMenuActive: false, // menu open/close
      // Keep the latest 20 notification items from WS
      // Shape: { timestamp: number, type: string, module: string, text: string }
      list: [],
    },
    scripts: {
      isMenuActive: false,
    },
    serial: {
      baudrate: 115200,
      serialFile: 'none',
    },
    audio: {
      isMicrophoneOn: false,
      microphoneName: '',
    },

    error: null,
    // TODO maybe move this to video
    errorSignal: false,
    errorSource: false,
    errorTimings: false,
    //
    isExperimental: false,
    isFullscreen: false,
    isProcessing: false,
    isRecording: false,
    isShowingPiP: false,
    isCasting: false,
    isCameraOn: false,
    isHandRaised: false,

    pipVideoElement: null,
    scale: 100,

    selectedItem: null,
    showOverlay: false,
    showDiagnostics: true,
    deleteVirtualMediaDialog: false,
    deleteImageDialog: false,
    dialogConnectMsd: false,
    showAboutPageDialog: false,
    showManageAccountDialog: false,
    showUpdateDialog: false,
    showCtrlAltDelDialog: false,
    textPasteDialog: false,
    loginDialog: true,
    showNotification: false,
    dialogDeleteItem: false,

    //    isHidActive: true, // TODO don't think we need this now
    isUpdateAvailable: false,
    tusPort: 10002,
    //
    hasValidStream: true, // TODO is there not another property to reuse?
    showResolution: false,
  }),
  actions: {
    async initializeApp() {
      console.log('Initializing app');
      // Fetch initial system info to populate memory and storage values
      const { getSystemInfo } = await import('@/composables/useSystemInfo.js');
      await getSystemInfo();
    },
    addDevice(device) {
      this.devices.push(device);
    },
    deleteDevice(device) {
      this.devices.pop(device);
    },
    toggleKeyboard() {
      this.keyboard.isKeyboardOpen = !this.keyboard.isKeyboardOpen;
      console.log(this.keyboard.isKeyboardOpen);
    },
    toggleKeyboardShortcuts() {
      // TODO still need this?
      this.keyboard.isKeyboardShortcutsOpen = !this.keyboard.isKeyboardShortcutsOpen;
    },
    toggleNotification() {
      this.showNotification = !this.showNotification;
    },
    async toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme; // Update the state
      console.log('isDarkTheme:', this.isDarkTheme);
    },
    // Disconnect WebSocket for testing reconnection
    disconnectWebSocket() {
      if (this.device.ws && this.device.ws.readyState === WebSocket.OPEN) {
        this.device.ws.close();
        console.log('WebSocket disconnected manually for testing');
      }
    },
    /*
TODO or use getter/setter?
    hasValidStream(device) {
      this.devices.device.video.videoMode === "mjpeg" && this.devices.device.mjpegUrl
    }
*/
  },
});
