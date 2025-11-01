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
import fs from 'fs';
import { writeJsonAtomic } from '../../common/atomic-file.js';
import fsPromises from 'fs/promises';
import bcrypt from 'bcrypt';
import { CONFIG_PATH, JWT_SECRET, UTF8 , SERVER_VERSION, PRODUCT_VERSION} from '../../common/constants.js';
import Logger from '../../log/logger.js';
import jwt from 'jsonwebtoken';
import TwoFactorAuth from '../../modules/two_factor_auth.js';
import { HardwareType } from '../../common/enums.js';
import {  getHardwareType } from '../../common/tool.js';


const logger = new Logger();

const hashEncrypt = async (value) => {
  const saltRounds = 10;
  return await bcrypt.hash(value, saltRounds);
};

const verifiedHash = async (value, hashedValue) => {
  return await bcrypt.compare(value, hashedValue);
};

function getUsers() {
  const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  const { Accounts } =  JSON.parse(fs.readFileSync(userManager.userFile, UTF8));
  return Accounts;
}

function getUserByName(name) {
  const users = getUsers();
  return users.find(u => u.username === name);
}

async function apiCreateAccount(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { role, username, password } = req.body;
    if(role !== 'admin') {
      returnObject.msg = 'Only admin can create accounts!';
      returnObject.code = ApiCode.INVALID_CREDENTIALS;
      res.json(returnObject);
      return;
    }
    if (!username || !password) {
      returnObject.msg = 'Account name and password cannot be empty!';
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(returnObject);
      return;
    }
    const users = getUsers();
    const userExists = users.some(user => user.username === username);
    if (userExists) {
      returnObject.msg = 'Username already exists!';
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(returnObject);
      return;
    }
    const hashedPassword = await hashEncrypt(password, 10);
    const newUser = {
      username,
      password: hashedPassword,
      role: 'readonly',
      isEnabled: 'true'
    };
    const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const userFile =  JSON.parse(fs.readFileSync(userManager.userFile, UTF8));
    userFile.Accounts.push(newUser);

    fs.writeFileSync(userManager.userFile, JSON.stringify(userFile, null, 2), UTF8);
    returnObject.msg = 'Account created successfully!';
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  }
  catch (err) {
    next(err);
  }
}

function apiGetUserList(req, res, next) {
  try {
    const returnObject = createApiObj();
    
    const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const userFile =  JSON.parse(fs.readFileSync(userManager.userFile, UTF8));

    returnObject.code = ApiCode.OK;
    returnObject.data = userFile;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

//TODO
function apiDeleteAccount(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { role, username } = req.body;
    if(role !== 'admin') {
      returnObject.msg = 'Only admin can delete accounts!';
      returnObject.code = ApiCode.INVALID_CREDENTIALS;
      res.json(returnObject);
      return;
    }

    const { userManager } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const userFile =  JSON.parse(fs.readFileSync(userManager.userFile, UTF8));

    const users = userFile.Accounts;
    const userIndex = users.findIndex(user => user.username === username);
    if (userIndex === -1) {
      returnObject.msg = 'Username does not exist!';
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(returnObject);
      return;
    }

    users.splice(userIndex, 1);
    fs.writeFileSync(userManager.userFile, JSON.stringify(userFile, null, 2), UTF8);
    returnObject.msg = 'Account deleted successfully!';
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  }
  catch (err) {
    next(err);
  }
}

async function  apiLogin(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { username, password, twoFaCode} = req.body;

    if (!username || !password) {
      returnObject.msg = 'Account name and password cannot be empty!';
      returnObject.code = ApiCode.INVALID_CREDENTIALS;
      return res.json(returnObject);
    }

    const users = getUsers();
    let verified = false;
    let user = null;
    for( let i = 0; i < users.length; i++) {
      user = users[i];
      const psVerified = await verifiedHash(password, user.password);
      if( (user.username === username) &&   psVerified) {
        verified = true;
        break;
      }
    }

    if (verified === false) {
      returnObject.msg = 'The username or password is incorrect!';
      returnObject.code = ApiCode.INVALID_CREDENTIALS;
      return res.json(returnObject);
    }

    const twoFa = new TwoFactorAuth();
    if(twoFa.getTwoFaStatus(username)) {
      const result = await twoFa.verifyToken(username, twoFaCode);
      if (!result) {
        returnObject.msg = 'Two factor auth verify failed';
        returnObject.code = ApiCode.INVALID_CREDENTIALS;
        return res.json(returnObject);
      }
    }
    const { server } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));

    const expiresTime = server.authExpiration; // h
    const token = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: `${expiresTime}h`
    });
    returnObject.msg = 'Login sucessful';
    returnObject.code = ApiCode.OK;
    returnObject.data = {
      token,
      username,
      role: user.role, // 用户角色
    };
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

