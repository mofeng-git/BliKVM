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
import { readJson, writeJsonAtomic } from '../../common/atomic-file.js';
import { CONFIG_PATH } from '../../common/constants.js';
import Mouse from '../mouse.js';
import Keyboard from '../keyboard.js';
import HID from '../../modules/kvmd/kvmd_hid.js';
import Logger from '../../log/logger.js';

const logger = new Logger();

async function apiMicState(req, res, next) {
    try {
        const returnObject = createApiObj();
        const config = await readJson(CONFIG_PATH);
        returnObject.data = { mic: config.mic?.isRegistered ?? false };
        res.json(returnObject);
    } catch (err) {
        logger.error(`mic.route: apiMicState error: ${err?.message || err}`);
        next(err);
    }
}

async function apiMicSet(req, res, next) {
    try {
        const returnObject = createApiObj();
        const { enable } = req.body;
        if (typeof enable !== 'boolean') {
            returnObject.code = ApiCode.INVALID_PARAMS;
            returnObject.message = 'Invalid parameter: enable must be boolean';
            res.status(400).json(returnObject);
            return;
        }

        await writeJsonAtomic(CONFIG_PATH, (cfg) => {
            if (!cfg.mic) cfg.mic = {};
            cfg.mic.isRegistered = enable;
        });

        const keyboard = new Keyboard();
        keyboard.close();
        const mouse = new Mouse();
        mouse.close();

        const hidHandle = new HID();
        await hidHandle.closeService();
        await hidHandle.startService();        

        keyboard.open();
        mouse.open();



        logger.info(`mic.route: Microphone has been ${enable ? 'enabled' : 'disabled'}`);
        returnObject.data = { mic: enable };
        res.json(returnObject);
    } catch (err) {
        logger.error(`mic.route: apiMicSet error: ${err?.message || err}`);
        next(err);
    }
}

export { apiMicState, apiMicSet };