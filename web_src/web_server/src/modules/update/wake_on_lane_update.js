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
import { UTF8, WOL_PATH } from '../../common/constants.js';
import Logger from '../../log/logger.js';

const logger = new Logger();

class WOLConfigUpdate {

  constructor() {
    this._filePath = WOL_PATH;
    this._defaultConfig = {
      "version": 1,
      "items": [
      ]
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
        logger.warn('No wake on lane config version found, use latest default config');
        fs.writeFileSync(this._filePath, JSON.stringify(this._defaultConfig, null, 2), UTF8);
        return;
      }

      const upgradedData = this.upgradeData(localData);

      fs.writeFileSync(this._filePath, JSON.stringify(upgradedData, null, 2), UTF8);

      logger.info('wake_on_lane.json file successfully update!');

    } catch (error) {
      logger.error(`${error}`);
    }
  }
}

export default WOLConfigUpdate;