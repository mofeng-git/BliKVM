
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
import { ApiCode, createApiObj } from '../../common/api.js';
import KVMSwitchFactory from '../../modules/kvmd/switch/kvmd_switch.js';
import { SWITCH_PATH, UTF8 } from '../../common/constants.js';
import { SwitchModulesID } from '../../common/enums.js';
import { NotificationType, Notification } from '../../modules/notification.js';
import fs from 'fs';

function apiGetSwitch(req, res, next) {
  try {
    const returnObject = createApiObj();
    const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
    returnObject.data = switchObj.kvmSwitch;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiSwitchActive(req, res, next) {
  try {
    const returnObject = createApiObj();
    const activeValue = req.body.isActive;
    if (activeValue === undefined) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'isActive is required';
      res.json(returnObject);
      return;
    }
    const switchId = parseInt(req.params.id, 10);
    const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
    if (switchId !==  switchObj.kvmSwitch.activeSwitchId && switchObj.kvmSwitch.isActive === true) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      let msg = `you need to operate switch ${switchObj.kvmSwitch.activeSwitchId} before open new switch`
      returnObject.msg = msg;
      const notification = new Notification();
      notification.addMessage(NotificationType.ERROR, msg);
      res.json(returnObject);
      return;
    }
    const kvmdSwitch = KVMSwitchFactory.getSwitchHandle(switchId);
    if (kvmdSwitch === null) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = `input error switchId: ${switchId}`;
      res.json(returnObject);
      return;
    }
    if (activeValue === false) {
      if (switchObj.kvmSwitch.isActive === false) {
        returnObject.code = ApiCode.INVALID_INPUT_PARAM;
        returnObject.msg = 'switch already inactive';
        res.json(returnObject);
        return;
      }
      kvmdSwitch
        .disableSwitch()
        .then((result) => {
          if (result.result === true) {
            returnObject.code = ApiCode.OK;
            returnObject.msg = "switch inactive";
            switchObj.kvmSwitch.isActive = false;
            switchObj.kvmSwitch.activeSwitchId = -1;
            res.json(returnObject);
            fs.writeFileSync(SWITCH_PATH, JSON.stringify(switchObj, null, 2), UTF8);
          }else{
            returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
            returnObject.msg = result.msg;
            res.json(returnObject);
          }

        })
        .catch((error) => {
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          returnObject.msg = error.message;
          res.json(returnObject);
          return;
        });
    } else if (activeValue === true) {
      if (switchObj.kvmSwitch.isActive === true) {
        returnObject.code = ApiCode.INVALID_INPUT_PARAM;
        returnObject.msg = 'switch already active';
        res.json(returnObject);
        return;
      }
      kvmdSwitch
        .enableSwitch()
        .then((result) => {
          console.log(result);
          if (result.result === true) {
            returnObject.code = ApiCode.OK;
            returnObject.msg = "switch enabled success";
            switchObj.kvmSwitch.isActive = true;
            switchObj.kvmSwitch.activeSwitchId = switchId;
            res.json(returnObject);
            fs.writeFileSync(SWITCH_PATH, JSON.stringify(switchObj, null, 2), UTF8);
          }else{
            returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
            returnObject.msg = result.msg;
            res.json(returnObject);
          }

        })
        .catch((error) => {
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          returnObject.msg = error.message;
          res.json(returnObject);
          return;
        });
    }
  } catch (err) {
    next(err);
  }
}

function apiSwitchChannel(req, res, next) {
  try {
    const returnObject = createApiObj();
    const switchId = parseInt(req.params.id, 10);
    const kvmdSwitch = KVMSwitchFactory.getSwitchHandle(switchId);

    if (kvmdSwitch === null) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = `input error switchId: ${switchId}`;
      res.json(returnObject);
      return;
    }
    const channel = req.body.channel;
    const result = kvmdSwitch.switchChannel(channel);
    if (result.result === true) {
      returnObject.code = ApiCode.OK;
      returnObject.msg = result.msg;
    } else {
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      returnObject.msg = result.msg;
    }

    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiSwitchUpdate(req, res, next) {
  try {
    const returnObject = createApiObj();
    const switchId = parseInt(req.params.id, 10);
    const switchObj = JSON.parse(fs.readFileSync(SWITCH_PATH, UTF8));
    const itemIndex = switchObj.kvmSwitch.items.findIndex(item => item.id === switchId);
    if (itemIndex !== -1) {
      switchObj.kvmSwitch.items[itemIndex] = req.body;
      fs.writeFileSync(SWITCH_PATH, JSON.stringify(switchObj, null, 2), UTF8);
      returnObject.success = true;
      returnObject.message = 'Switch updated successfully';
    } else {
      returnObject.success = false;
      returnObject.message = 'Switch ID not found';
    }
    returnObject.data = switchObj;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

export {
  apiGetSwitch,
  apiSwitchActive,
  apiSwitchUpdate,
  apiSwitchChannel
};
