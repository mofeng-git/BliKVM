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
import path from 'path';
import { createApiObj, ApiCode } from '../../common/api.js';
import { MSD_MOUNT_DIR } from '../../common/constants.js';

const DOWNLOAD_BASE_DIR = path.resolve(MSD_MOUNT_DIR); // 可根据实际项目调整

function apiDownloadFile(req, res, next) {
  try {
    const fileName = req.params.filename;
    if (!fileName) {
      const errorObj = createApiObj();
      errorObj.code = ApiCode.INVALID_INPUT_PARAM;
      errorObj.msg = 'Missing "file" query parameter';
      return res.status(400).json(errorObj);
    }

    const filePath = path.resolve(DOWNLOAD_BASE_DIR, fileName);

    // 防止路径穿越攻击
    if (!filePath.startsWith(DOWNLOAD_BASE_DIR)) {
      const errorObj = createApiObj();
      errorObj.code = ApiCode.INTERNAL_SERVER_ERROR;
      errorObj.msg = 'Forbidden file access';
      return res.status(403).json(errorObj);
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      const errorObj = createApiObj();
      errorObj.code = ApiCode.INTERNAL_SERVER_ERROR;
      errorObj.msg = 'File not found';
      return res.status(404).json(errorObj);
    }

    const stat = fs.statSync(filePath);

    const safeName = path.basename(filePath); // 保留原始文件名
    const encodedName = encodeURIComponent(safeName); // 转成 %E6%96%B0%E5%BB%BA...

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', (err) => next(err));
  } catch (error) {
    next(error);
  }
}

export { apiDownloadFile };
