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
import HttpServer from './server/server.js';
import Video from './modules/video/video.js';
import KVMDMain from './modules/kvmd/kvmd_main.js';
import ATX from './modules/kvmd/kvmd_atx.js';
import Janus from './modules/kvmd/kvmd_janus.js';
import HID from './modules/kvmd/kvmd_hid.js';
import KVMSwitchFactory from './modules/kvmd/switch/kvmd_switch.js';
import { CONFIG_PATH, UTF8, SWITCH_PATH } from './common/constants.js';
import { Notify } from './modules/notification.js';
import UserConfigUpdate from './modules/update/user_update.js';
import AppConfigUpdate from './modules/update/app_update.js';
import SwitchConfigUpdate from './modules/update/switch_update.js';
import WOLConfigUpdate from './modules/update/wake_on_lane_update.js';
import ACLConfigUpdate from './modules/update/access_control_list_update.js';
import ShortcutsConfigUpdate from './modules/update/shortcuts_update.js';
import { startHIDPassthroughListening } from './server/kvmd_event_listenner.js';
import Mouse from './server/mouse.js';
import Keyboard from './server/keyboard.js';
import { killProcessByName } from './common/kill.js';
import { startCheck } from './modules/start_check.js';

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

// update access_control_list.json
const aclConfigUpdate = new ACLConfigUpdate();
aclConfigUpdate.upgradeFile();

// update shortcuts.json
const shortcutsConfigUpdate = new ShortcutsConfigUpdate();
shortcutsConfigUpdate.upgradeFile();

startCheck(); // every start server to check

// Notification singleton is managed internally; no instantiation needed.
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
    const keyboard = new Keyboard();
    keyboard.init();
    //just for make sure jiggler is running
    const mouse = new Mouse();
    mouse.init();
  }, 5000); // 5000 ms delay start ATX service
  setTimeout(() => {
    startHIDLoop();
  }, 6000);
})
.finally(() => {
  logger.info("All services have been started.");
  Notify.info('All services have been started.');
});

// function start switch
function startSwitch() {
  const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
  if (switchObj.kvmSwitch.isActive === true) {
    const switchHandle = KVMSwitchFactory.getSwitchHandle(switchObj.kvmSwitch.activeSwitchId);
    if (switchHandle !== null) {
      switchHandle.enableSwitch();
    }else {
      switchObj.kvmSwitch.isActive = false;
      switchObj.kvmSwitch.activeSwitchId = -1;
      fs.writeFileSync(SWITCH_PATH, JSON.stringify(switchObj, null, 2), UTF8);
      logger.error('Failed to start the KVM switch due to unknown switch type. The switch has been deactivated.');
    }
  }
}

function startHid() {
  const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  if (hid.enable === true) {
    const hidHandle = new HID();
    hidHandle.startService();
  }
}

async function startJanus(){
  await killProcessByName('janus', { fullMatch: false, termTimeout: 1000 });
  const janus = new Janus();
  janus.startService();
}

function startHIDLoop() {
  const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  if(hid.pass_through.enabled !== true){
    return;
  }
  startHIDPassthroughListening();
}
