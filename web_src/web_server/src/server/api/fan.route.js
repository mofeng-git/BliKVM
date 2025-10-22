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
import { CONFIG_PATH } from '../../common/constants.js';

function apiSetTempThreshold(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { tempThreshold } = req.body;
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    config.fan.tempThreshold = tempThreshold;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    returnObject.msg = `Fan temperature threshold changed to ${tempThreshold}°C`;
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  }catch (error) {
    next(error);
  }
}

export { apiSetTempThreshold}