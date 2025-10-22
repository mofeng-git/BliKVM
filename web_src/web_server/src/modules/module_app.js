
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
import Module from './module.js';
import { ModuleState } from '../common/enums.js';
import { spawn } from 'child_process';
import Logger from '../log/logger.js';

const logger = new Logger();

const ModuleAppStateCode = {
  OK: 'OK',
  START_FAILED: 'START_FAILED'
};

class ModuleApp extends Module {
  _bin = null;

  _param = [];

  _app = null;

  _error = ModuleAppStateCode.OK;

  _errorMsg = '';

  _ManualStop = false;

  startService() {
    return new Promise((resolve, reject) => {
      const { checkResult, checkMessage } = this._startServiceCheck();

      const result = { name: this._name, msg: '' };

      if (checkResult === false) {
        result.msg = checkMessage;
        reject(result);
        return;
      }

      // this._app = this._param ? spawn(this._bin, this._param) : spawn(this._bin);
      // console.log("para:", this._param);
      this._app = spawn(this._bin, this._param, {
        detached: false
      });

      this._app.stdout.on('data', (data) => {
        logger.trace(`${this._name} API stdout: ${data}`);
      });

      this._app.stderr.on('data', (data) => {
        logger.trace(`${this._name} API stderr: ${data}`);
      });

      this._app.on('error', (err) => {
        logger.error(`${this._name} API error: ${err.message}`);
        this._state = ModuleState.ERROR;
        this._error = ModuleAppStateCode.START_FAILED;
        this._errorMsg = err.message;
        result.msg = err.message;
        reject(result);
      });
      this._app.on('exit', (code, signal) => {
        logger.info(`${this._name} API exited with code ${code} and signal ${signal}`);
      });
      this._app.on('close', (code, signal) => {
        this._state = ModuleState.STOPPED;
        logger.info(`${this._name} API closed with code ${code} and signal ${signal}`);
        if (this._ManualStop === false) {
          //为了避免递归调用导致的栈溢出，这里使用setTimeout
          setTimeout(() => {
            this.startService().catch((err) => {
              logger.error(`Failed to restart ${this._name} API: ${err.msg}`);
            });
          }, 1000); 
        }
        if (code === 1) {
          this._state = ModuleState.ERROR;
          this._error = ModuleAppStateCode.START_FAILED;
          this._errorMsg = 'input param not enough';
          result.msg = 'input param not enough';
          reject(result);
        }
      });
      
      process.on('exit', () => {
        if (this._app) {
          this._app.kill('SIGTERM'); // 发送 SIGTERM 终止子进程
        }
      });

      this._state = ModuleState.STARTING;
      setTimeout(() => {
        if (this._state === ModuleState.ERROR || this._state === ModuleState.STOPPED) {
          return;
        }
        this._state = ModuleState.RUNNING;
        this._ManualStop = false;
        logger.info(`${this._name} API started, state: ${this._state}`);
        resolve(result);
      }, 200);
    });
  }

  closeService() {
    return new Promise((resolve, reject) => {
      const { checkResult, checkMessage } = this._closeServiceCheck();

      const result = { name: this._name, msg: '' };

      if (checkResult === false) {
        result.msg = checkMessage;
        reject(result);
        return;
      }

      this._app.kill('SIGTERM');
      this._state = ModuleState.STOPPING;
      this._ManualStop = true;
      const startTime = Date.now();

      const checkState = () => {
        if (this._state === ModuleState.STOPPED) {
          resolve(result);
        } else {
          const currentTime = Date.now();
          if (currentTime - startTime > 3000) {
            logger.error(`${this._name}  API error : close timeout`);
            result.msg = `${this._name} API close timeout`;
            reject(result);
          } else {
            setTimeout(checkState, 200);
          }
        }
      };

      checkState();
    });
  }

  _startServiceCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case ModuleState.STARTING:
        checkMessage = `${this._name} API is starting, please wait.`;
        break;
      case ModuleState.RUNNING:
        checkMessage = `${this._name} API is running.`;
        break;
      case ModuleState.STOPPING:
        checkMessage = `${this._name} API is stopping, please wait.`;
        break;
      case ModuleState.STOPPED:
        checkResult = true;
        break;
      case ModuleState.ERROR:
        switch (this._error) {
          case ModuleAppStateCode.START_FAILED:
            checkResult = true;
            break;
        }
        break;
    }

    return {
      checkResult,
      checkMessage
    };
  }

  _closeServiceCheck() {
    let checkResult = false;
    let checkMessage = '';

    switch (this._state) {
      case ModuleState.STARTING:
        checkMessage = `${this._name} API is starting, please wait.`;
        break;
      case ModuleState.RUNNING:
        checkResult = true;
        break;
      case ModuleState.STOPPING:
        checkMessage = `${this._name} API is stopping, please wait.`;
        break;
      case ModuleState.STOPPED:
        checkMessage = `${this._name} API is stopped`;
        break;
      case ModuleState.ERROR:
        switch (this._error) {
          case ModuleAppStateCode.START_FAILED:
            checkMessage = `${this._name} API in error state: ${this._errorMsg}`;
            break;
        }
        break;
    }

    return {
      checkResult,
      checkMessage
    };
  }
}

export default ModuleApp;
