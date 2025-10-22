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
import fs from 'fs';
import WakeOnLan from '../../modules/wol.js';
import { UTF8, WOL_PATH } from '../../common/constants.js';


function apiWakeOnLan(req, res, next) {
  try {
    const ret = createApiObj();
    const macAddress = req.query.mac;
    const wol = new WakeOnLan(macAddress);

    wol.sendMagicPacket()
    .then(() => {
        ret.msg = 'Magic packet sent';
        res.json(ret);
    })
    .catch((err) => {
        ret.msg = err.message;
        ret.code = ApiCode.INTERNAL_SERVER_ERROR;
        res.json(ret);
        next(err);
    });
  } catch (err) {
    next(err);
  }
}

function apiSendWakeOnLanList(req, res, next) {
  try {
    const ret = createApiObj();
    const macAddresses = req.body.macs; // 获取MAC地址数组
    const promises = macAddresses.map(macAddress => {
      const wol = new WakeOnLan(macAddress);
      return wol.sendMagicPacket();
    });

    Promise.all(promises)
      .then(() => {
        ret.msg = 'Magic packets sent';
        res.json(ret);
      })
      .catch((err) => {
        ret.msg = err.message;
        ret.code = ApiCode.INTERNAL_SERVER_ERROR;
        res.json(ret);
        next(err);
      });
  } catch (err) {
    next(err);
  }
}

function apiGetWakeOnLanList(req, res, next) {
  try {
    const ret = createApiObj();
    const wolObj = JSON.parse(fs.readFileSync(WOL_PATH, UTF8));
    ret.data = wolObj.items;
    ret.msg = 'Get WOL list success';
    res.json(ret);
  } catch (err) {
    next(err);
  }
}

function apiAddWakeOnLan(req, res, next) {
  try {
    const ret = createApiObj();
    const { name, mac } = req.body;
    if (!name || typeof name !== 'string') {
      ret.msg = 'Invalid name: must be a non-empty string';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      return res.status(400).json(ret);
    }
    if (!mac || !/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac)) {
      ret.msg = 'Invalid MAC address: must be in format XX:XX:XX:XX:XX:XX';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      return res.status(400).json(ret);
    }

    const wolObj = JSON.parse(fs.readFileSync(WOL_PATH, UTF8));
    wolObj.items.push(req.body);
    fs.writeFileSync(WOL_PATH, JSON.stringify(wolObj, null, 2), UTF8);
    ret.msg = 'Add WOL item success';
    ret.data = req.body;
    res.json(ret);
  } catch (err) {
    next(err);
  }
}

function apiDeleteWakeOnLan(req, res, next) {
  try {
    const ret = createApiObj();
    const wolObj = JSON.parse(fs.readFileSync(WOL_PATH, UTF8));
    const { mac } = req.body;
    const index = wolObj.items.findIndex(item => item.mac === mac);
    if (index === -1) {
      ret.msg = 'MAC address not found';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      return res.status(404).json(ret);
    }
    wolObj.items.splice(index, 1);
    fs.writeFileSync(WOL_PATH, JSON.stringify(wolObj, null, 2), UTF8);
    ret.msg = `Delete WOL ${mac} item success`;
    res.json(ret);

  } catch (err) {
    next(err);
  }
}

export { apiWakeOnLan, apiSendWakeOnLanList, apiGetWakeOnLanList, apiAddWakeOnLan, apiDeleteWakeOnLan };
