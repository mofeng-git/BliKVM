
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
import { apiATXClick, apiATXState,apiActiveState, apiActiveSet} from './atx.route.js';
import { apiBinState, apiCheckToken} from './state.route.js';
import { apiVideoControl, apiVideoConfig, apiGetVideoState, apiRecording, apiResolutionChange, apiSnapshot, apiEdidInfo,  apiEdidSet } from './video.route.js';
import KVMDMain from './kvmd_main.route.js';
import { apiEnableHID, apiChangeMode, apiGetStatus, apiKeyboardPaste, apiKeyboardShortcuts, apiHIDLoopUpdate, apiHIDLoopStatus, apiKeyboardPasteLanguage, apiHIDLoopActive, apiHIDUpdateIdentity, apiHIDGetIdentity } from './hid.route.js';
import {
  apiUpload,
  apiCreateMSD,
  apiState,
  apiConnect,
  apiImages,
  apiRemoveMSD,
  apiDeleteImage,
  apiGetUploadProgress,
  apiGetMSDFiles,
  apiMSDMount,
  getMntSize,
  apiGetMakeImageProgress
} from './msd.route.js';
import { apiLogin, apiUpdateAccount, apiGetUserList, apiCreateAccount, apiDeleteAccount,apiGetAuthState, apiChangeAuthExpiration,
  apiEnabledAuth
 } from './login.route.js';
import {
  apiGetSwitch,
  apiSwitchActive,
  apiSwitchUpdate,
  apiSwitchChannel
} from './switch.route.js';
import { apiReboot, apiGetSystemInfo, apiGetLogs, apiUpdateHostname } from './system.routes.js';
import { apiOcr } from './ocr.route.js';
import { apiWakeOnLan, apiSendWakeOnLanList, apiGetWakeOnLanList, apiAddWakeOnLan, apiDeleteWakeOnLan} from './wol.route.js'; 
import { apiMouseJiggler, apiMouseEvent } from './mouse.route.js';
import {apiTwoFa, apiTwoFaVerify, apiGetTwoFaInfo} from './twoFa.js';
import {apiPrometheusEnable, apiPrometheusState} from './prometheus.route.js';
import {  apiVPNEnable, apiVPNState } from './vpn.route.js';
import {apiResetConfig } from './config.route.js'
import {apiSetTempThreshold } from './fan.route.js';
import {apiSetDispaly, apiGetDisplay } from './display.route.js';
import { getShortcuts, createShortcut, updateShortcut, deleteShortcut, resetShortcuts } from './shortcuts.route.js';
import {apiChangeWebServerPort, apiGetWebServerInfo, apiSetWebServerProtocol} from './network.route.js';
import { apiGetHealthCheck, apiSetHealthCheck } from './health.route.js';
import {apiDownloadFile} from './download.route.js';
import {apiGetSerailDevice, apiSetSerailDevice} from './serial.route.js';
import { apiGetACLState, apiAddList, apiDelete, apiChangeACLMode } from './access_control_list.route.js';
import { apiUpdateUrlConduct, apiActiveConduct, apiGetConducState } from './code_of_conduct.js';
import { scanWifi, connectWifi, disconnectWifi, wifiStatus } from './wifi.route.js';
import { listInterfaces, getInterfaceConfig, setStaticIPv4, setDHCPv4 } from './ip.route.js';
import { apiUpdateStream } from './update.route.js';
import { apiMicState, apiMicSet } from './mic.route.js';
import { apiRecorderStart, apiRecorderStop, apiRecorderRun, apiRecorderStopRun, apiRecorderDelete, apiRecorderList, apiRecorderDownload, apiRecorderUpload } from './recorder.route.js';

/**
 * Array of route objects.
 * @typedef {Object} Route
 * @property {string} path - The route path.
 * @property {function} handler - The route handler function.
 * @property {string} method - The HTTP method for the route.
 * @private
 */
