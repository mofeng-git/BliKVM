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
import Logger from '../../log/logger.js';
import Module from '../module.js';
import { ModuleState } from '../../common/enums.js';
import { executeScriptAtPath, isDeviceFile } from '../../common/tool.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';

const logger = new Logger();

class HID extends Module {
  static _instance = null;
  _hidEnablePath = null;
  _hidDisablePath = null;
  _hidkeyboard = '/dev/hidg0';
  _hidmouse = '/dev/hidg1';
  _absoluteMode = true;
  _enable = false;

  constructor() {
    if (!HID._instance) {
      super();
      HID._instance = this;
      this._init();
    }
    return HID._instance;
  }

  _init() {
    const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._name = 'HID';
    this._hidEnablePath = hid.hidEnable;
    this._hidDisablePath = hid.hidDisable;
    this._enable = hid.enable;
  }

  startService(mouseMode, msdEnable) {
    return new Promise((resolve, reject) => {
      if (!isDeviceFile(this._hidkeyboard) && !isDeviceFile(this._hidmouse)) {
        logger.info(this._hidEnablePath);
        executeScriptAtPath(this._hidEnablePath, [`mouse_mode=${mouseMode}`, `msd=${msdEnable}`])
          .then(() => {
            this._state = ModuleState.RUNNING;
            const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
            if (config.hid.enable !== true) {
              config.hid.enable = true;
              fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), UTF8);
            }
            resolve();
          })
          .catch((err) => {
            logger.error(`${this._name} error: ${err}`);
            reject(err);
          });
      } else {
        this._state = ModuleState.RUNNING;
        logger.info(`${this._name} already running`);
        resolve();
      }
    });
  }

  closeService() {
    return new Promise((resolve, reject) => {
      executeScriptAtPath(this._hidDisablePath, [])
        .then(() => {
          this._state = ModuleState.STOPPED;
          const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
          if (config.hid.enable !== false) {
            config.hid.enable = false;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), UTF8);
          }
          resolve('hid disable success');
        })
        .catch((err) => {
          logger.error(`${this._name} error: ${err.message}`);
          reject(err);
        });
    });
  }

  changeMode(absolute) {
    const absoluteBool = absolute === 'true';
    return new Promise((resolve, reject) => {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      if (config.hid.absoluteMode === absoluteBool) {
        resolve(`the absolute is alreadly ${config.hid.absoluteMode}`);
      }
      if (this._state === ModuleState.RUNNING) {
        this.closeService()
          .then(() => {
            return this.startService(absolute);
          })
          .then(() => {
            config.hid.absoluteMode = absoluteBool;
            config.hid.enable = true;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), UTF8);
            resolve(`${this._name} mode changed successfully, need reboot your kvm`);
          })
          .catch((err) => {
            logger.error(`${this._name} error: ${err.message}`);
            reject(err);
          });
      } else {
        this.startService(absolute)
          .then(() => {
            config.hid.absoluteMode = absoluteBool;
            config.hid.enable = true;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), UTF8);
            resolve(`${this._name} mode changed successfully, need reboot your kvm`);
          })
          .catch((err) => {
            logger.error(`${this._name} error: ${err.message}`);
            reject(err);
          });
      }
    });
  }

  getStatus() {
    const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    return {
      status: this._state,
      enable: hid.enable,
      mouseMode: hid.mouseMode,
      mouseJiggler: hid.mouseJiggler,
      jigglerTimeDiff: hid.jigglerTimeDiff,
      loopBlock: hid.pass_through.block
    };
  }
}

export default HID;
