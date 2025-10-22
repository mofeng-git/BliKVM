
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
import KVMDBliSwitchV1 from './kvmd_switch_v1.js';
import KVMDBliSwitchV2 from './kvmd_switch_v2.js';
import KVMDTesmartHSW0801Switch from './kvmd_switch_tesmart_hsw0801.js';
import KVMDTesmartHSW1601Switch from './kvmd_switch_tesmart_hsw1601.js';
import Logger from '../../../log/logger.js';
import {
  SWITCH_PATH,
  UTF8
} from '../../../common/constants.js';
import {SwitchModulesID} from '../../../common/enums.js';
import fs from 'fs';

const logger = new Logger();

class KVMSwitchFactory {
  static _instance = null;

  static getSwitchHandle(switchId) {
    if (this._instance !== null) {
      if (switchId === this._instance.getId()) {
        return this._instance;
      } else {
        this._instance.disableSwitch();
      }
    }

    switch (switchId) {
      case SwitchModulesID.BliKVM_switch_v1:
        this._instance = new KVMDBliSwitchV1();
        break;
      case SwitchModulesID.BliKVM_switch_v2:
        this._instance = new KVMDBliSwitchV2();
        break;
      case SwitchModulesID.TESmart_HSW0801_switch:
        this._instance = new KVMDTesmartHSW0801Switch();
        break;
      case SwitchModulesID.TESmart_HSW1601_switch:
        this._instance = new KVMDTesmartHSW1601Switch();
        break;
      default:
        logger.error(`Unknown switch type: ${switchId}`);
        return null;
    }

    return this._instance;
  }

  static setActiveSwitchId(switchId) {
    const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
    switchObj.kvmSwitch.activeSwitchId = switchId
    fs.writeFileSync(SWITCH_PATH, JSON.stringify(switchObj, null, 2), UTF8);
    return true;
  }
}

export default KVMSwitchFactory;
