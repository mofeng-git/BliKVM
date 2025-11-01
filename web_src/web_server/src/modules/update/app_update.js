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
import {fileExists, dirExists} from '../../common/tool.js'
import { CONFIG_PATH, UTF8, CONFIG_DIR} from '../../common/constants.js';
import Logger from '../../log/logger.js';
import {defaultConfig , getHardwareTypeForConfig}from './app_default_config.js';

const logger = new Logger();

const hardware = getHardwareTypeForConfig();

class AppConfigUpdate {

  constructor() {
    this._filePath = CONFIG_PATH;
    this._defaultConfig = defaultConfig;
  }

  upgradeV1toV2(data) {
    if (data.server.protocol === undefined) {
      data.server.protocol = 'https'; 
    }
    if (data.server.auth === undefined) {
      data.server.auth = true; 
    }
    data.version = 2;
    return data;
  }

  upgradeV2toV3(data) {
    if(data.hid.pass_through === undefined){
      data.hid.pass_through = {
        enabled: false,
        mouse_sensitivity: 0.3
      };
    }
    if(data.server.https_port === undefined){
      data.server.https_port = 443;
    }
    if(data.server.http_port === undefined){
      data.server.http_port = 80;
    }
    if(data.server.authExpiration === undefined){
      data.server.authExpiration = 12;
    }
    if(data.server.ipWhite === undefined){
      data.server.ipWhite ={
        enable: false,
        list: []
      };
    }
    if(data.hid.jigglerTimeDiff === undefined){
      data.hid.jigglerTimeDiff = 60;
    }
    data.version = 3;
    return data;
  }

  upgradeV3toV4(data) {
    if(data.hid.mouseMode === undefined){
      data.hid.mouseMode = 'dual';
    }
    if(data.msd.enable === undefined){
      data.msd.enable = true;
    }
    if(data.display.secondIP === undefined){
      data.display.secondIP = '';
    }
    data.version = 4;
    return data;
  }

  upgradeV4toV5(data) {
    if(data.prometheus === undefined){
      data.prometheus = {
        enabled: false,
        username: 'admin',
        password: 'admin',
        interval: 15
      };
    }
    if( data.hid.pass_through.blockFlag === undefined){
      data.hid.pass_through.blockFlag = false;
    }
    if(data.switchManager === undefined){
      data.switchManager = {
        file: "./config/switch.json"
      };
    }
    if (data.hid.jigglerTimeDiff !== undefined) {
      data.hid.jigglerInterval = data.hid.jigglerTimeDiff;
      delete data.hid.jigglerTimeDiff;
    }
    if (data.hid.jigglerInterval === undefined) {
        data.hid.jigglerInterval = 60;
    }
    if (data.fan === undefined) {
      data.fan = {
        tempThreshold: 65
      };
    }
    if(data.display !== undefined){
      if(data.display.isActive === false){
        data.display.mode = 'off';
      }
      delete data.display.isActive;
      if(data.display.secondIP === undefined){
        data.display.secondaryIP = data.display.secondIP;
        delete data.display.secondIP;
      }
      if(data.display.mode === 0){
        data.display.mode = 'always';
      }else if(data.display.mode === 1){
        data.display.mode = 'boot';
      }else if(data.display.mode === 2){
        data.display.mode = 'interval';
      }else{
        data.display.mode = 'boot';
      }
    }
    if(data.hid.keymaps === undefined){
      data.hid.keymaps = './lib/keymaps';
    }
    data.version = 5;
    return data;
  }

  upgradeV5toV6(data){
    if(data.healthCheck === undefined ){
      data.healthCheck = {
        RAM: 0.7,
        storage: 0.7,
        latency: 80,
        temperature: 70
      };
    }
    if(data.janus === undefined){
      data.janus = {
        bin: `./lib/${hardware}/janus`,
        configsFolder: `./lib/${hardware}/janus_configs`,
        pluginsFolder: `./lib/${hardware}/janus_plugins`
      };
    }
    data.version = 6;
    return data;
  }

  upgradeV6toV7(data){
    if(data.atx.isActive === undefined ){
      data.atx.isActive = true; // 默认启用ATX功能
    }
    if( data.codeOfConduct === undefined ){
      data.codeOfConduct = {
        isActive: true,
        url: ''
      };
    }
    data.version = 7;
    return data;
  }

  upgradeV7toV8(data){
    if(data.hid.pass_through.wheelReverse === undefined ){
      data.hid.pass_through.wheelReverse = false; // 默认鼠标滚轮不反转
    }

    data.version = 8;
    return data;
  }

