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
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';

const logger = new Logger();

const ATXState = {
  LED_PWR: 0b01000000,
  LED_HDD: 0b00001000
};

class ATX extends Module {
  static _instance = null;
  _socketPath = null;
  _client = null;
  _ledPwr = false;
  _ledHDD = false;

  constructor() {
    if (!ATX._instance) {
      super();
      ATX._instance = this;
      this._init();
    }

    return ATX._instance;
  }

  _init() {
    const { atx } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._socketPath = atx.stateSockFilePath;
    this._name = 'ATX';
  }

  startService() {

    this._readFileContent()
    .then((content) => {
        this._ledPwr = !!(content[0] & ATXState.LED_PWR);
        this._ledHDD = !!(content[0] & ATXState.LED_HDD);
    })
    .catch((err) => {
        logger.error(`${this._name} initial read error: ${err.message}`);
    });

    this.watcher = fs.watch(this._socketPath, { encoding: 'utf-8' }, (eventType, filename) => {
      if (filename) {
        this._readFileContent()
          .then((content) => {
            if (content[0] & ATXState.LED_PWR) {
              this._ledPwr = true;
            } else {
              this._ledPwr = false;
            }
            if (content[0] & ATXState.LED_HDD) {
              this._ledHDD = true;
            } else {
              this._ledHDD = false;
            }
          })
          .catch((err) => {
            logger.error(`${this._name} error: ${err.message}`);
          });
      }
    });
    this._state = ModuleState.RUNNING;
    logger.info(`ATX API started, state: ${this._state}`);
  }

  closeService() {
    if (this.watcher) {
      this.watcher.close();
      this._state = ModuleState.STOPPED;
      logger.trace(`Stopped watching file: ${this._socketPath}`);
    }
  }

  getATXState() {
    return {
      ledPwr: this._ledPwr,
      ledHDD: this._ledHDD
    };
  }

  _readFileContent() {
    return fs.promises.readFile(this._socketPath);
  }
}

export default ATX;
