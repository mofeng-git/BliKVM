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

import { createApiObj, ApiCode } from '../../common/api.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';


function apiSetDispaly(req, res, next) {
  try {
    const returnObject = createApiObj();

    const { mode, onBootTime, cycleInterval, displayTime, secondIP } = req.body;
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    config.display.mode = mode;
    config.display.onBootTime = onBootTime;
    config.display.cycleInterval = cycleInterval;
    config.display.displayTime = displayTime;
    config.display.secondIP = secondIP;

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), UTF8);
    returnObject.msg = 'Display config changed';
    returnObject.code = ApiCode.OK;
    returnObject.data =  config.display;
    res.json(returnObject);
  }catch (error) {
    next(error);
  }
}

function apiGetDisplay(req, res, next) {
  try {
    const returnObject = createApiObj();
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    returnObject.msg = 'Display config';
    returnObject.code = ApiCode.OK;
    returnObject.data = config.display;
    res.json(returnObject);
  }catch (error) {
    next(error);
  }
}

export { apiSetDispaly, apiGetDisplay };