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
import { ApiCode, createApiObj } from '../../common/api.js';
import HID from '../../modules/kvmd/kvmd_hid.js';
import Keyboard from '../keyboard.js';
import Mouse from '../mouse.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import { getSupportLang } from '../../modules/hid/keysym.js';
import {InputEventListener} from '../kvmd_event_listenner.js';
import Logger from '../../log/logger.js';

const logger = new Logger();

function apiEnableHID(req, res, next) {
  try {
    const returnObject = createApiObj();
    const action = req.query.action;
    const hid = new HID();
    const mouse = new Mouse();
    const keyboard = new Keyboard();
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    let msdEnable;
    if(config.msd.enable === true){
      msdEnable = 'enable';
    }else{
      msdEnable = 'disable';
    }
    if (action === 'enable') {
      hid
        .startService(config.hid.mouseMode,msdEnable)
        .then(() => {
          mouse.open();
          keyboard.open();

          returnObject.msg = 'hid enable success';
          res.json(returnObject);
        })
        .catch((err) => {
          returnObject.msg = err.message;
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
        });
    } else if (action === 'disable') {

      mouse.close();
      keyboard.close();

      hid
        .closeService()
        .then(() => {
          returnObject.msg = 'hid disable success';
          res.json(returnObject);
        })
        .catch((err) => {
          returnObject.msg = err.message;
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
        });
    } else {
      returnObject.msg = `input invalid hid command: ${action}`;
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(returnObject);
    }
  } catch (err) {
    next(err);
  }
}

function apiChangeMode(req, res, next) {
  try {
    const returnObject = createApiObj();
    const absolute = req.query.absolute;
    const hid = new HID();
    hid
      .changeMode(absolute)
      .then(() => {
        returnObject.code = ApiCode.OK;
        returnObject.msg = `hid change mode to absolute:${absolute} successful`;
        res.json(returnObject);
      })
      .catch((err) => {
        returnObject.msg = err.message;
        returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
        res.json(returnObject);
      });
  } catch (err) {
    next(err);
  }
}

function apiGetStatus(req, res, next) {
  try {
    const returnObject = createApiObj();
    const hid = new HID();
    returnObject.data = hid.getStatus();
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'hid get status ok';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiKeyboardPaste(req, res, next) {
  try {
    const returnObject = createApiObj();
    const text = req.body.text;
    const lang = req.body.lang;
    if (typeof text !== 'string') {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'input data is not string';
      logger.error(`input data is not string: ${text}`);
      res.json(returnObject);
      return;
    }
    if (typeof lang !== 'string') {
      lang = 'en';
    }
    const keyboard = new Keyboard();
    keyboard.pasteData(text, lang);
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'paste data ok';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiKeyboardPasteLanguage(req, res, next) {
  try{
    const returnObject = createApiObj();
    const language = getSupportLang();
    if (language === null) {
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      returnObject.msg = 'error reading keymap';
      res.json(returnObject);
      return;
    }
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'paste data ok';
    returnObject.data = language;
    res.json(returnObject);
  } catch
  (err) {
    next(err);
  }
}



function apiKeyboardShortcuts(req, res, next) {
  try {
    const returnObject = createApiObj();
    const keycode = req.body.shortcuts;
    const keyboard = new Keyboard();
    keyboard.shortcuts(keycode);
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'shortcuts ok';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiGetShortcutsConfig(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'shortcuts ok';
    returnObject.data = hid.shortcuts;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

function apiHIDLoopBlock(req, res, next) {
  try{
    const { blockFlag } = req.body; 
    InputEventListener.setBlockFlag(blockFlag);
    const flag = InputEventListener.getBlockFlag();
    const returnObject = createApiObj();
    returnObject.code = ApiCode.OK;
    returnObject.msg = '';
    returnObject.data = {
      blockFlag: flag
    };
    res.json(returnObject);
  }catch(err){
    next(err);
  }
}

function apiHIDLoopStatus(req, res, next) {
  try{
    const flag = InputEventListener.getBlockFlag();
    const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const returnObject = createApiObj();
    returnObject.code = ApiCode.OK;
    returnObject.msg = '';
    returnObject.data = {
      enabled: hid.pass_through.enabled,
      blockFlag: flag
    };
    res.json(returnObject);
  }catch(err){
    next(err);
  }
}


export { apiEnableHID, apiChangeMode, apiGetStatus, apiKeyboardPaste, apiKeyboardShortcuts, apiGetShortcutsConfig, apiHIDLoopStatus,apiHIDLoopBlock,apiKeyboardPasteLanguage };