const routes = [
  //ATX
  { path: '/api/atx', handler: apiActiveState, method: 'get' },
  { path: '/api/atx', handler: apiActiveSet, method: 'post' },
  { path: '/api/atx/state', handler: apiATXState, method: 'post' },
  { path: '/api/atx/click', handler: apiATXClick, method: 'post' },

  //state
  { path: '/api/state', handler: apiBinState, method: 'get' },
  { path: '/api/check/token', handler: apiCheckToken, method: 'get' },
  

  //video
  { path: '/api/video', handler: apiVideoControl, method: 'post' },
  { path: '/api/video/config', handler: apiVideoConfig, method: 'post' },
  { path: '/api/video/state', handler: apiGetVideoState, method: 'post' },
  { path: '/api/video/record', handler: apiRecording, method: 'post' },
  { path: '/api/video/resolution', handler: apiResolutionChange, method: 'post' },
  { path: '/api/video/screenshot', handler: apiSnapshot, method: 'get' },
  { path: '/api/video/edid', handler: apiEdidInfo, method: 'get' },
  { path: '/api/video/edid', handler: apiEdidSet, method: 'post' },

  //KVM
  { path: '/api/kvmdmain', handler: KVMDMain, method: 'post' },

  //HID
  { path: '/api/hid', handler: apiEnableHID, method: 'post' },
  { path: '/api/hid/mode', handler: apiChangeMode, method: 'post' },
  { path: '/api/hid/status', handler: apiGetStatus, method: 'post' },
  { path: '/api/hid/paste', handler: apiKeyboardPaste, method: 'post' },
  { path: '/api/hid/paste', handler: apiKeyboardPasteLanguage, method: 'get' },
  { path: '/api/hid/shortcuts', handler: apiKeyboardShortcuts, method: 'post' },
  { path: '/api/hid/loop/update', handler: apiHIDLoopUpdate, method: 'post' },
  { path: '/api/hid/loop', handler: apiHIDLoopStatus, method: 'get' },
  { path: '/api/hid/loop', handler: apiHIDLoopActive, method: 'post' },
  { path: '/api/hid/identity', handler: apiHIDGetIdentity, method: 'get' },
  { path: '/api/hid/identity', handler: apiHIDUpdateIdentity, method: 'post' },

  //mouse
  { path: '/api/mouse/event', handler: apiMouseEvent, method: 'post' },
  { path: '/api/mouse/jiggler', handler: apiMouseJiggler, method: 'post' },
  
  //virtual media
  { path: '/api/msd/upload', handler: apiUpload, method: 'post' },
  { path: '/api/msd/upload/progress', handler: apiGetUploadProgress, method: 'post' },
  { path: '/api/msd/create', handler: apiCreateMSD, method: 'post' },
  { path: '/api/msd/create/progress', handler: apiGetMakeImageProgress, method: 'post' },
  { path: '/api/msd/state', handler: apiState, method: 'post' },
  { path: '/api/msd/connect', handler: apiConnect, method: 'post' },
  { path: '/api/msd/images', handler: apiImages, method: 'post' },
  { path: '/api/msd/files', handler: apiGetMSDFiles, method: 'get' },
  { path: '/api/msd/size', handler: getMntSize, method: 'get' },
  { path: '/api/msd/remove', handler: apiRemoveMSD, method: 'post' },
  { path: '/api/msd/delete', handler: apiDeleteImage, method: 'post' },
  { path: '/api/msd/mount', handler: apiMSDMount, method: 'post' },
  { path: '/api/virtual-media/:filename', handler: apiDownloadFile, method: 'get' },


  //login & account
  { path: '/api/login', handler: apiLogin, method: 'post' },
  { path: '/api/account/update', handler: apiUpdateAccount, method: 'post' },
  { path: '/api/account', handler: apiGetUserList, method: 'get' },
  { path: '/api/account/create', handler: apiCreateAccount, method: 'post' },
  { path: '/api/account/delete', handler: apiDeleteAccount, method: 'post' },
  { path: '/api/auth/expiration', handler: apiChangeAuthExpiration, method: 'post' },

  // 2ta
  { path: '/api/2fa', handler: apiTwoFa, method: 'post' },
  { path: '/api/2fa/info', handler: apiGetTwoFaInfo, method: 'post' },
  { path: '/api/2fa/verify', handler: apiTwoFaVerify, method: 'post' },

  // switch
  { path: '/api/switch/', handler: apiGetSwitch, method: 'get' },
  { path: '/api/switch/:id/activate', handler: apiSwitchActive, method: 'post' },
  { path: '/api/switch/:id/channel', handler: apiSwitchChannel, method: 'post' },
  { path: '/api/switch/:id/update', handler: apiSwitchUpdate, method: 'post' },

  //system
  { path: '/api/reboot', handler: apiReboot, method: 'post' },
  { path: '/api/systeminfo', handler: apiGetSystemInfo, method: 'get' },
  { path: '/api/hostname', handler: apiUpdateHostname, method: 'post' },
  { path: '/api/logs', handler: apiGetLogs, method: 'post' },
  { path: '/api/auth/', handler: apiEnabledAuth, method: 'post' },
  { path: '/api/auth/state', handler: apiGetAuthState, method: 'get' },

  //ocr
  { path: '/api/ocr', handler: apiOcr, method: 'post' },

  //prometheus
  { path: '/api/prometheus', handler: apiPrometheusEnable, method: 'post' },
  { path: '/api/prometheus', handler: apiPrometheusState, method: 'get' },

  //vpn
  { path: '/api/vpn', handler: apiVPNEnable, method: 'post' },
  { path: '/api/vpn', handler: apiVPNState, method: 'get' },

  //config
  { path: '/api/security/config/reset', handler: apiResetConfig, method: 'post' },

  //fan
  { path: '/api/fan', handler: apiSetTempThreshold, method: 'post' },

  // display
  { path: '/api/display', handler: apiSetDispaly, method: 'post' },
  { path: '/api/display', handler: apiGetDisplay, method: 'get' },

  // Shortcuts
  { path: '/api/shortcuts/:targetOS', handler: getShortcuts, method: 'get' },
  { path: '/api/shortcuts/:targetOS', handler: createShortcut, method: 'post' },
  { path: '/api/shortcuts/:targetOS/:name', handler: updateShortcut, method: 'patch' },
  { path: '/api/shortcuts/:targetOS/:name', handler: deleteShortcut, method: 'delete' },
  { path: '/api/shortcuts/:targetOS/reset', handler: resetShortcuts, method: 'post' },

  //network
  { path: '/api/network/port', handler: apiChangeWebServerPort, method: 'post' },
  { path: '/api/network/protocol', handler: apiSetWebServerProtocol, method: 'post' },
  { path: '/api/network', handler: apiGetWebServerInfo, method: 'get' },
  { path: '/api/network/acl', handler: apiGetACLState, method: 'get' },
  { path: '/api/network/acl', handler: apiAddList, method: 'post' },
  { path: '/api/network/acl', handler: apiDelete, method: 'delete' },
  { path: '/api/network/acl/mode', handler: apiChangeACLMode, method: 'post' },
  
  //wol
  { path: '/api/wol', handler: apiWakeOnLan, method: 'post' },
  { path: '/api/wol/send', handler: apiSendWakeOnLanList, method: 'post' },
  { path: '/api/wol', handler: apiGetWakeOnLanList, method: 'get' },
  { path: '/api/wol/', handler: apiDeleteWakeOnLan, method: 'delete' },
  { path: '/api/v2/wol', handler: apiAddWakeOnLan, method: 'post' },

  // healthcheck
  { path: '/api/healthcheck', handler: apiSetHealthCheck, method: 'post' },
  { path: '/api/healthcheck', handler: apiGetHealthCheck, method: 'get' },

  // serial 
  { path: '/api/serial', handler: apiSetSerailDevice, method: 'post' },
  { path: '/api/serial', handler: apiGetSerailDevice, method: 'get' },

  // conduct
  { path: '/api/conduct/update', handler: apiUpdateUrlConduct, method: 'post' },
  { path: '/api/conduct/active', handler: apiActiveConduct, method: 'post' },
  { path: '/api/conduct', handler: apiGetConducState, method: 'get' },

  // Wi-Fi
  { path: '/api/wifi/scan', handler: scanWifi, method: 'get' },
  { path: '/api/wifi/status', handler: wifiStatus, method: 'get' },
  { path: '/api/wifi/connect', handler: connectWifi, method: 'post' },
  { path: '/api/wifi/disconnect', handler: disconnectWifi, method: 'post' },
  
  // ip (NetworkManager IPv4)
  { path: '/api/ip/interfaces', handler: listInterfaces, method: 'get' },
  { path: '/api/ip/:iface', handler: getInterfaceConfig, method: 'get' },
  { path: '/api/ip/:iface/static', handler: setStaticIPv4, method: 'post' },
  { path: '/api/ip/:iface/dhcp', handler: setDHCPv4, method: 'post' },
  
  // update (SSE streaming)
  { path: '/api/update/stream', handler: apiUpdateStream, method: 'get' },

  // recorder
  { path: '/api/recorder', handler: apiRecorderList, method: 'get' },
  { path: '/api/recorder/download', handler: apiRecorderDownload, method: 'get' },
  { path: '/api/recorder/upload', handler: apiRecorderUpload, method: 'post' },
  { path: '/api/recorder/start', handler: apiRecorderStart, method: 'post' },
  { path: '/api/recorder/stop', handler: apiRecorderStop, method: 'post' },
  { path: '/api/recorder/run', handler: apiRecorderRun, method: 'post' },
  { path: '/api/recorder/stopRun', handler: apiRecorderStopRun, method: 'post' },
  { path: '/api/recorder/:file', handler: apiRecorderDelete, method: 'delete' },

  // mic
  { path: '/api/mic', handler: apiMicState, method: 'get' },
  { path: '/api/mic', handler: apiMicSet, method: 'post' },
];

export default routes;
