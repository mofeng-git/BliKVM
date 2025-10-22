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
import fs from 'fs';
import Logger from './log/logger.js';
import { getHardwareType } from './common/tool.js';
import { HardwareType } from './common/enums.js';
import HttpServer from './server/server.js';
import Video from './modules/video/video.js';
import KVMDMain from './modules/kvmd/kvmd_main.js';
import ATX from './modules/kvmd/kvmd_atx.js';
import Janus from './modules/kvmd/kvmd_janus.js';
import HID from './modules/kvmd/kvmd_hid.js';
import KVMSwitchFactory from './modules/kvmd/switch/kvmd_switch.js';
import { CONFIG_PATH, UTF8, SWITCH_PATH } from './common/constants.js';
import {NotificationType, Notification } from './modules/notification.js';
import UserConfigUpdate from './modules/update/user_update.js';
import AppConfigUpdate from './modules/update/app_update.js';
import SwitchConfigUpdate from './modules/update/switch_update.js';
import WOLConfigUpdate from './modules/update/wake_on_lane_update.js';
import {InputEventListener, getFilteredEventDevices} from './server/kvmd_event_listenner.js';
import Mouse from './server/mouse.js';

process.env.UV_THREADPOOL_SIZE = 8;

// process.on('SIGINT', () => {
//   console.log('kill self');
//   process.kill(process.pid, 'SIGKILL');
// }
// );

// udpate app.json
const appConfigUpdate = new AppConfigUpdate();
appConfigUpdate.upgradeFile();

// update user.json
const userConfigUpdate = new UserConfigUpdate();
userConfigUpdate.upgradeFile();

// update switch.json
const switchConfigUpdate = new SwitchConfigUpdate();
switchConfigUpdate.upgradeFile();

// udpate wake_on_lane.json
const wolConfigUpdate = new WOLConfigUpdate();
wolConfigUpdate.upgradeFile();

const notification = new Notification();
const logger = new Logger();


const httpServer = new HttpServer();

httpServer.startService().then((result) => {
  startHid();
  const video = new Video();
  video.startService();
  const kvmdmain = new KVMDMain();
  kvmdmain.startService();
  startJanus();
  startSwitch();
  const atx = new ATX();
  setTimeout(() => {
    atx.startService();
    //just for make sure jiggler is running
    const mouse = new Mouse();
  }, 5000); // 5000 ms delay start ATX service

  startHIDLoop();
})
.finally(() => {
  logger.info("All services have been started.");
  notification.addMessage(NotificationType.INFO, 'All services have been started.');
});

// function start switch
function startSwitch() {
  const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
  if (switchObj.kvmSwitch.isActive === true) {
    const switchHandle = KVMSwitchFactory.getSwitchHandle(switchObj.kvmSwitch.activeSwitchId);
    switchHandle.enableSwitch();
  }
}

function startHid() {
  const { hid,msd } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  if (hid.enable === true) {
    const hidHandle = new HID();
    const mouseMode = hid.mouseMode;
    const msdEnable = msd.enable;
    hidHandle.startService(mouseMode,msdEnable);
  }
}

function startJanus(){
  const janus = new Janus();
  janus.startService();
}

function startHIDLoop() {
  const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  if(hid.pass_through.enabled !== true){
    return;
  }
  const eventDevices = getFilteredEventDevices();
  eventDevices.forEach(device => {
    const inputEventListener = new InputEventListener();
    inputEventListener.open(`/dev/input/${device.event}`);
  });
}
