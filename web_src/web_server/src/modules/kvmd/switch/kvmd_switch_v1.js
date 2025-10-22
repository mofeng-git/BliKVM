
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
import Logger from '../../../log/logger.js';
import Serial from '../../serial.js';
import { ModuleState, SwitchModulesID} from '../../../common/enums.js';
import { SWITCH_PATH, UTF8 } from '../../../common/constants.js';
import KVMSwitchBase from './kvmd_switch_base.js';
import { isDeviceFile } from '../../../common/tool.js';

const logger = new Logger();

const ChannelCode = {
  ChannelNone: 'None',
  Channel1: 'G01gA',
  Channel2: 'G02gA',
  Channel3: 'G03gA',
  Channel4: 'G04gA'
};

const ChannelCommand = {
  Channel1: 'SW1\r\nG01gA\r\n',
  Channel2: 'SW2\r\nG02gA\r\n',
  Channel3: 'SW3\r\nG03gA\r\n',
  Channel4: 'SW4\r\nG04gA\r\n'
};

class KVMDBliSwitchV1 extends KVMSwitchBase {
  _serialHandle = null;

  constructor() {
    super();
    this._init();
  }

  _init() {
    const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
    const item = switchObj.kvmSwitch.items.find(item => item.id === 1);
    if (item === null) {
      logger.error('Can not find switch item');
      return;
    }
    this._id = item.id;
    this._path = item.deviceFile;
    this._name = item.title;
    this._baudRate = 19200;
    logger.info(`KVMDBliSwitchV1 init success, path: ${this._path}, name: ${this._name}`);
  }

  enableSwitch() {
    return new Promise((resolve, reject) => {
      try {
        if (this._state === ModuleState.RUNNING) {
          resolve({
            result: false,
            msg: 'Switch is already running'
          });
          return;
        }

        const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
        const item = switchObj.kvmSwitch.items.find(item => item.id === 1);
        this._path = item.deviceFile;

        if (isDeviceFile(this._path) === false) {
          const text = `Switch path ${this._path} is not exist`;
          logger.error(text);
          this.sendErrorNotification(text);
          this._setConfigDisable();
          resolve({
            result: false,
            msg: `Switch path ${this._path} is not exist`
          });
          return;
        }
        this._serialHandle = new Serial(this._path, this._baudRate);
        this._serialHandle.startService();

        this._serialHandle._process.on('open', () => {
          logger.info(`${this._name} open success`);
          this._state = ModuleState.RUNNING;
          const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
          if (switchObj.kvmSwitch.isActive === false) {
            switchObj.kvmSwitch.isActive = true;
            fs.writeFileSync(SWITCH_PATH, JSON.stringify(switchObj, null, 2), UTF8);
          }
          resolve({
            result: true,
            msg: 'Switch is running'
          });
        });

        this._serialHandle._process.on('error', (err) => {
          logger.error(`${this._name} error: ${err.message}`);
          reject(err);
        });

        this._serialHandle._process.on('close', () => {
          this._state = ModuleState.STOPPED;
          logger.info(`${this._name} closed`);
        });

        this._serialHandle._process.on('data', (data) => {
          const currentData = data.toString().trim();
          if(currentData.length > 8){
            return;
          }
          if (this._last_data !== currentData) {
            logger.info(`${this._name} data: ${data}`);
            this._last_data = currentData;
            if (data.includes(ChannelCode.Channel1)) {
              this._channel = 1;
            } else if (data.includes(ChannelCode.Channel2)) {
              this._channel = 2;
            } else if (data.includes(ChannelCode.Channel3)) {
              this._channel = 3;
            } else if (data.includes(ChannelCode.Channel4)) {
              this._channel = 4;
            } else {
              this._channel = ChannelCode.ChannelNone;
            }
            const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
            const item = switchObj.kvmSwitch.items.find(item => item.id === 1);
            item.activeChannel = this._channel;
            fs.writeFileSync(SWITCH_PATH, JSON.stringify(switchObj, null, 2), UTF8);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disableSwitch() {
    return new Promise((resolve, reject) => {
      if (this._state !== ModuleState.RUNNING) {
        resolve({
          result: false,
          msg: `Switch state is ${this._state} can't be disabled`
        });
      }
      this._serialHandle.closeService();

      this._setConfigDisable();

      this._serialHandle = null;
      resolve({
        result: true,
        msg: 'Switch is disabled'
      });
    });
  }

  switchChannel(channel) {
    if (this._state !== ModuleState.RUNNING) {
      const text = `Switch state is ${this._state} can't be switched`;
      logger.warn(text);
      this.sendErrorNotification(text);
      return {
        result: false,
        msg: 'Switch is not in running state'
      };
    }
    const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
    const item = switchObj.kvmSwitch.items.find(item => item.id === SwitchModulesID.BliKVM_switch_v1);
    if (item === null) {
      logger.error('Can not find switch item');
      return {
        result: false,
        msg: 'Switch is not in running state'
      };
    }
    if (channel === item.channels[0].name) {
      this._serialHandle.write(ChannelCommand.Channel1);
    } else if (channel === item.channels[1].name) {
      console.log("Channel2");
      this._serialHandle.write(ChannelCommand.Channel2);
    } else if (channel === item.channels[2].name) {
      this._serialHandle.write(ChannelCommand.Channel3);
    } else if (channel === item.channels[3].name) {
      this._serialHandle.write(ChannelCommand.Channel4);
    } else {
      return {
        result: false,
        msg: 'input error channel'
      };
    }
    return {
      result: true,
      msg: `Switch to ${channel}`
    };
  }
}

export default KVMDBliSwitchV1;
