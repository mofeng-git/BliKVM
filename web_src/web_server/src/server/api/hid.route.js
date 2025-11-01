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
import { ApiCode, createApiObj } from '../../common/api.js';
import HID from '../../modules/kvmd/kvmd_hid.js';
import Keyboard from '../keyboard.js';
import Mouse from '../mouse.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import { getSupportLang } from '../../modules/hid/keysym.js';
import {InputEventListener, 
  startHIDPassthroughListening, stopHIDPassthroughListening
} from '../kvmd_event_listenner.js';

import Logger from '../../log/logger.js';

const logger = new Logger();

// Normalize VID/PID input: accept number or string (with/without 0x), 1-4 hex digits, return '0x' + 4-digit lower hex
function normalizeHexId(value, fieldName) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  // If numeric-like
  if (/^\d+$/.test(s)) {
    const num = Number(s);
    if (!Number.isInteger(num) || num < 0 || num > 0xFFFF) {
      throw new Error(`${fieldName} out of range`);
    }
    return `0x${num.toString(16).padStart(4, '0')}`;
  }
  // 0x-prefixed or plain hex up to 4 digits
  const m = s.match(/^(?:0x)?([0-9a-fA-F]{1,4})$/);
  if (!m) throw new Error(`${fieldName} must be 1-4 hex digits (optional 0x)`);
  const hex = m[1];
  return `0x${hex.toLowerCase().padStart(4, '0')}`;
}

function normalizeNonEmptyString(value, fieldName, maxLen = 64) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) throw new Error(`${fieldName} cannot be empty`);
  if (s.length > maxLen) throw new Error(`${fieldName} too long (>${maxLen})`);
  return s;
}

async function apiHIDUpdateIdentity(req, res, next) {
  try {
    const ret = createApiObj();
    const { idVendor, idProduct, manufacturer, product } = req.body || {};

    if (
      idVendor === undefined &&
      idProduct === undefined &&
      manufacturer === undefined &&
      product === undefined
    ) {
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = 'no fields to update';
      return res.json(ret);
    }

    let newVid = null, newPid = null, newManu = null, newProd = null;
    try {
      if (idVendor !== undefined) newVid = normalizeHexId(idVendor, 'idVendor');
      if (idProduct !== undefined) newPid = normalizeHexId(idProduct, 'idProduct');
      if (manufacturer !== undefined) newManu = normalizeNonEmptyString(manufacturer, 'manufacturer');
      if (product !== undefined) newProd = normalizeNonEmptyString(product, 'product');
    } catch (e) {
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = e.message;
      return res.json(ret);
    }

    await writeJsonAtomic(CONFIG_PATH, (cfg) => {
      cfg.hid = cfg.hid || {};
      cfg.hid.identity = cfg.hid.identity || {};
      if (newVid !== null) cfg.hid.identity.idVendor = newVid;
      if (newPid !== null) cfg.hid.identity.idProduct = newPid;
      if (newManu !== null) cfg.hid.identity.manufacturer = newManu;
      if (newProd !== null) cfg.hid.identity.product = newProd;
    });

    const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    ret.code = ApiCode.OK;
    ret.msg = 'hid identity updated';
    ret.data = hid.identity;
    res.json(ret);
  } catch (err) {
    next(err);
  }
}

function apiHIDGetIdentity(req, res, next) {
  try {
    const ret = createApiObj();
    const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    ret.code = ApiCode.OK;
    ret.msg = '';
    ret.data = hid.identity || {};
    res.json(ret);
  } catch (err) {
    next(err);
  }
}

function apiEnableHID(req, res, next) {
  try {
    const returnObject = createApiObj();
    const action = req.query.action;
    const hid = new HID();
    const mouse = new Mouse();
    const keyboard = new Keyboard();
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    let msdEnable;
    if (action === 'enable') {
      hid
        .startService()
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
    const mouseMode = req.body.mouseMode;
    const hid = new HID();
    const mouse = new Mouse();
    const keyboard = new Keyboard();
    mouse.close();
    keyboard.close();
    hid
      .changeMode(mouseMode)
      .then(() => {
        returnObject.code = ApiCode.OK;
        returnObject.msg = `hid change mode to mouseMode:${mouseMode} successful`;
        mouse._init();
        mouse.open();
        keyboard.open();  
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
    const delay = req.body.delay;
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
    keyboard.pasteData(text, lang, delay);
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
      wheelReverse: hid.pass_through.wheelReverse,
    };
    res.json(returnObject);
  }catch(err){
    next(err);
  }
}


async function apiHIDLoopActive(req, res, next) {
  try{
    const { isActive } = req.body; 
    const returnObject = createApiObj();
    returnObject.code = ApiCode.OK;
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    if( config.hid.pass_through.enabled === isActive ){
      returnObject.msg = `HID loop is already ${isActive ? 'enabled' : 'disabled'}`;
      returnObject.data = {
        enabled: config.hid.pass_through.enabled,
      };
      res.json(returnObject);
      return;
    }
    if(isActive === true) { 
      startHIDPassthroughListening();
        await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.hid.pass_through.enabled = true; });
    }else{
      stopHIDPassthroughListening();
        await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.hid.pass_through.enabled = false; });
    }
    returnObject.msg = ' HID loop active status changed successfully';
    returnObject.data = {
      enabled: JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8)).hid.pass_through.enabled
    };
    res.json(returnObject);
  }catch(err){
    next(err);
  }
}

async function apiHIDLoopUpdate(req, res, next) {
  try{
    const { wheelReverse } = req.body; 
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    if( config.hid.pass_through.wheelReverse === wheelReverse ){
      const returnObject = createApiObj();
      returnObject.code = ApiCode.OK;
      returnObject.msg = `HID loop wheel reverse is already ${wheelReverse ? 'enabled' : 'disabled'}`;
      returnObject.data = {
        wheelReverse: config.hid.pass_through.wheelReverse
      };
      res.json(returnObject);
      return;
    }
    InputEventListener.setWheelReverse(wheelReverse );
    await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.hid.pass_through.wheelReverse = wheelReverse; });
    const returnObject = createApiObj();
    returnObject.code = ApiCode.OK;
    returnObject.msg = '';
    returnObject.data = {
      wheelReverse: JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8)).hid.pass_through.wheelReverse
    };
    res.json(returnObject);
  }catch(err){
    next(err);
  }
}



export { apiEnableHID, apiChangeMode, apiGetStatus, apiKeyboardPaste, apiKeyboardShortcuts, apiHIDLoopStatus,apiHIDLoopBlock,apiKeyboardPasteLanguage,
  apiHIDLoopActive, apiHIDLoopUpdate, apiHIDUpdateIdentity, apiHIDGetIdentity
 };
