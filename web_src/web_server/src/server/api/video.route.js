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
import Video from '../../modules/video/video.js';
import MJPEGStreamRecorder from '../../modules/video/MJPEGStreamRecorder.js';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import { ApiCode, createApiObj } from '../../common/api.js';
import Logger from '../../log/logger.js';
import { ModuleState } from '../../common/enums.js';
import { getHardwareType, executeCMD } from '../../common/tool.js';
import { HardwareType } from '../../common/enums.js';
import { execSync } from 'child_process';

const logger = new Logger();

/**
 * Handles the API request to start the video service.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @private
 */
function apiVideoControl(req, res, next) {
  try {
    const ret = createApiObj();
    const action = req.query.action;
    const video = new Video();
    if (action === 'start') {
      video
        .startService()
        .then((result) => {
          ret.data.state = video.state;
          res.json(ret);
        })
        .catch((result) => {
          ret.code = ApiCode.INTERNAL_SERVER_ERROR;
          ret.msg = result.msg;
          ret.data.state = video.state;
          res.json(ret);
        });
    } else if (action === 'stop') {
      video
        .closeService()
        .then((result) => {
          ret.data.state = video.state;
          res.json(ret);
        })
        .catch((result) => {
          ret.code = ApiCode.INTERNAL_SERVER_ERROR;
          ret.msg = result.msg;
          ret.data.state = video.state;
          res.json(ret);
        });
    } else {
      ret.msg = 'input invalid video command';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      res.json(ret);
    }
  } catch (err) {
    next(err);
  }
}

function apiResolutionChange(req, res, next) {
  const ret = createApiObj();

  if (getHardwareType() !== HardwareType.MangoPi) {
    ret.code = ApiCode.INTERNAL_SERVER_ERROR;
    ret.msg = 'Hardware not supported change resolution';
    res.json(ret);
    return;
  }

  const resolution = req.query.resolution;
  const video = new Video();
  video.setResolution(resolution);

  if (video.state === ModuleState.RUNNING) {
    video
      .closeService() 
      .then(() => {
        return video.startService(); 
      })
      .then(() => {
        ret.code = ApiCode.SUCCESS;
        ret.msg = 'Resolution changed and service restarted successfully';
        res.json(ret);
      })
      .catch((result) => {
        ret.code = ApiCode.INTERNAL_SERVER_ERROR;
        ret.msg = result.msg;
        ret.data.state = video.state;
        res.json(ret);
      });
  } else {
    video
      .startService()
      .then(() => {
        ret.code = ApiCode.SUCCESS;
        ret.msg = 'Service started with new resolution successfully';
        res.json(ret);
      })
      .catch((result) => {
        ret.code = ApiCode.INTERNAL_SERVER_ERROR;
        ret.msg = result.msg;
        ret.data.state = video.state;
        res.json(ret);
      });
  }
}


function apiVideoConfig(req, res, next) {
  try {
    const ret = createApiObj();
    const video = new Video();
    const action = req.query.action;
    if (action === 'get') {
      ret.data = video.getVideoConfig();
      ret.msg = 'get video param success';
    } else if (action === 'set') {
      video.setVideoConfig(req.body.data);
      ret.msg = 'set video param success';
    } else {
      ret.msg = 'input invalid video command';
      ret.code = ApiCode.INVALID_INPUT_PARAM;
    }
    res.json(ret);
  } catch (error) {
    next(error);
  }
}

function apiGetVideoState(req, res, next) {
  const ret = createApiObj();
  const video = new Video();
  video.getVideoState()
    .then(response => {
      ret.msg = 'get video state ok';
      ret.data = {
        width: response.result.source.resolution.width,
        height: response.result.source.resolution.height,
        capturedFps: response.result.source.captured_fps,
        queuedFps: response.result.stream.queued_fps
      };
      res.json(ret);
    })
    .catch(error => {
      next(error);
    });
}


async function wsGetVideoState() {
  try {
    const video = new Video();
    if (video.state !== ModuleState.RUNNING) {
      return null;
    }
    const response = await video.getVideoState();
    const ret = {
      width: response.result.source.resolution.width,
      height: response.result.source.resolution.height,
      capturedFps: response.result.source.captured_fps,
      queuedFps: response.result.stream.queued_fps
    };
    return ret;
  } catch (error) {
    logger.error(`get video state error: ${error}`);
  }
}

function apiStartRecording(req, res, next) {
  try {
    const recorder = new MJPEGStreamRecorder();
    recorder.startRecording()
    .then(() => {
      logger.info('Recording started successfully');
    })
    .catch((error) => {
      logger.error('Failed to start recording:', error.message);
    });
    const ret = createApiObj();
    ret.msg = 'Recording started successfully.';
    res.json(ret);
  } catch (error) {
    next(error);
  }
}

function apiStopRecording(req, res, next) {
  try {
    const ret = createApiObj();
    const recorder = new MJPEGStreamRecorder();
    recorder.stopRecording();
    ret.msg = 'Recording stopped and saved.';
    res.json(ret);
  } catch (error) {
    next(error);
  }
}

function apiRecording(req, res, next) {
  try {
    const action = req.query.action;
    if (action === 'start') {
      apiStartRecording(req, res, next);
    } else if (action === 'stop') {
      apiStopRecording(req, res, next);
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    next(error);
  }
}

async function apiSnapshot(req, res, next) {
  try {
    const video = new Video();
    const imageBuffer = await video.getSnapshotImage(next);
    if (imageBuffer) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(imageBuffer, 'binary');
    }
  } catch (error) {
    next(error);
  }
} 

function parseEdidOutput(output) {
  const lines = output.split('\n');
  const result = {};

  lines.forEach(line => {
    const [key, value] = line.split(':').map(part => part.trim());
    if (key && value) {
      result[key.toLowerCase().replace(/\s+/g, '_')] = value;
    }
  });

  return result;
}

function apiEdidInfo(req, res, next) {
  try {
    const ret = createApiObj();
    const output = execSync('./lib/kvmd-edidconf 2>&1').toString();
    const parsedOutput = parseEdidOutput(output); 
    ret.data = parsedOutput; 
    ret.msg = 'EDID information retrieved successfully';
    res.json(ret);
  } catch (error) {
    next(error);
  }
}


function apiEdidSet(req, res, next) {
  try {
    const ret = createApiObj();
    const {manufacturer_id, product_id, serial_number, monitor_name } = req.body;
    const cmd = `./lib/kvmd-edidconf --set-monitor-name=${monitor_name} --set-mfc-id=${manufacturer_id} --set-product-id=${product_id} --set-serial=${serial_number} --apply`;
    execSync(cmd);
    const output = execSync('./lib/kvmd-edidconf 2>&1').toString();
    const parsedOutput = parseEdidOutput(output); 
    ret.data = parsedOutput; 
    ret.msg = 'EDID information set successfully';
    res.json(ret);
  } catch (error) {
    next(error);
  }
}


export { apiVideoControl, apiVideoConfig, apiGetVideoState, wsGetVideoState, apiRecording, apiResolutionChange,apiSnapshot, apiEdidInfo,  apiEdidSet};
