
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
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { ApiCode, createApiObj } from '../../common/api.js';
import Logger from '../../log/logger.js';
import { exec } from 'child_process';
import progressStream from 'progress-stream';

import {
  executeCMD,
  getSystemType,
  changetoRWSystem,
  changetoROSystem,
  readVentoyDirectory
} from '../../common/tool.js';
import { CONFIG_PATH, MSD_MOUNT_DIR } from '../../common/constants.js';

const logger = new Logger();

const MSDImageType = {
  ventoy: 'ventoy',
  common: 'common'
};

class MSD {
  static _instance = null;
  _upload = null;
  _storage = null;
  _uploadProgress = 0;
  _makeImageProgress = 0;

  constructor() {
    if (!MSD._instance) {
      MSD._instance = this;
      this._init();
    }
    return MSD._instance;
  }

  _init() {
    this._name = 'MSD';
    this._storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const { msd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        cb(null, MSD_MOUNT_DIR);
      },
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      }
    });
    this._upload = multer({ storage: this._storage }).single('image');
  }

  uploadMultipleAsync(req, res, next) {
    try {
      const returnObject = createApiObj();

  const progress = progressStream({ length: '0' }); // Note: length is set to '0' here
      req.pipe(progress);
      progress.headers = req.headers;

      this._uploadProgress = 0;

      // 获取上传进度
      progress.on('progress', (obj) => {
        this._uploadProgress = obj.percentage;
        // logger.info(`update progress: ${this._uploadProgress}`);
      });

      this._upload(progress, res, (err) => {
        if (err instanceof multer.MulterError) {
          logger.error(`${this._name} error: ${err.message}`);
          returnObject.msg = 'File upload error.';
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
        } else if (err) {
          logger.error(`${this._name} error: ${err.message}`);
          next(err);
        } else {
          // const uploadedFileName = req.file.originalname;
          returnObject.msg = 'File uploaded successfully';
          returnObject.code = ApiCode.OK;
          this._uploadProgress = 0;
          res.json(returnObject);
        }
      });
    } catch (err) {
      next(err);
    }
  }

  _checkCreateParams(req) {
    const body = req.body || {};

  // 1) Basic normalization and trimming
    const type = String(body.type || '').trim();
    const name = String(body.name || '').trim();
    const sizeRaw = String(body.size || '').trim();

  // 2) Type whitelist
    if (!(type === MSDImageType.ventoy || type === MSDImageType.common)) {
  logger.error(`MSD create params invalid: unsupported type "${type}" (allowed: ${Object.values(MSDImageType).join(', ')})`);
      return false;
    }

  // 3) Name validation: only letters/digits/._- are allowed, length 1–32
    if (!/^[A-Za-z0-9._-]{1,32}$/.test(name)) {
  logger.error(`MSD create params invalid: bad name "${name}" (allowed: [A-Za-z0-9._-], length 1-32)`);
      return false;
    }

  // 4) Size validation: integer GB, 1 ~ 1024, no unit suffix is allowed
    const m = sizeRaw.match(/^(\d{1,4})$/);
    if (!m) {
  logger.error(`MSD create params invalid: bad size "${sizeRaw}" (expected: integer GB between 1 and 1024, no unit suffix)`);
      return false;
    }
    const gb = parseInt(m[1], 10);

  // Allowed range: 1 GB ~ 1024 GB
    if (Number.isNaN(gb) || gb < 1 || gb > 1024) {
  logger.error(`MSD create params invalid: size out of range -> ${gb} GB (allowed: 1 ~ 1024 GB)`);
      return false;
    }

  // 5) Canonicalization (rewrite in-place without changing other code paths)
    req.body.type = type;
    req.body.name = name;
    req.body.size = String(gb); // Normalize to plain GB integer without any unit

    return true;
  }

  _parseProgress(data) {
  // Parse command output and extract copy progress percentage
    const match = data.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : null;
  }

  _executeCmdCP(cmd, progressCallback) {
    return new Promise((resolve, reject) => {
      const childProcess = exec(cmd);

      childProcess.stdout.on('data', (data) => {
        const progress = this._parseProgress(data);
        if (progress !== null) {
          progressCallback(progress);
        }
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`data: ${data}`);
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });
    });
  }

  getMSDState() {
    const { msd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const stateFilePath = msd.stateFilePath;
    if (!fs.existsSync(stateFilePath)) {
      const initialState = {
        msd_status: "not_connected",
        msd_img_created: "not_created",
        file_mount_flag: "false",
      };
  
      const dirPath = path.dirname(stateFilePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
  
      fs.writeFileSync(stateFilePath, JSON.stringify(initialState, null, 2), 'utf8');
    }
  
    const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    return {
      ...state,   
      tusPort: msd.tusPort
    };
  }

  createMSD(req, res, next) {
    try {
      const returnObject = createApiObj();
      const state = this.getMSDState();
      if (state.msd_img_created === 'created') {
        logger.warn('msd drive already created');
        returnObject.msg = 'msd drive alreadly created!';
        returnObject.code = ApiCode.INVALID_INPUT_PARAM;
        returnObject.data = state;
        res.json(returnObject);
        return;
      }

      if (!this._checkCreateParams(req)) {
        logger.error('Invalid input parameters for creating MSD');
        returnObject.msg = 'Invalid input parameters';
        returnObject.code = ApiCode.INVALID_INPUT_PARAM;
        res.json(returnObject);
        return;
      }
      const type = req.body.type;
      const name = req.body.name;
      const size = req.body.size;

      const systemType = getSystemType();
      if (systemType === 'ro') {
        if (changetoRWSystem() === false) {
          returnObject.msg = 'change ro system to rw failed';
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
          return;
        }
      }

      this._makeImageProgress = 0;

      const { msd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      const cmd = `bash ${msd.shell} -c make -s ${size} -n ${name} -t ${type}`;
      logger.info(`Create MSD: ${cmd}`);
      this._executeCmdCP(cmd, (progress) => {
        logger.info(`make msd image progress: ${progress}`);
        this._makeImageProgress = progress;
      })
        .then(() => {
          returnObject.msg = 'create msd drive ok';
          returnObject.code = ApiCode.OK;
          this._makeImageProgress = 0;
          res.json(returnObject);
        })
        .catch((err) => {
          returnObject.msg = `create msd image failed: ${err.message}`;
          returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
          res.json(returnObject);
        });

      if (systemType === 'ro') {
        if (changetoROSystem() === false) {
          logger.error('change rw system to ro failed');
        }
      }
    } catch (err) {
      next(err);
    }
  }

  async mountMSD(req, res, next) {
    const returnObject = createApiObj();
    const state = this.getMSDState();
    const action = req.query.action;

    if (state.file_mount_flag === 'true' && action === 'mount') {
      returnObject.msg = "Already mounted, you can't exec mount command";
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.data = state;
      return res.json(returnObject);
    }
    if (state.file_mount_flag === 'false' && action === 'unmount') {
      returnObject.msg = "Already unmounted, you can't exec unmount command";
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.data = state;  
      return res.json(returnObject);
    }

    const { msd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  
    try {
      if (action === 'mount') {
  
        const cmd = `bash ${msd.shell} -c mount_image`;
        await executeCMD(cmd); 
        logger.info('mount MSD');
        returnObject.msg = `${cmd} ok`;
        returnObject.code = ApiCode.OK;
        returnObject.data = this.getMSDState();
        return res.json(returnObject);
        
      } else {
        const cmd = `bash ${msd.shell} -c unmount_image`;
        await executeCMD(cmd);  // 使用 await 确保执行完成
        logger.info('umount MSD');
        returnObject.msg = `${cmd} ok`;
        returnObject.code = ApiCode.OK;
        returnObject.data = this.getMSDState();
        return res.json(returnObject);
      }
    } catch (err) {
      next(err);
    }
  }

    async connectMSD(req, res, next) {
    const returnObject = createApiObj();
    const state = this.getMSDState();
  
    if (state.msd_img_created !== 'created') {
      returnObject.msg = "usb drive not created, you can't exec connect command";
      returnObject.code = ApiCode.OK;
      returnObject.data = state;
      return res.json(returnObject);
    }
  
    const action = req.query.action;
    const { msd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  
    try {
      if (action === 'true') {
        if (state.msd_status === 'connected') {
          returnObject.msg = 'usb drive already connected to host';
          returnObject.code = ApiCode.OK;
          returnObject.data = state;
          return res.json(returnObject);
        }
  
        const cmd = `bash ${msd.shell} -c conn`;
        await executeCMD(cmd); 
  
        logger.info('Connected MSD');
        returnObject.msg = `${cmd} ok`;
        returnObject.code = ApiCode.OK;
        returnObject.data = this.getMSDState();
        return res.json(returnObject);
        
      } else {
        if (state.msd_status === 'not_connected') {
          returnObject.msg = 'usb drive already disconnected from host';
          returnObject.code = ApiCode.OK;
          returnObject.data = state;
          return res.json(returnObject);
        }
  
        const cmd = `bash ${msd.shell} -c disconn`;
        await executeCMD(cmd);  // 使用 await 确保执行完成
  
        logger.info('Disconnected MSD');
        returnObject.msg = `${cmd} ok`;
        returnObject.code = ApiCode.OK;
        returnObject.data = this.getMSDState();
        return res.json(returnObject);
      }
    } catch (err) {
      next(err);
    }
  }
  

  async removeMSD(req, res, next) {
    const returnObject = createApiObj();
    const state = this.getMSDState();
    if (state.msd_img_created !== 'created') {
      returnObject.msg = 'usb drive not created, you need to make first';
      returnObject.code = ApiCode.OK;
      returnObject.data = this.getMSDState();
      res.json(returnObject);
      return;
    }
    const { msd } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const cmd = `bash ${msd.shell} -c clean`;
    logger.info(`Remove MSD: ${cmd}`);
    try{
      await executeCMD(cmd);
      returnObject.msg = 'remove msd image ok';
      returnObject.code = ApiCode.OK;
      returnObject.data = this.getMSDState();
      res.json(returnObject);
    }catch (err) {
      next(err);
    }
  }

  async getImages() {
    try {
      const isos = await readVentoyDirectory(MSD_MOUNT_DIR);
      return isos;
    } catch (err) {
      logger.error(`Get all files in directory ${MSD_MOUNT_DIR} failed: ${err.message}`);
      return [];
    }
  }

  deleteImage(dir) {
    return new Promise((resolve, reject) => {
      fs.unlink(dir, (err) => {
        if (err) {
          logger.error(`Error deleting file:${err.message}`);
          reject(err);
        } else {
          logger.info(`${dir} deleted successfully`);
          resolve(true);
        }
      });
    });
  }

  getUploadProgress(req, res) {
    const returnObject = createApiObj();
    const progress = this._uploadProgress;
    // logger.info(`getUploadProgress: ${progress}` );
    returnObject.msg = 'get the uplaod progress';
    returnObject.code = ApiCode.OK;
    returnObject.data = progress;
    res.json(returnObject);
  }

  getMakeImageProgress(req, res) {
    const returnObject = createApiObj();
    const progress = this._makeImageProgress;
    returnObject.msg = 'get the make image progress';
    returnObject.code = ApiCode.OK;
    returnObject.data = progress;
    res.json(returnObject);
  }
}

export default MSD;
