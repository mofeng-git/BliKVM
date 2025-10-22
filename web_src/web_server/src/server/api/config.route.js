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
import Logger from '../../log/logger.js';
import AppConfigUpdate from '../../modules/update/app_update.js';

const logger = new Logger();

function apiResetConfig(req, res, next) {
    try {
      const returnObject = createApiObj();
      const {retainCredentials } = req.body;
      const appConfigUpdate = new AppConfigUpdate();
      appConfigUpdate.setDefaultConfig(retainCredentials);
      if(retainCredentials ){
        returnObject.msg = 'Configuration reset to default with current credentials.';
      }else{
        returnObject.msg = 'Configuration reset to default without credentials.';
      }
      returnObject.code = ApiCode.OK;
      res.json(returnObject);
    } catch (error) {
      next(error);
    } 
} 

export { apiResetConfig };