  upgradeV8toV9(data){
    if(data.hid.identity === undefined ){
      data.hid.identity = {
        idVendor: "0x1d6b",
        idProduct: "0x0106",
        manufacturer: "BliKVM",
        product: "Multifunction USB Device"
      };
    }
    if(data.deviceVersion === undefined ){
      data.deviceVersion = "BliKVM";
    }
    if(data.server.mdnsEnabled === undefined ){
      data.server.mdnsEnabled = true;
    }
    data.version = 9;
    return data;
  }

  upgradeV9toV10(data){
    if(data.mic === undefined ){
      data.mic = {
        isRegistered: false
      };
    }
    data.version = 10;
    return data;
  }


  // 通用升级函数，检查当前版本并逐步升级
  upgradeData(data) {
    if (data.version === 1) {
      logger.info('Update from version 1 to version 2...');
      data = this.upgradeV1toV2(data);
    }
    if (data.version === 2) {
      logger.info('Update from version 2 to version 3...');
      data = this.upgradeV2toV3(data);
    }
    if (data.version === 3) {
      logger.info('Update from version 3 to version 4...');
      data = this.upgradeV3toV4(data);
    }
    if( data.version === 4){
      logger.info('Update from version 4 to version 5...');
      data = this.upgradeV4toV5(data);
    }
    if( data.version === 5 ){
      logger.info('Update from version 5 to version 6...');
      data = this.upgradeV5toV6(data);
    }
    if( data.version === 6 ){
      logger.info('Update from version 6 to version 7...');
      data = this.upgradeV6toV7(data);
    }
    if( data.version === 7 ){
      logger.info('Update from version 7 to version 8...');
      data = this.upgradeV7toV8(data);
    }
    if( data.version === 8 ){ 
      logger.info('Update from version 8 to version 9...');
      data = this.upgradeV8toV9(data);
    }
    if( data.version === 9){
      logger.info('Update from version 9 to version 10...');
      data = this.upgradeV9toV10(data);
    }
    return data;
  }

  // Simple deep merge: objects are merged recursively; arrays and primitives are replaced by source
  _deepMerge(target, source) {
    if (typeof source !== 'object' || source === null) return target;
    const out = Array.isArray(target) ? [...target] : { ...target };
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        out[key] = this._deepMerge(out[key] && typeof out[key] === 'object' ? out[key] : {}, value);
      } else {
        out[key] = value;
      }
    }
    return out;
  }

  // 升级配置文件
  upgradeFile() {
    try {
      if(dirExists(CONFIG_DIR) === false){
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }      
      if(fileExists(this._filePath) === false){
        fs.writeFileSync(this._filePath, JSON.stringify(this._defaultConfig, null, 2), UTF8);
        logger.info(`write default config to ${this._filePath}`);
        return;
      }

      const localData = JSON.parse(fs.readFileSync(this._filePath, UTF8));
      if (!localData.version) {
        // Merge user-provided partial config (e.g., created by init.sh) over defaults
        const merged = this._deepMerge(this._defaultConfig, localData);
        merged.version = this._defaultConfig.version;
        fs.writeFileSync(this._filePath, JSON.stringify(merged, null, 2), UTF8);
        logger.warn('No config version found; merged partial config over defaults and set latest version');
        return;
      }
      if (localData.version === this._defaultConfig.version) {
        logger.info('User config app.json version is up to date');
        return;
      }
      const upgradedData = this.upgradeData(localData);
      fs.writeFileSync(this._filePath, JSON.stringify(upgradedData, null, 2), UTF8);
      logger.info(`User config app.json upgraded to version ${upgradedData.version}`);

    } catch (error) {
      logger.error(`${error}`);
    }
  }

  getDefaultConfig() {
    return this._defaultConfig;
  }

  setDefaultConfig(retainCredentials) {
    if (retainCredentials ) {
      const localData = JSON.parse(fs.readFileSync(this._filePath, UTF8));
      const defaultConfig = JSON.parse(JSON.stringify(this._defaultConfig));
      defaultConfig.server.sshUser = localData.server.sshUser;
      defaultConfig.server.sshPassword = localData.server.sshPassword;
      defaultConfig.prometheus.username = localData.prometheus.username;
      defaultConfig.prometheus.password = localData.prometheus.password;
      fs.writeFileSync(this._filePath, JSON.stringify(defaultConfig, null, 2), UTF8);
    }else{
      fs.writeFileSync(this._filePath, JSON.stringify(this._defaultConfig, null, 2), UTF8);
    }
  }
}

export default AppConfigUpdate;
