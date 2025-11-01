
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
import { createSocket } from 'unix-dgram';
import { createApiObj, ApiCode } from '../../common/api.js';
import fs from 'fs';
import { writeJsonAtomic } from '../../common/atomic-file.js';
import ATX from '../../modules/kvmd/kvmd_atx.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';

/**
 * Handles ATX API request.
 *
 * @param {Object} req - The request object, cmd(power):power on/off, cmd(forcepower):force power on/off, cmd(reboot):reboot.
 * like: curl -X POST -k -u admin:admin http://ip:port/atx/click?button=power
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the API request is handled.
 * @throws {Error} - If there is an error while handling the API request.
 */
function apiATXClick(req, res, next) {
  try {
    const ret = createApiObj();
    const cmd = req.query.button;
    switch (cmd) {
      case 'power':
        writeToSocket(128)
          .then(() => {
            ret.msg = 'Short click on the power button';
            res.json(ret);
          })
          .catch((err) => {
            ret.msg = err.message;
            ret.code = ApiCode.INTERNAL_SERVER_ERROR;
            res.json(ret);
          });
        break;
      case 'forcepower':
        writeToSocket(192)
          .then(() => {
            ret.msg = 'Long press on the power button (5+ seconds)';
            res.json(ret);
          })
          .catch((err) => {
            ret.msg = err.message;
            ret.code = ApiCode.INTERNAL_SERVER_ERROR;
            res.json(ret);
          });
        break;
      case 'reboot':
        writeToSocket(8)
          .then(() => {
            ret.msg = 'Short click on the reset button';
            res.json(ret);
          })
          .catch((err) => {
            ret.msg = err.message;
            ret.code = ApiCode.INTERNAL_SERVER_ERROR;
            res.json(ret);
          });
        break;
      default:
        ret.msg = 'input invalid atx command';
        ret.code = ApiCode.INVALID_INPUT_PARAM;
        res.json(ret);
        break;
    }
  } catch (err) {
    next(err);
  }
}

function apiATXState(req, res, next) {
  const atx = new ATX();
  const ret = createApiObj();
  ret.data.atx = atx.getATXState();
  res.json(ret);
}

async function apiActiveState(req, res, next) {
  try {
    const ret = createApiObj();
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    if (config.atx.isActive === undefined) {
      config.atx.isActive = true; // 默认启用ATX功能
      await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.atx.isActive = true; });
    }
    ret.data.isActive = config.atx.isActive;
    res.json(ret);
  } catch (error) {
    next(error);
  }
}

async function apiActiveSet(req, res, next) {
  try {
    const ret = createApiObj();
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      ret.msg = 'Invalid input, active must be a boolean value';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      return res.status(400).json(ret);
    }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  config.atx.isActive = isActive; // Set the active state based on the request body
  await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.atx.isActive = isActive; });
    ret.data.isActive = config.atx.isActive;
    res.json(ret);
  } catch (error) {
    next(error);
  }
}

/**
 * Writes a command to the socket.
 *
 * @param {number} cmd - The command to write to the socket.
 * @returns {Promise<void>} - A promise that resolves when the command is successfully written to the socket.
 */
function writeToSocket(cmd) {
  return new Promise((resolve, reject) => {
    const message = Buffer.from([cmd]);
    const client = createSocket('unix_dgram');
    client.on('error', (err) => {
      client.close();
      reject(err);
    });
    const { atx } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    client.send(message, 0, message.length, atx.controlSockFilePath, (err) => {
      if (err) {
        client.close();
        reject(err);
      } else {
        client.close();
        resolve();
      }
    });
  });
}

export { apiATXClick, apiATXState, apiActiveState, apiActiveSet};
