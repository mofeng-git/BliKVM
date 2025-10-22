
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
import { CONFIG_PATH } from '../../common/constants.js';

class KVMDMain extends ModuleApp {
  static _instance = null;

  constructor() {
    if (!KVMDMain._instance) {
      super();
      KVMDMain._instance = this;
      this._init();
    }

    return KVMDMain._instance;
  }

  _init() {
    const { kvmd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    this._bin = kvmd.bin;
    this._name = 'kvmd-main';
  }
}

export default KVMDMain;