async function changeAccount(targetUsername, newUsername, newPassword) {
  try {
    // Read the configuration file to get the user file path
    const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const userFilePath = configData.userManager.userFile;

    // Read the user file content
    const userContent = await fsPromises.readFile(userFilePath, UTF8);
    const users = JSON.parse(userContent);

    let userFound = false;

    // Iterate through all user arrays
    for (let account of users.Accounts) {
      // Find the user object by targetUsername
      if (account.username === targetUsername) {
        // Update the username and password
        account.username = newUsername;
        account.password = await hashEncrypt(newPassword);
        userFound = true;
        break;
      }
    }

    if (!userFound) {
      logger.error(`Error: User ${targetUsername} not found`);
      return false;
    }

    // Convert the updated object back to JSON format
    const updatedJsonContent = JSON.stringify(users, null, 2);

    // Write the updated content back to the JSON file
    await fsPromises.writeFile(userFilePath, updatedJsonContent, UTF8);

    return true;
  } catch (error) {
    logger.error(`Error during account update: ${error}`);
    return false;
  }
}

async function apiUpdateAccount(req, res, next) {
  try {
    const ret = createApiObj();
    const requesterName = req.auth?.username;
    if (!requesterName) {
      logger.error( `Unauthorized access attempt: ${requesterName}`);
      ret.code = ApiCode.INVALID_CREDENTIALS;
      ret.msg = 'Unauthorized';
      return res.status(401).json(ret);
    }
    const requester = getUserByName(requesterName);
    if (!requester) {
      ret.code = ApiCode.INVALID_CREDENTIALS;
      ret.msg = 'Unauthorized';
      return res.status(401).json(ret);
    }

    const isAdmin = requester.role === 'admin';
    if (!isAdmin) {
      ret.code = ApiCode.INVALID_CREDENTIALS;
      ret.msg = 'Permission denied, your account is not admin';
      return res.status(403).json(ret);
    }
    const { targetUsername, newUsername, newPassword } = req.body;
    
    if (!newUsername && !newPassword) {
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = 'Nothing to update, please provide new username or password';
      return res.status(400).json(ret);
    }
    if (newUsername && newUsername !== targetUsername) {
      if (getUserByName(newUsername)) {
        ret.code = ApiCode.INVALID_INPUT_PARAM;
        ret.msg = 'Username already exists';
        return res.status(400).json(ret);
      }
    }

    const response = await changeAccount(targetUsername, newUsername, newPassword);
    if (response) {
      res.json({
        code: ApiCode.OK,
        msg: 'Account updated successfully'
      });
    } else {
      res.json({
        code: ApiCode.ERROR,
        msg: 'Error updating account'
      });
    }
  } catch (err) {
    next(err);
  }
}

function apiGetAuthState(req, res, next) {
  try {
    const returnObject = createApiObj();
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    returnObject.code = ApiCode.OK;
    const hardwareType = getHardwareType();
    let boardType = '';
    if( hardwareType === HardwareType.MangoPi){
      boardType ='mangopi';
    }else if(hardwareType === HardwareType.PI4B ){
      boardType = '4B';
    }else if( hardwareType === HardwareType.CM4 ){
      boardType = 'CM4';
    }
    returnObject.data = {
      productVersion: PRODUCT_VERSION,
      serverVersion: SERVER_VERSION,
      auth: config.server.auth,
      boardType: boardType,
      codeOfConductIsActive: config.codeOfConduct.isActive,
      codeOfConductUrl: config.codeOfConduct.url
    };
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
} 

async function apiEnabledAuth(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { auth } = req.body;
    if (auth === undefined) {
      returnObject.msg = 'Auth parameter is required!';
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(returnObject);
      return;
    }
    if (typeof auth !== 'boolean') {
      returnObject.msg = 'Auth must be a boolean value!';
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(returnObject);
      return;
    }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    if(config.server.auth === auth) {
      returnObject.msg = `Auth is already ${auth ? 'enabled' : 'disabled'}`;
      returnObject.code = ApiCode.OK;
      res.json(returnObject);
      return;
    }
    returnObject.code = ApiCode.OK;
  await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.server.auth = auth; });
    returnObject.data = {
      auth: config.server.auth
    };
    res.json(returnObject);
    setTimeout(() => {
      process.exit(0);
    }, 1000); 
  } catch (err) {
    next(err);
  }
}

async function apiChangeAuthExpiration(req, res, next) {
  try {
    const returnObject = createApiObj();
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  const { expiration } = req.body;
  await writeJsonAtomic(CONFIG_PATH, (cfg) => { cfg.server.authExpiration = expiration; });
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'Auth expiration changed successfully!';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

export { apiLogin, apiUpdateAccount, apiGetUserList, apiCreateAccount, apiDeleteAccount, apiGetAuthState, apiChangeAuthExpiration, apiEnabledAuth };
