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
import { version } from 'core-js';
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    isKeyboardOpen: false,
    videoMode: "mjpeg",
    username: "admin",
    mouseStatus: false,
    hidEnable: true,
    absoluteMode: true,
    mouseMode: "dual",
    mouseJiggler:true,
    keyboardStatus: false,
    deviceVersion: "BliKVM",
    deviceType: "KVM-over-IP",
    hardwareType: "pi",
    manufacturer: "BliCube LLC",
    LatencyMS: 0,
    videoServerPort: 10004,
    resolutionWidth: 0,
    resolutionHeight: 0,
    capturedFps: 0,
    queuedFps: 0,
    cpuLoad: 0,
    uptime: '0',
    temperature: 0,
    startOcr: false,
    ocrSelection: false,
    ocrLang: [],
    tusPort: 10002,
    notification: '',
    newNotification: false,
    alert: '',
    newAlert: false,
    ledPwr: false,
    ledHDD: false,
    webversion: '',
    sliderMousePolling: 10, 
    fullScreen: false,
    version: 'xxx'
  }),
  actions: {
    switchKeyboardStatus() {
      this.isKeyboardOpen = !this.isKeyboardOpen;
    },
    updateSliderMousePolling(value) {
      this.sliderMousePolling = value;
    },
  },
})
