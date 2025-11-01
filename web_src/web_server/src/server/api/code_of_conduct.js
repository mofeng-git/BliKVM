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
import { createApiObj, ApiCode } from '../../common/api.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import { writeJsonAtomic } from '../../common/atomic-file.js';
import fs from 'fs';

function apiGetConducState(req, res, next) {
  try {
    const returnObject = createApiObj();
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));

    if (config === undefined || config === null) {
      returnObject.msg = 'app.json does not exist';
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      return res.status(500).json(returnObject);
    }
    returnObject.data = config.codeOfConduct;
    returnObject.msg = 'Conduct data retrieved successfully';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

async function apiActiveConduct(req, res, next) {
  try {
    const { isActive } = req.body;
    const returnObject = createApiObj();
    if (isActive === undefined || isActive === null) {
      returnObject.msg = 'Invalid input parameters';
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      return res.status(400).json(returnObject);
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    if (!config) {
      returnObject.msg = 'app.json does not exist';
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      return res.status(500).json(returnObject);
    }
  config.codeOfConduct.isActive = isActive; // 更新 codeOfConduct 的 isActive 状态

  returnObject.data = config.codeOfConduct;
  returnObject.msg = 'Conduct status updated successfully';
  await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.codeOfConduct.isActive = isActive; });
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

async function apiUpdateUrlConduct(req, res, next) {
  try {
    const { url } = req.body;
    const returnObject = createApiObj();
    if (url === undefined || url === null) {
      returnObject.msg = 'Invalid input parameters';
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      return res.status(400).json(returnObject);
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    if (!config) {
      returnObject.msg = 'app.json does not exist';
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      return res.status(500).json(returnObject);
    }
  config.codeOfConduct.url = url;

  returnObject.data = config.codeOfConduct;
  returnObject.msg = 'Conduct url updated successfully';
  await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.codeOfConduct.url = url; });
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}


export { apiGetConducState, apiActiveConduct, apiUpdateUrlConduct };

