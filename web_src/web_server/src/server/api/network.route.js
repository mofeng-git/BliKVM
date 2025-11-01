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

import { createApiObj, ApiCode } from '../../common/api.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';


async function apiChangeWebServerPort(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { https_port, http_port } = req.body;
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));

    config.server.https_port = https_port;
    config.server.http_port = http_port;

    await writeJsonAtomic(CONFIG_PATH, (cfg) => {
      cfg.server.https_port = https_port;
      cfg.server.http_port = http_port;
    });
    returnObject.data = {
      https_port: config.server.https_port,
      http_port: config.server.http_port
    };
    returnObject.msg = 'Web server port changed, restart the server to apply changes';
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
    setTimeout(() => {
      process.exit(0);
    }, 3000);
  } catch (error) {
    next(error);
  }
}

async function apiSetWebServerProtocol(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { protocol } = req.body;
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));

  await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.server.protocol = protocol; });
    returnObject.data = {
      protocol: config.server.protocol
    };
    returnObject.msg = 'Web server protocol changed, restart the server to apply changes';
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
    setTimeout(() => {
      process.exit(0);
    }, 3000);
  } catch (error) {
    next(error);
  }
}

function apiGetWebServerInfo(req, res, next) {
  try {
    const returnObject = createApiObj();
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    if( config.server.https_port > 0 && config.server.http_port > 0) {
      returnObject.data = {
        protocol: config.server.protocol,
        https_port: config.server.https_port,
        http_port: config.server.http_port
      };
      returnObject.code = ApiCode.OK;
    }else{
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      returnObject.msg = 'Server configuration is missing required ports';
    }

    res.json(returnObject);
  } catch (error) {
    next(error);
  }
}

export { apiChangeWebServerPort, apiGetWebServerInfo, apiSetWebServerProtocol};