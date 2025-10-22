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

import {generateSecret,verifyToken } from  'node-2fa';
import QRCode from 'qrcode';
import fs from 'fs';
import { CONFIG_PATH, UTF8 } from '../common/constants.js';
import Logger from '../log/logger.js';

const logger = new Logger();

class TwoFactorAuth {

  _getUsers() {
    const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const { Accounts } =  JSON.parse(fs.readFileSync(userManager.userFile, UTF8));
    return Accounts;
  }

  getTwoFaStatus(userName) {
    const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const userContent =  JSON.parse(fs.readFileSync(userManager.userFile, UTF8));
    let users = userContent.Accounts;
    for( let i = 0; i < users.length; i++){
      if(userName === users[i].username){
        return users[i].isTwoFaEnabled;
      }
    }
    return false;
  }

  async getTwoFaQrAndSecret(userName) {
    const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const userContent =  JSON.parse(fs.readFileSync(userManager.userFile, UTF8));
    let users = userContent.Accounts;
    
    for( let i = 0; i < users.length; i++){
      if(userName === users[i].username){
        if(users[i].twoFaUri === "" || users[i].twoFaUri === ""){
          const newSecret = generateSecret({ name: 'BliKVM', account: userName });
          users[i].twoFaSecret = newSecret.secret;
          users[i].twoFaUri = newSecret.uri;
          fs.writeFileSync(userManager.userFile, JSON.stringify(userContent, null, 2), UTF8);
        }

        const qrCodeUrl = await QRCode.toDataURL(users[i].twoFaUri).then((qrCode) => qrCode);
        return {
          enable: users[i].isTwoFaEnabled,
          secret: users[i].twoFaSecret,
          qrCode: qrCodeUrl
        }
      }
    }
    return null;
  }

  async generateSecretAndQr(userName) {
    const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const userContent =  JSON.parse(fs.readFileSync(userManager.userFile, UTF8));
    let users = userContent.Accounts;
    const newSecret = generateSecret({ name: 'BliKVM', account: userName });
    for( let i = 0; i < users.length; i++){
      if(userName === users[i].username){
        users[i].twoFaSecret = newSecret.secret;
        users[i].twoFaUri = newSecret.uri;
        fs.writeFileSync(userManager.userFile, JSON.stringify(userContent, null, 2), UTF8);
        const otpauthUrl = newSecret.uri;
        return QRCode.toDataURL(otpauthUrl).then((qrCode) => qrCode);
      }
    }
    return null;
  }

  enable(userName){
    const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const userContent =  JSON.parse(fs.readFileSync(userManager.userFile, UTF8));
    let users = userContent.Accounts;
    for( let i = 0; i < users.length; i++){
      if(userName === users[i].username){
        logger.info(`Enabling 2fa for ${userName}`);
        users[i].isTwoFaEnabled = true;
        fs.writeFileSync(userManager.userFile, JSON.stringify(userContent, null, 2), UTF8);
        return true;
      }
    }
    logger.error(`${userName} does not exist`);
    return false;
  }

  disable(userName){
    const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const userContent =  JSON.parse(fs.readFileSync(userManager.userFile, UTF8));
    let users = userContent.Accounts;
    for( let i = 0; i < users.length; i++){
      if(userName === users[i].username){
        logger.info(`Disabling 2fa for ${userName}`);
        users[i].isTwoFaEnabled = false;
        fs.writeFileSync(userManager.userFile, JSON.stringify(userContent, null, 2), UTF8);
        return true;
      }
    }
    logger.error(`${userName} does not exist`);
    return false;
  }

  verifyToken(userName, token) {
    const users = this._getUsers();
    const user = users.find(user => user.username === userName);
    if (!user) {
      logger.error(`${userName} does not exist`);
      return false;
    }
    logger.info(`Verifying secret: ${user.twoFaSecret} token: ${token}` );
    const result = verifyToken(user.twoFaSecret, token);
    return result && result.delta === 0;
  }
}

export default TwoFactorAuth;