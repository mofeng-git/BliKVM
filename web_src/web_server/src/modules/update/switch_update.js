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
import {fileExists} from '../../common/tool.js'
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import Logger from '../../log/logger.js';

const logger = new Logger();

class SwitchConfigUpdate {

  constructor() {
    const { switchManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._filePath = switchManager.file;
    this._defaultConfig = {
        "version": 1,
        "kvmSwitch": {
            "isActive": false,
            "activeSwitchId": "None",
            "items": [
            {
                "id": 1,
                "title": "BliSwitch v1",
                "subtitle": "multiport 4-channel KVM switch",
                "channelCount": 4,
                "deviceFile": "/dev/ttyUSB0",
                "activeChannel": "None",
                "channels": [
                {
                    "name": 1,
                    "override": ""
                },
                {
                    "name": 2,
                    "override": ""
                },
                {
                    "name": 3,
                    "override": ""
                },
                {
                    "name": 4,
                    "override": ""
                }
                ]
            },
            {
                "id": 2,
                "title": "BliSwitch v2",
                "subtitle": "multiport 8-channel ATX KVM switch",
                "channelCount": 8,
                "deviceFile": "/dev/ttyUSB0",
                "activeChannel": "None",
                "channels": [
                {
                    "name": 1,
                    "override": ""
                },
                {
                    "name": 2,
                    "override": ""
                },
                {
                    "name": 3,
                    "override": ""
                },
                {
                    "name": 4,
                    "override": ""
                },
                {
                    "name": 5,
                    "override": ""
                },
                {
                    "name": 6,
                    "override": ""
                },
                {
                    "name": 7,
                    "override": ""
                },
                {
                    "name": 8,
                    "override": ""
                }
                ]
            },
            {
              "id": 3,
              "title": "Tesmart HSW0801",
              "subtitle": "Tesmart 8-channel KVM switch",
              "channelCount": 8,
              "deviceFile": "/dev/ttyUSB0",
              "activeChannel": "None",
              "channels": [
                {
                  "name": 1,
                  "override": ""
                },
                {
                  "name": 2,
                  "override": ""
                },
                {
                  "name": 3,
                  "override": ""
                },
                {
                  "name": 4,
                  "override": ""
                },
                {
                  "name": 5,
                  "override": ""
                },
                {
                  "name": 6,
                  "override": ""
                },
                {
                  "name": 7,
                  "override": ""
                },
                {
                  "name": 8,
                  "override": ""
                }
              ]
            },
            {
              "id": 4,
              "title": "Tesmart HSW1601",
              "subtitle": "Tesmart 16-channel KVM switch",
              "channelCount": 16,
              "deviceFile": "/dev/ttyUSB0",
              "activeChannel": "None",
              "channels": [
                {
                  "name": 1,
                  "override": ""
                },
                {
                  "name": 2,
                  "override": ""
                },
                {
                  "name": 3,
                  "override": ""
                },
                {
                  "name": 4,
                  "override": ""
                },
                {
                  "name": 5,
                  "override": ""
                },
                {
                  "name": 6,
                  "override": ""
                },
                {
                  "name": 7,
                  "override": ""
                },
                {
                  "name": 8,
                  "override": ""
                },
                {
                  "name": 9,
                  "override": ""
                },
                {
                  "name": 10,
                  "override": ""
                },
                {
                  "name": 11,
                  "override": ""
                },
                {
                  "name": 12,
                  "override": ""
                },
                {
                  "name": 13,
                  "override": ""
                },
                {
                  "name": 14,
                  "override": ""
                },
                {
                  "name": 15,
                  "override": ""
                },
                {
                  "name": 16,
                  "override": ""
                }
              ]
            }
            ]
        }
    };
  }

  // 通用升级函数，检查当前版本并逐步升级
  upgradeData(data) {
    return data;
  }

  // 升级配置文件
  upgradeFile() {
    try {
      if(fileExists(this._filePath) === false){
        fs.writeFileSync(this._filePath, JSON.stringify(this._defaultConfig, null, 2), UTF8);
        return;
      }

      const localData = JSON.parse(fs.readFileSync(this._filePath, UTF8));
      if (!localData.version) {
        logger.warn('No switch config version found, use latest default config');
        fs.writeFileSync(this._filePath, JSON.stringify(this._defaultConfig, null, 2), UTF8);
        return;
      }

      const upgradedData = this.upgradeData(localData);

      fs.writeFileSync(this._filePath, JSON.stringify(upgradedData, null, 2), UTF8);

      logger.info('switch.json file successfully update!');

    } catch (error) {
      logger.error(`${error}`);
    }
  }
}

export default SwitchConfigUpdate;