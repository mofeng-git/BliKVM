
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
import ModuleApp from '../module_app.js';
import { getRequest } from "../../common/http.js"
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import { getHardwareType } from '../../common/tool.js';
import { HardwareType } from '../../common/enums.js';
import http from 'http';

class Video extends ModuleApp {
  static _instance = null;
  _v4_support_resolution = ['1920x1080', '1600x1200', '1360x768', '1280x1024', '1280x960', '1280x720', '800x600', '720x480', '640x480'];
  constructor() {
    if (!Video._instance) {
      super();
      Video._instance = this;
      this._init();
    }

    return Video._instance;
  }

  _init() {
    const { video } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._bin = video.shell;
    this._param = [video.bin, video.port, video.fps, video.quality, video.kbps, video.gop, video.resolution];
    this._name = 'video';
  }

  setResolution(resolution) {
    const configPath = CONFIG_PATH;
    const config = JSON.parse(fs.readFileSync(configPath, UTF8));
    config.video.resolution = resolution;
    this._param = [config.video.bin, config.video.port, config.video.fps, config.video.quality, config.video.kbps, config.video.gop, config.video.resolution];
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), UTF8);
  }

  getVideoConfig() {
    const { video } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const videoConfig = {
      port: video.port,
      fps: video.fps,
      quality: video.quality,
      kbps: video.kbps,
      gop: video.gop,
      resolution: video.resolution
    };
    if (getHardwareType() === HardwareType.MangoPi) {
      videoConfig.support_resolution = this._v4_support_resolution;
    }
    return videoConfig;
  }

  getVideoState() {
    return new Promise((resolve, reject) => {
      getRequest(`http://127.0.0.1:${this._param[1]}/state`)
        .then(response => {
          try {
            const jsonData = JSON.parse(response);
            resolve(jsonData);
          } catch (error) {
            reject(`error: ${error.message}`);
          }
        })
        .catch(error => {
          reject(`error: ${error}`); 
        });
    });
  }
  
  setVideoConfig(videoConfig) {
    const configPath = CONFIG_PATH;
    const config = JSON.parse(fs.readFileSync(configPath, UTF8));
    config.video.fps = videoConfig.fps;
    config.video.quality = videoConfig.quality;
    config.video.kbps = videoConfig.kbps;
    config.video.gop = videoConfig.gop;
    this._param = [config.video.bin, config.video.port, config.video.fps, config.video.quality, config.video.kbps, config.video.gop,  config.video.resolution];
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), UTF8);

  }

  getSnapshotUrl(){
    return `http://127.0.0.1:${this._param[1]}/snapshot`;
  }

  async getSnapshotImage() {
    const url = `http://127.0.0.1:${this._param[1]}/snapshot`;
  
    return new Promise((resolve, reject) => {
      http.get(url, (response) => {
        const chunks = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
      }).on('error', (error) => {
        console.error('Error fetching snapshot:', error);
        reject(error);
      });
    });
  }
}

export default Video;
