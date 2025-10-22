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

// MJPEGStreamRecorder.js
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import { createDir, getCurrentTimestamp, getHardwareType } from '../../common/tool.js';
import Logger from '../../log/logger.js';
import { spawn } from 'child_process';
import {HardwareType} from '../../common/enums.js';

const logger = new Logger();

class MJPEGStreamRecorder {
  _isRecording = false;
  _ustreamerDump = null;
  _ffmpeg = null;
  _ustreamerDumpPath = null;
  constructor() {
    if (!MJPEGStreamRecorder.instance) {
        const { video } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
        const streamUrl = `http://127.0.0.1:${video.port}/stream`;
        this.streamUrl = streamUrl; 
        this._videoRecord = video.recordPath; 
        this._ustreamerDumpPath = video.recordBin;
        this.ffmpegProcess = null;
        MJPEGStreamRecorder.instance = this;
      }
      return MJPEGStreamRecorder.instance;
  }

  recordMjepg(){
    const time = getCurrentTimestamp();
    const outputFile = `${this._videoRecord}/video_record_${time}.mkv`;
    this.ffmpegProcess = ffmpeg(this.streamUrl)
      .inputFormat('mjpeg') 
      .videoCodec('copy')  // no encode
      .on('start', (commandLine) => {
        logger.info(`Recording started with command ${commandLine}`);
        this._isRecording = true;
      })
      .on('end', () => {
        this._isRecording = false;
        resolve();
      })
      .on('error', (err) => {
        logger.warn(`Error during recording ${err.message}`);
        this._isRecording = false;
        resolve();
      })
      .save(outputFile);
  }

  startRecording() {
    return new Promise((resolve, reject) => {

      if (this._isRecording) {
        logger.warn('Recording already in progress');
        resolve();
      }

      if(!createDir(this._videoRecord) ){
        logger.error('Error creating record directory');
        reject(new Error('Error creating record directory'));
      }

      if(getHardwareType() === HardwareType.MangoPi){
        this.recordMjepg();
      }else{
        const time = getCurrentTimestamp();
        const outputFile = `${this._videoRecord}/video_record_${time}.mp4`;
    
        this._ustreamerDump = spawn(this._ustreamerDumpPath, ['--sink', 'demo::ustreamer::h264', '--output', '-']);

        // 启动 ffmpeg 进程
        this._ffmpeg = spawn('ffmpeg', ['-use_wallclock_as_timestamps', '1', '-i', 'pipe:0', '-c:v', 'copy', outputFile]);
  
        // 将 ustreamer-dump 的输出通过管道传递给 ffmpeg
        this._ustreamerDump.stdout.pipe(this._ffmpeg.stdin);
  
        this._ustreamerDump.stderr.on('data', (data) => {
          logger.error(`ustreamer-dump stderr: ${data}`);
        });
  
        this._ffmpeg.stderr.on('data', (data) => {
          logger.warn(`ffmpeg stderr: ${data}`);
        });
  
        this._ustreamerDump.on('close', (code) => {
          logger.info(`ustreamer-dump process exited with code ${code}`);
        });
  
        this._ffmpeg.on('close', (code) => {
          logger.info(`ffmpeg process exited with code ${code}`);
          this._isRecording = false; // 设置录制状态为 false
          resolve();
        });
  
        this._isRecording = true; // 设置录制状态为 true
        logger.info('Recording started');
      }

    });
  }


  stopRecording() {
    return new Promise((resolve) => {
      if (!this._isRecording) {
        logger.warn('Not recording');
        resolve(); 
      }
      if( getHardwareType() === HardwareType.MangoPi){
        if (this.ffmpegProcess) {
          this.ffmpegProcess.on('exit', () => {
              logger.info('ffmpeg process exited');
              this._isRecording = false;
              resolve();
          });
          this.ffmpegProcess.kill('SIGKILL'); // 停止 ffmpeg 进程
        } else {
          this._isRecording = false;
          resolve();
        }
      }else{
        if (this._ustreamerDump) {
          this._ustreamerDump.on('exit', () => {
            logger.info('ustreamer-dump process exited');
            this._isRecording = false; // 设置录制状态为 false
            resolve();
          });
          this._ustreamerDump.kill('SIGINT');
        }
  
        if (this._ffmpeg) {
          this._ffmpeg.on('exit', () => {
            logger.info('ffmpeg process exited');
            this._isRecording = false; // 设置录制状态为 false
            resolve();
          });
          this._ffmpeg.kill('SIGINT');
        }
      }

    });
  }  
}

export default MJPEGStreamRecorder;
