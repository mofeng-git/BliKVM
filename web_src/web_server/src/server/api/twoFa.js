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

import TwoFactorAuth from '../../modules/two_factor_auth.js';
import { ApiCode, createApiObj } from '../../common/api.js';
import Logger from '../../log/logger.js';

const logger = new Logger();

async function apiTwoFa(req, res, next) {
    try {
        const returnObject = createApiObj();
        const action = req.query.action;
        const twoFa = new TwoFactorAuth();

        const { username, code } = req.body;

        const result = await twoFa.verifyToken(username, code);
        if (result) {
            if (action === 'enable') {
                if (twoFa.enable(username)) {
                    returnObject.msg = `2fa enable success`;
                    res.json(returnObject);
                } else {
                    returnObject.msg = `2fa enable failed`;
                    res.json(returnObject);
                }
            } else {
                if (twoFa.disable(username)) {
                    returnObject.msg = `2fa disable success`;
                    res.json(returnObject);
                } else {
                    returnObject.msg = `2fa disable failed`;
                    res.json(returnObject);
                }
            }
        } else {
            returnObject.msg = 'two factor auth verify failed';
            returnObject.code = ApiCode.INVALID_CREDENTIALS;
            res.json(returnObject);
        }
    } catch (error) {
        next(error);
    }
}

async function apiTwoFaVerify(req, res, next) {
    try {
        const returnObject = createApiObj();
        const twoFa = new TwoFactorAuth();
        const { username, code } = req.body;
        const result = await twoFa.verifyToken(username, code);
        if (result) {
            returnObject.msg = 'two factor auth verify success';
            res.json(returnObject);
        } else {
            returnObject.msg = 'two factor auth verify failed';
            returnObject.code = ApiCode.INVALID_CREDENTIALS;
            res.json(returnObject);
        }
    } catch (error) {
        next(error);
    }
}

async function apiGetTwoFaInfo(req, res, next) {
    try {
        const returnObject = createApiObj();
        const twoFa = new TwoFactorAuth();
        const { username } = req.body;
        logger.info(`get two factor auth info for ${username}`);
        const result = await twoFa.getTwoFaQrAndSecret(username);
        returnObject.msg = 'get two factor auth info success';
        returnObject.data = result;
        res.json(returnObject);
    } catch (error) {
        next(error);
    }
}




export { apiTwoFa, apiTwoFaVerify, apiGetTwoFaInfo };