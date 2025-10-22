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
import Logger from '../log/logger.js';
import { isDeviceFile } from '../common/tool.js';
import { CONFIG_PATH, UTF8 } from '../common/constants.js';
import  HIDDevice  from './hid_devices.js';


const logger = new Logger();

class MouseBase extends HIDDevice {

  constructor(devicePath) {
      super();
      this._devicePath = devicePath;
      this.open();
      this.startWriteToHid();
  }

  write(data){
    if (isDeviceFile(this._devicePath) && !this.isClosing) {
      //logger.info(`Writing mouse data:${data} to ${this._devicePath}`);
      this.writeToQueue(data);
    }
  }
}

export default MouseBase;
