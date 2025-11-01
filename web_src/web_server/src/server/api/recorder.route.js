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
import { Recorder } from '../../modules/recorder.js';
import { hidPlayer } from '../../modules/hid_player.js';
import fs from 'fs';
import path from 'path';
import { RECORD_DIR } from '../../common/constants.js';
import multer from 'multer';

// 由于 recorder.js 导出的是单例实例，这里直接 new 一次即可获得同一个实例（若 recorder.js 改为命名导出请同步修改）
const recorder = new Recorder();

/**
 * POST /api/recorder/start
 * body: { filename: string }
 */
function apiRecorderStart(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { filename } = req.body || {};
    const ret = recorder.startRecording(filename);
    if (!ret.ok) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = ret.error || 'start failed';
    } else {
      returnObject.code = ApiCode.OK;
      returnObject.data = { file: ret.file };
      returnObject.msg = 'recording started';
    }
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/recorder/stop
 */
function apiRecorderStop(req, res, next) {
  try {
    const returnObject = createApiObj();
    const ret = recorder.stopRecording();
    if (!ret.ok) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = ret.error || 'stop failed';
    } else {
      returnObject.code = ApiCode.OK;
      returnObject.data = { file: ret.file };
      returnObject.msg = 'recording stopped';
    }
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/recorder/run
 * body: { file: string, speed?: number }
 */
function apiRecorderRun(req, res, next) {
  try {
    const returnObject = createApiObj();
    const { file, speed } = req.body || {};
    if (!file) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'missing file';
      return res.json(returnObject);
    }
    hidPlayer.stop();
    hidPlayer.play(file, { speed: Number(speed) || 1.0, onEnd: () => {} });
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'replay started';
    returnObject.data = { file, speed: Number(speed) || 1.0 };
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/recorder/stopRun
 */
function apiRecorderStopRun(req, res, next) {
  try {
    const returnObject = createApiObj();
    hidPlayer.stop();
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'replay stopped';
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/recorder/:file
 * 删除指定录制文件（仅允许 basename，拒绝包含 / 或 .. 的路径）
 */
function apiRecorderDelete(req, res, next) {
  try {
    const returnObject = createApiObj();
    const file = req.params?.file;
    if (!file || file.includes('/') || file.includes('..')) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'invalid file name';
      return res.json(returnObject);
    }
    const full = path.join(RECORD_DIR, file);
    if (!fs.existsSync(full)) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'file not found';
      return res.json(returnObject);
    }
    fs.unlinkSync(full);
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'deleted';
    returnObject.data = { file };
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/recorder
 * 列出录制目录下的文件
 */
function apiRecorderList(req, res, next) {
  try {
    const returnObject = createApiObj();
    try {
      if (!fs.existsSync(RECORD_DIR)) {
        fs.mkdirSync(RECORD_DIR, { recursive: true });
      }
      const items = fs
        .readdirSync(RECORD_DIR, { withFileTypes: true })
        .filter(d => d.isFile())
        .map(d => {
          const full = path.join(RECORD_DIR, d.name);
          const stat = fs.statSync(full);
          return {
            file: d.name,
            size: stat.size,
            mtime: stat.mtimeMs,
            ctime: stat.ctimeMs
          };
        })
        // 只列出 .json 文件，且按修改时间倒序
        .filter(it => it.file.toLowerCase().endsWith('.json'))
        .sort((a, b) => b.mtime - a.mtime);

      returnObject.code = ApiCode.OK;
      returnObject.data = { files: items };
      returnObject.msg = 'ok';
    } catch (e) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = e.message || 'list failed';
    }
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/recorder/download?file=xxx.json
 * 下载指定录制文件
 */
function apiRecorderDownload(req, res, next) {
  try {
    const returnObject = createApiObj();
    const file = req.query?.file;
    if (!file || file.includes('/') || file.includes('..')) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'invalid file name';
      return res.json(returnObject);
    }
    const full = path.resolve(RECORD_DIR, file);
    if (!full.startsWith(path.resolve(RECORD_DIR))) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'forbidden';
      return res.json(returnObject);
    }
    if (!fs.existsSync(full)) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'file not found';
      return res.json(returnObject);
    }
    const stat = fs.statSync(full);
    const safeName = path.basename(full);
    const encodedName = encodeURIComponent(safeName);
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`
    });
    const stream = fs.createReadStream(full);
    stream.pipe(res);
    stream.on('error', (err) => next(err));
  } catch (err) {
    next(err);
  }
}

// 配置上传到 RECORD_DIR
const recorderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      if (!fs.existsSync(RECORD_DIR)) fs.mkdirSync(RECORD_DIR, { recursive: true });
    } catch (e) {}
    cb(null, RECORD_DIR);
  },
  filename: function (req, file, cb) {
    // 仅允许 .json，默认使用原文件名；若已存在则拒绝
    let name = path.basename(file.originalname || 'recording.json');
    if (!name.toLowerCase().endsWith('.json')) name = name + '.json';
    const full = path.join(RECORD_DIR, name);
    if (fs.existsSync(full)) {
      // 在 filename 阶段无法直接响应，只能附加标记，由处理函数判断
      file._exists = true;
    }
    cb(null, name);
  }
});
const recorderUpload = multer({ storage: recorderStorage }).single('file');

/**
 * POST /api/recorder/upload (form-data: file)
 */
function apiRecorderUpload(req, res, next) {
  const returnObject = createApiObj();
  recorderUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      returnObject.msg = 'upload error';
      return res.json(returnObject);
    } else if (err) {
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      returnObject.msg = err.message || 'upload failed';
      return res.json(returnObject);
    }
    const savedName = req.file?.filename;
    if (!savedName) {
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'no file';
      return res.json(returnObject);
    }
    const full = path.join(RECORD_DIR, savedName);
    if (fs.existsSync(full) && req.file?._exists) {
      // 覆盖了已存在文件，按需求拒绝并删除新写入的
      try { fs.unlinkSync(full); } catch (e) {}
      returnObject.code = ApiCode.INVALID_INPUT_PARAM;
      returnObject.msg = 'file already exists';
      return res.json(returnObject);
    }
    returnObject.code = ApiCode.OK;
    returnObject.msg = 'uploaded';
    returnObject.data = { file: savedName };
    return res.json(returnObject);
  });
}

export {apiRecorderDelete, apiRecorderStart, apiRecorderStop , apiRecorderRun, apiRecorderStopRun, apiRecorderList, apiRecorderDownload, apiRecorderUpload };
