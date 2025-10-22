
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
import { apiATXClick, apiATXState } from './atx.route.js';
import state from './state.route.js';
import { apiVideoControl, apiVideoConfig, apiGetVideoState, apiRecording, apiResolutionChange, apiSnapshot, apiEdidInfo,  apiEdidSet } from './video.route.js';
import KVMDMain from './kvmd_main.route.js';
import { apiEnableHID, apiChangeMode, apiGetStatus, apiKeyboardPaste, apiKeyboardShortcuts, apiGetShortcutsConfig, apiHIDLoopBlock, apiHIDLoopStatus, apiKeyboardPasteLanguage } from './hid.route.js';
import {
  apiUpload,
  apiCreateMSD,
  apiState,
  apiConnect,
  apiImages,
  apiRemoveMSD,
  apiDeleteImage,
  apiGetUploadProgress,
  apiGetMakeImageProgress
} from './msd.route.js';
import { apiLogin, apiUpdateAccount, apiGetUserList, apiCreateAccount, apiDeleteAccount,apiGetAuthState, apiChangeAuthExpiration } from './login.route.js';
import {
  apiGetSwitch,
  apiSwitchActive,
  apiSwitchUpdate,
  apiSwitchChannel
} from './switch.route.js';
import { apiReboot, apiGetDevice, apiGetSystemInfo, apiGetLogs } from './system.routes.js';
import { apiOcr } from './ocr.route.js';
import { apiWakeOnLan, apiSendWakeOnLanList, apiGetWakeOnLanList, apiAddWakeOnLan, apiDeleteWakeOnLan} from './wol.route.js'; 
import { apiMouseJiggler, apiChangeJigglerTime, apiV2MouseJiggler, apiMouseEvent } from './mouse.route.js';
import {apiTwoFa, apiTwoFaVerify, apiGetTwoFaInfo} from './twoFa.js';
import {apiPrometheusEnable, apiPrometheusState} from './prometheus.route.js';
import {  apiVPNEnable, apiVPNState } from './vpn.route.js';
import {apiResetConfig } from './config.route.js'
import {apiSetTempThreshold } from './fan.route.js';
import {apiSetDispaly, apiGetDisplay } from './display.route.js';
import {apiChangeWebServerPort} from './network.route.js';
import { apiGetHealthCheck, apiSetHealthCheck } from './health.route.js';
import {apiDownloadFile} from './download.route.js';
import {apiGetSerailDevice, apiSetSerailDevice} from './serial.route.js';

/**
 * Array of route objects.
 * @typedef {Object} Route
 * @property {string} path - The route path.
 * @property {function} handler - The route handler function.
 * @property {string} method - The HTTP method for the route.
 * @private
 */
