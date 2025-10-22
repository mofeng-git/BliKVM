
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
import Module from './module.js';
import Logger from '../log/logger.js';
import { SerialPort } from 'serialport';

const logger = new Logger();

class Serial extends Module {
  _process = null;
  _path = null;
  _baudRate = null;

  constructor(path, baudRate) {
    super();
    this._path = path;
    this._baudRate = baudRate;
  }

  startService() {
    logger.info(`Start ${this._name} service, path: ${this._path}, baudRate: ${this._baudRate}`);
    this._process = new SerialPort({
      path: this._path,
      baudRate: this._baudRate
    });
  }

  closeService() {
    if (this._process) {
      this._process.close();
    }
  }

  write(str) {
    if (this._process) {
      this._process.write(str);
    }
  }
}

export default Serial;
