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
import { ModuleState } from '../../../common/enums.js';
import {Notification, NotificationType} from '../../notification.js';
import fs from 'fs';
import {UTF8, SWITCH_PATH } from '../../../common/constants.js';

class KVMSwitchBase {
  _id = -1;
  _name = 'None';
  _channel = 'None';
  _state = ModuleState.STOPPED;
  _last_data = '';

  enableSwitch() {
    throw new Error('must overwrite by children class');
  }

  disableSwitch() {
    throw new Error('must overwrite by children class');
  }

  setLable() {
    throw new Error('must overwrite by children class');
  }

  getId() {
    return this._id;
  } 

  getName() {
    return this._name;
  }

  getChannel() {
    return this._channel;
  }

  getState() {
    return this._state;
  }

  switchChannel() {
    throw new Error('must overwrite by children class');
  }

  _setConfigDisable(){
    const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
    if (switchObj.kvmSwitch.isActive === true) {
      switchObj.kvmSwitch.isActive = false;
      fs.writeFileSync(SWITCH_PATH, JSON.stringify(switchObj, null, 2), UTF8);
    }
  }

  sendErrorNotification(text) {
    const notification = new Notification();
    notification.addMessage(NotificationType.ERROR, text);
  }
}

export default KVMSwitchBase;
