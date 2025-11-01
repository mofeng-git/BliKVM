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
import {ACL_PATH, UTF8} from '../../common/constants.js';
import { writeJsonAtomic } from '../../common/atomic-file.js';
import fs from 'fs';

function apiGetACLState(req, res, next) {
  try {
    const returnObject = createApiObj();
    const acl_config =  JSON.parse(fs.readFileSync(ACL_PATH, UTF8));
    
    if (acl_config === undefined || acl_config === null) {
      returnObject.msg = 'ACL file does not exist';
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      return res.status(500).json(returnObject);
    }
    returnObject.data = acl_config;
    returnObject.msg = 'ACL data retrieved successfully';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

async function apiAddList(req, res, next) {
    try {
        const { mode, ip } = req.body;
        const returnObject = createApiObj();
        if (!mode || !ip) {
            returnObject.msg = 'Invalid input parameters';
            returnObject.code = ApiCode.INVALID_INPUT_PARAM;
            return res.status(400).json(returnObject);
        }
        const acl_config = JSON.parse(fs.readFileSync(ACL_PATH, UTF8));
        if (!acl_config) {
            returnObject.msg = 'ACL file does not exist';
            returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
            return res.status(500).json(returnObject);
        }

        const newEntry = { ip, addedAt: new Date().toISOString().split('T')[0] }; // 创建新的 IP 条目

        if(mode === "allow"){
            const exists = acl_config.allowList.items.some((entry) => entry.ip === ip);
            if (exists) {
              returnObject.msg = `IP ${ip} already exists in allowList`;
              returnObject.code = ApiCode.DUPLICATE_ENTRY;
              return res.status(400).json(returnObject);
            }
            acl_config.allowList.items.push(newEntry);
        }else if(mode === "block"){
            const exists = acl_config.blockList.items.some((entry) => entry.ip === ip);
            if (exists) {
              returnObject.msg = `IP ${ip} already exists in blockList`;
              returnObject.code = ApiCode.DUPLICATE_ENTRY;
              return res.status(400).json(returnObject);
            }
            // 添加 IP 到 blockList
            acl_config.blockList.items.push(newEntry);
        }else{
            returnObject.msg = 'Invalid mode, must be "allow" or "block"';
            returnObject.code = ApiCode.INVALID_INPUT_PARAM;
            return res.status(400).json(returnObject);
        }
  returnObject.data = acl_config;
  returnObject.msg = 'IP added successfully';
  await writeJsonAtomic(ACL_PATH, acl_config);
        res.json(returnObject);
    } catch (err) {
      next(err);
    }
}

async function apiDelete(req, res, next) {
    try {
      const { mode, ip } = req.body;
      const returnObject = createApiObj();

      console.log(`Received request to delete IP ${ip} from ${mode} list`);
  
      // 验证输入参数
      if (!mode || !ip) {
        returnObject.msg = 'Invalid input parameters';
        returnObject.code = ApiCode.INVALID_INPUT_PARAM;
        return res.status(400).json(returnObject);
      }
  
      // 读取 ACL 配置文件
      const acl_config = JSON.parse(fs.readFileSync(ACL_PATH, UTF8));
      if (!acl_config) {
        returnObject.msg = 'ACL file does not exist';
        returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
        return res.status(500).json(returnObject);
      }
  
      // 根据模式处理 IP 删除操作
      if (mode === "allow") {
        const index = acl_config.allowList.items.findIndex((entry) => entry.ip === ip);
        if (index === -1) {
          returnObject.msg = `IP ${ip} does not exist in allowList`;
          returnObject.code = ApiCode.NOT_FOUND;
          return res.status(404).json(returnObject);
        }
  
        // 删除 IP
        acl_config.allowList.items.splice(index, 1);
      } else if (mode === "block") {
        const index = acl_config.blockList.items.findIndex((entry) => entry.ip === ip);
        if (index === -1) {
          returnObject.msg = `IP ${ip} does not exist in blockList`;
          returnObject.code = ApiCode.NOT_FOUND;
          return res.status(404).json(returnObject);
        }
  
        // 删除 IP
        acl_config.blockList.items.splice(index, 1);
      } else {
        returnObject.msg = 'Invalid mode, must be "allow" or "block"';
        returnObject.code = ApiCode.INVALID_INPUT_PARAM;
        return res.status(400).json(returnObject);
      }
  
  // 写回更新后的 ACL 配置文件
  await writeJsonAtomic(ACL_PATH, acl_config);
  
      // 返回成功响应
      returnObject.data = acl_config;
      returnObject.msg = `IP ${ip} deleted successfully from ${mode} list`;
      returnObject.code = ApiCode.OK;
      res.json(returnObject);
    } catch (err) {
      next(err);
    }
  }

  async function apiChangeACLMode( req, res, next) {
    try {
        const { mode } = req.body;
        const returnObject = createApiObj();
        if (!mode) {
            returnObject.msg = 'Invalid input parameters';
            returnObject.code = ApiCode.INVALID_INPUT_PARAM;
            return res.status(400).json(returnObject);
        }
        const acl_config = JSON.parse(fs.readFileSync(ACL_PATH, UTF8));
        if (!acl_config) {
            returnObject.msg = 'ACL file does not exist';
            returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
            return res.status(500).json(returnObject);
        }

  acl_config.mode = mode; // 更新模式
  await writeJsonAtomic(ACL_PATH, acl_config);
        returnObject.data.mode = acl_config.mode;
        returnObject.msg = 'ACL mode changed successfully';
        res.json(returnObject);
    } catch (err) {
      next(err);
    } 
}

export {apiGetACLState, apiAddList, apiDelete, apiChangeACLMode};

