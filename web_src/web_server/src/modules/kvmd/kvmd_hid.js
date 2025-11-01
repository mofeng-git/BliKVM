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
import { writeJsonAtomic } from '../../common/atomic-file.js';
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

  // mouseMode: dual relative absolute 
  // msdEnable: enable disable
  startService() {
    return new Promise((resolve, reject) => {
      if (!isDeviceFile(this._hidkeyboard) && !isDeviceFile(this._hidmouse)) {
        logger.info(this._hidEnablePath);
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
        const args = [
          `mouse_mode=${config.hid.mouseMode}`,
          `msd=${config.msd.enable ? 'enable' : 'disable'}`,
          `mic=${config.mic.isRegistered ? 'enable' : 'disable'}`,
        ];
        const identity = (config.hid && config.hid.identity) || {};
        if (identity.idVendor) args.push(`idVendor=${identity.idVendor}`);
        if (identity.idProduct) args.push(`idProduct=${identity.idProduct}`);
        if (identity.manufacturer) args.push(`manufacturer=${identity.manufacturer}`);
        if (identity.product) args.push(`product=${identity.product}`);
        executeScriptAtPath(this._hidEnablePath, args)
          .then( async () => {
            this._state = ModuleState.RUNNING;
            if (config.hid.enable !== true) {
              await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.hid.enable = true; });
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
        .then( async () => {
          this._state = ModuleState.STOPPED;
          const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
          if (config.hid.enable !== false) {
            await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.hid.enable = false; });
          }
          resolve('hid disable success');
        })
        .catch((err) => {
          logger.error(`${this._name} error: ${err.message}`);
          reject(err);
        });
    });
  }

  changeMode(mouseMode) {
    return new Promise((resolve, reject) => {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      if (this._state === ModuleState.RUNNING) {
        this.closeService()
          .then(() => {
            return this.startService(mouseMode, config.msd.enable ? 'enable' : 'disable');
          })
          .then(() => {
            writeJsonAtomic(CONFIG_PATH, (cfg) => {
              cfg.hid.mouseMode = mouseMode;
              cfg.hid.enable = true;
            });
            resolve(`${this._name} mode changed successfully, need reboot your kvm`);
          })
          .catch((err) => {
            logger.error(`${this._name} error: ${err.message}`);
            reject(err);
          });
      } else {
        this.startService(mouseMode, config.msd.enable ? 'enable' : 'disable')
          .then(() => {
            writeJsonAtomic(CONFIG_PATH, (cfg) => {
              cfg.hid.mouseMode = mouseMode;
              cfg.hid.enable = true;
            });
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
      jigglerInterval: hid.jigglerInterval,
      passThrough: hid.pass_through.enabled,
    };
  }
}

export default HID;