const routes = [
  { path: '/api/atx/state', handler: apiATXState, method: 'post' },
  { path: '/api/atx/click', handler: apiATXClick, method: 'post' },
  { path: '/api/state', handler: state, method: 'post' },
  
  { path: '/api/video', handler: apiVideoControl, method: 'post' },
  { path: '/api/video/config', handler: apiVideoConfig, method: 'post' },
  { path: '/api/video/state', handler: apiGetVideoState, method: 'post' },
  { path: '/api/video/record', handler: apiRecording, method: 'post' },
  { path: '/api/video/resolution', handler: apiResolutionChange, method: 'post' },
  { path: '/api/video/screenshot', handler: apiSnapshot, method: 'get' },
  { path: '/api/video/edid', handler: apiEdidInfo, method: 'get' },
  { path: '/api/video/edid', handler: apiEdidSet, method: 'post' },

  { path: '/api/kvmdmain', handler: KVMDMain, method: 'post' },
  { path: '/api/hid', handler: apiEnableHID, method: 'post' },
  { path: '/api/hid/mode', handler: apiChangeMode, method: 'post' },
  { path: '/api/hid/status', handler: apiGetStatus, method: 'post' },
  { path: '/api/hid/paste', handler: apiKeyboardPaste, method: 'post' },
  { path: '/api/hid/paste', handler: apiKeyboardPasteLanguage, method: 'get' },

  { path: '/api/hid/shortcuts', handler: apiKeyboardShortcuts, method: 'post' },
  { path: '/api/hid/shortcuts/config', handler: apiGetShortcutsConfig, method: 'post' },
  { path: '/api/mouse/event', handler: apiMouseEvent, method: 'post' },
  { path: '/api/mouse/jiggler', handler: apiMouseJiggler, method: 'get' },
  { path: '/api/mouse/jiggler', handler: apiChangeJigglerTime, method: 'post' },
  { path: '/api/v2/mouse/jiggler', handler: apiV2MouseJiggler, method: 'post' },
  { path: '/api/hid/loop/block', handler: apiHIDLoopBlock, method: 'post' },
  { path: '/api/hid/loop', handler: apiHIDLoopStatus, method: 'get' },
  
  { path: '/api/msd/upload', handler: apiUpload, method: 'post' },
  { path: '/api/msd/upload/progress', handler: apiGetUploadProgress, method: 'post' },
  { path: '/api/msd/create', handler: apiCreateMSD, method: 'post' },
  { path: '/api/msd/create/progress', handler: apiGetMakeImageProgress, method: 'post' },
  { path: '/api/msd/state', handler: apiState, method: 'post' },
  { path: '/api/msd/connect', handler: apiConnect, method: 'post' },
  { path: '/api/msd/images', handler: apiImages, method: 'post' },
  { path: '/api/msd/remove', handler: apiRemoveMSD, method: 'post' },
  { path: '/api/msd/delete', handler: apiDeleteImage, method: 'post' },

  { path: '/api/login', handler: apiLogin, method: 'post' },
  { path: '/api/account/update', handler: apiUpdateAccount, method: 'post' },
  { path: '/api/account', handler: apiGetUserList, method: 'get' },
  { path: '/api/account/create', handler: apiCreateAccount, method: 'post' },
  { path: '/api/account/delete', handler: apiDeleteAccount, method: 'post' },
 
  { path: '/api/2fa', handler: apiTwoFa, method: 'post' },
  { path: '/api/2fa/info', handler: apiGetTwoFaInfo, method: 'post' },
  { path: '/api/2fa/verify', handler: apiTwoFaVerify, method: 'post' },


  { path: '/api/auth/expiration', handler: apiChangeAuthExpiration, method: 'post' },

  { path: '/api/switch/', handler: apiGetSwitch, method: 'get' },
  { path: '/api/switch/:id/activate', handler: apiSwitchActive, method: 'post' },
  { path: '/api/switch/:id/channel', handler: apiSwitchChannel, method: 'post' },
  { path: '/api/switch/:id/update', handler: apiSwitchUpdate, method: 'post' },

  { path: '/api/reboot', handler: apiReboot, method: 'post' },
  { path: '/api/device', handler: apiGetDevice, method: 'post' },
  { path: '/api/systeminfo', handler: apiGetSystemInfo, method: 'post' },
  { path: '/api/ocr', handler: apiOcr, method: 'post' },

  { path: '/api/logs', handler: apiGetLogs, method: 'post' },

  { path: '/api/auth/state', handler: apiGetAuthState, method: 'get' },

  { path: '/api/prometheus', handler: apiPrometheusEnable, method: 'post' },
  { path: '/api/prometheus', handler: apiPrometheusState, method: 'get' },

  { path: '/api/vpn', handler: apiVPNEnable, method: 'post' },
  { path: '/api/vpn', handler: apiVPNState, method: 'get' },

  { path: '/api/security/config/reset', handler: apiResetConfig, method: 'post' },

  { path: '/api/fan', handler: apiSetTempThreshold, method: 'post' },

  { path: '/api/display', handler: apiSetDispaly, method: 'post' },
  { path: '/api/display', handler: apiGetDisplay, method: 'get' },

  { path: '/api/network/port', handler: apiChangeWebServerPort, method: 'post' },

  { path: '/api/wol', handler: apiWakeOnLan, method: 'post' },
  { path: '/api/wol/send', handler: apiSendWakeOnLanList, method: 'post' },
  { path: '/api/wol', handler: apiGetWakeOnLanList, method: 'get' },
  { path: '/api/wol/', handler: apiDeleteWakeOnLan, method: 'delete' },
  { path: '/api/v2/wol', handler: apiAddWakeOnLan, method: 'post' },

  { path: '/api/healthcheck', handler: apiSetHealthCheck, method: 'post' },
  { path: '/api/healthcheck', handler: apiGetHealthCheck, method: 'get' },

  { path: '/api/virtual-media/:filename', handler: apiDownloadFile, method: 'get' },

  { path: '/api/serial', handler: apiSetSerailDevice, method: 'post' },
  { path: '/api/serial', handler: apiGetSerailDevice, method: 'get' },
  
];

export default routes;
