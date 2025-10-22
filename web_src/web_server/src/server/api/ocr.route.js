
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
import { createWorker  } from 'tesseract.js';
import Video from '../../modules/video/video.js';
import { createApiObj } from '../../common/api.js';
import Logger from '../../log/logger.js';

const logger = new Logger();

async function apiOcr(req, res, next) {
  const returnObject = createApiObj();
  try {
    const { lang, rect } = req.body;
    const worker = await createWorker(lang, 1, {
        langPath: './lib/tesseract'
    });
    const video = new Video();
    const rectangle = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    const ret = await worker.recognize(video.getSnapshotUrl(), {rectangle});
    await worker.terminate();
    returnObject.msg = 'use tesseract recognize ok';
    returnObject.data = ret.data.text;
    logger.info(ret.data.text);
    res.json(returnObject);
  } catch (error) {
    next(error);
  } 
}

export { apiOcr };