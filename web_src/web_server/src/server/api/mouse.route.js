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
import Mouse from '../mouse.js';

const logger = new Logger();

async function apiMouseJiggler(req, res, next) {
  try {
    const returnObject = createApiObj();
    const action = req.query.action;
    const mouse = new Mouse();
    if(action === 'true') {
        mouse.startJiggler();
    }else if(action === 'false') {
        mouse.stopJiggler();
    }else{
        returnObject.code = ApiCode.INVALID_INPUT_PARAM;
        returnObject.msg = `mouse jiggler action:${action} error`;
        res.json(returnObject);
        return;
    }
    returnObject.msg = `mouse jiggler ${action} success`;
    res.json(returnObject);
  } catch (error) {
    next(error);
  } 
}

function apiChangeJigglerTime(req, res, next) {
  try {
    const returnObject = createApiObj();
    const {interval} = req.body;
    const mouse = new Mouse();
    mouse.updateJigglerInterval(interval);
    returnObject.msg = `mouse jiggler time changed to ${interval} success`;
    res.json(returnObject);
  } catch (error) {
    next(error);
  } 
}

function apiV2MouseJiggler(req, res, next) {
  try {
    const returnObject = createApiObj();
    const {interval} = req.body;
    const mouse = new Mouse();
    if(interval === 0) {
        mouse.stopJiggler();
        mouse.updateJigglerInterval(interval);
    }else if(interval > 0) {
        mouse.updateJigglerInterval(interval);
        if(!mouse.getJigglerStatus()) {
            mouse.startJiggler();
        }
    }
    returnObject.msg = `mouse jiggler time changed to ${interval} success`;
    res.json(returnObject);
  } catch (error) {
    next(error);
  } 
}

function apiMouseEvent(req, res, next) {
  try {
    const returnObject = createApiObj();
    const data = req.body;
    const mouse = new Mouse();
    mouse.handleEvent(data);
    returnObject.msg = 'mouse event success';
    res.json(returnObject);
  } catch (error) {
    next(error);
  } 
} 


export { apiMouseJiggler,apiChangeJigglerTime,  apiV2MouseJiggler, apiMouseEvent};