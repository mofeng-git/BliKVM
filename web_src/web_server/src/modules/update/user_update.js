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

class UserConfigUpdate {

  constructor() {
    const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._filePath = userManager.userFile;
    this._defaultConfig = {
        "version": 2,
        "Roles": [
          {
            "role": "admin",
            "description": "full access"
          },
          {
            "role": "readonly",
            "description": "limited access"
          }
        ],
        "Accounts": [
          {
            "username": "admin",
            "password": "$2b$10$iB3xpN8gl/iXusff8d3xCeRJu5M1s71RFgSveZTKuBymerQREUIja",
            "role": "admin",
            "isEnabled": true,
            "isTwoFaEnabled": false,
            "twoFaSecret": "",
            "twoFaUri": ""
          },
          {
            "username": "blikvm",
            "password": "$2b$10$.3cX/1cVKwgTxERqaYpdL.VVE0ippbiAUFtMJLA77vEcAGuuwgmBS",
            "role": "readonly",
            "isEnabled": true,
            "isTwoFaEnabled": false,
            "twoFaSecret": "",
            "twoFaUri": ""
          }
        ]
    };
  }

  upgradeV1toV2(data) {
    data.Accounts.forEach(account => {
      if (account.isTwoFaEnabled === undefined) {
        account.isTwoFaEnabled = false; 
      }
      if (account.twoFaSecret === undefined) {
        account.twoFaSecret = ''; 
      }
      if (account.twoFaUri === undefined) {
        account.twoFaUri = ''; 
      }
    });
    data.version = 2;
    return data;
  }

  upgradeV2toV3(data) {
    data.version = 3;
    return data;
  }

  // 通用升级函数，检查当前版本并逐步升级
  upgradeData(data) {
    if (data.version === 1) {
      logger.info('Upgrading from version 1 to version 2...');
      data = this.upgradeV1toV2(data);
    }
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
        logger.warn('No user config version found, use latest default config');
        fs.writeFileSync(this._filePath, JSON.stringify(this._defaultConfig, null, 2), UTF8);
        return;
      }

      const upgradedData = this.upgradeData(localData);

      fs.writeFileSync(this._filePath, JSON.stringify(upgradedData, null, 2), UTF8);

      logger.info('user.json file successfully update!');

    } catch (error) {
      logger.error(`${error}`);
    }
  }
}

export default UserConfigUpdate;