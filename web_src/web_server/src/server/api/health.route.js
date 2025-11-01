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
import { writeJsonAtomic } from '../../common/atomic-file.js';
import si from 'systeminformation';

import { createApiObj, ApiCode } from '../../common/api.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';

function apiGetHealthCheck(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { healthCheck } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));

    // Attach realtime snapshot: mem.actual and storage.actual
    Promise.all([si.mem(), si.fsSize()])
      .then(([memData, fsData]) => {
        const memActual = memData.available ?? (memData.free + (memData.buffcache || 0));
        // Prefer mmcblk0* (SD/eMMC). If none, fall back to root mount '/'
        let storageActual = fsData
          .filter((fs) => typeof fs.fs === 'string' && fs.fs.startsWith('/dev/mmcblk0'))
          .reduce((total, p) => total + (p.available || 0), 0);
        if (!storageActual) {
          const root = fsData.find((p) => p.mount === '/');
          storageActual = root?.available || 0;
        }

        returnObject.data = {
          ...healthCheck,
          current: {
            mem: { actual: memActual },
            storage: { actual: storageActual },
          },
        };
        returnObject.code = ApiCode.OK;
        res.json(returnObject);
      })
      .catch(next);
  } catch (error) {
    next(error);
  }
}

async function apiSetHealthCheck( req, res, next){
  try {
    const returnObject = createApiObj();
    const { RAM, storage, latency, temperature } = req.body;
    if( RAM === undefined || storage === undefined || latency === undefined || temperature === undefined){
      returnObject.code = ApiCode.BAD_REQUEST;
      returnObject.message = 'Missing parameters';
      res.json(returnObject);
      return;
    }
    await writeJsonAtomic(CONFIG_PATH, (config) => {
      config.healthCheck.RAM = RAM;
      config.healthCheck.storage = storage;
      config.healthCheck.latency = latency;
      config.healthCheck.temperature = temperature;
    });
    returnObject.msg = "update health check data success";
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  }catch (error) {
    next(error);
  }
}

export { apiGetHealthCheck, apiSetHealthCheck}