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
import path from 'path';
import { createApiObj, ApiCode } from '../../common/api.js';
import { setSerialConfig } from '../serialServer.js';


function getSerialPorts() {
    const prefixes = ['/dev/ttyUSB', '/dev/ttyAMA', '/dev/ttyACM'];
    const results = [];
  
    for (const prefix of prefixes) {
      try {
        const dir = path.dirname(prefix);
        const base = path.basename(prefix);
        const files = fs.readdirSync(dir)
          .filter(file => file.startsWith(base))
          .map(file => path.join(dir, file));
        results.push(...files);
      } catch (err) {
        // 忽略不存在的目录
      }
    }
    return results;
}

function apiGetSerailDevice(req, res, next) {
    try {
        const returnObject = createApiObj();
        const serialPorts = getSerialPorts();
        returnObject.data = serialPorts;
        res.json(returnObject);
    } catch (error) {
        const errorObj = createApiObj();
        errorObj.code = ApiCode.INTERNAL_SERVER_ERROR;
        errorObj.msg = 'Error retrieving serial devices';
        res.status(500).json(errorObj);
    }
}

function apiSetSerailDevice(req, res, next) {
    try {
        const returnObject = createApiObj();
        const { path, baudrate } = req.body;
        if (!path || !baudrate) {
            returnObject.code = ApiCode.INVALID_INPUT_PARAM;
            returnObject.msg = 'Missing "path" or "baudrate" parameter';
            return res.status(400).json(returnObject);
        }
        // 这里可以添加设置串口的逻辑
        setSerialConfig(path, baudrate);
        returnObject.code = ApiCode.OK;
        returnObject.msg = 'Serial device set successfully';
        res.json(returnObject);
    } catch (error) {
        const errorObj = createApiObj();
        errorObj.code = ApiCode.INTERNAL_SERVER_ERROR;
        errorObj.msg = 'Error setting serial device';
        res.status(500).json(errorObj);
    }
}

export { apiGetSerailDevice, apiSetSerailDevice};
