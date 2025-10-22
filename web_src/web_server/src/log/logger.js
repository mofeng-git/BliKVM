
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
/**
 * This module defines the logger class that logs messages to multiple loggers.
 * @module log/logger
 */

import log4js from 'log4js';
import fs from 'fs';
import { CONFIG_PATH } from '../common/constants.js';
import {defaultConfig} from '../modules/update/app_default_config.js';

/**
 * Represents a logger that logs messages to multiple loggers.
 * @class
 */
class Logger {
  /**
   * The singleton instance of the logger.
   * @type {Logger|null}
   * @private
   */
  static _instance = null;

  /**
   * Array containing all the loggers.
   * @type {Array}
   * @private
   */
  _loggers = [];

  /**
   * Logger constructor.
   * @constructor
   */
  constructor() {
    if (!Logger._instance) {
      Logger._instance = this;
      this._init();
    }

    return Logger._instance;
  }

  /**
   * Traces a message to all loggers.
   * @param {string} message - The message to be traced.
   */
  trace(message) {
    this._loggers.forEach((logger) => {
      logger.trace(message);
    });
  }

  /**
   * Logs a debug message.
   * @param {string} message - The message to be logged.
   */
  debug(message) {
    this._loggers.forEach((logger) => {
      logger.debug(message);
    });
  }

  /**
   * Logs an informational message.
   * @param {string} message - The message to be logged.
   */
  info(message) {
    this._loggers.forEach((logger) => {
      logger.info(message);
    });
  }

  /**
   * Logs a warning message.
   * @param {string} message - The warning message to be logged.
   */
  warn(message) {
    this._loggers.forEach((logger) => {
      logger.warn(message);
    });
  }

  /**
   * Logs an error message.
   * @param {string} message - The error message to be logged.
   */
  error(message) {
    this._loggers.forEach((logger) => {
      logger.error(message);
    });
  }

  /**
   * Logs a fatal error message.
   * @param {string} message - The error message to log.
   */
  fatal(message) {
    this._loggers.forEach((logger) => {
      logger.fatal(message);
    });
  }

  /**
   * Initializes the logger.
   * @private
   */
  _init() {

    let log;
    if(fs.existsSync(CONFIG_PATH) === false){
      log = defaultConfig.log;
    }else{
      const configFile = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      log = configFile.log;
    }

    if (!log.console.enabled && !log.file.enabled) {
      return;
    }

    const config = {
      appenders: {
        console: {
          type: 'console'
        }
      },
      categories: {
        default: {
          appenders: ['console'],
          level: 'trace'
        }
      }
    };

    if (log.console.enabled) {
      config.categories.console = {
        appenders: ['console'],
        level: log.console.level
      };
    }

    if (log.file.enabled) {
      config.appenders.file = {
        type: 'file',
        filename: log.file.fileName,
        flags: log.file.flags,
        maxLogSize: log.file.maxLogSize * 1024 * 1024,
        backups: log.file.backups
      };
      config.categories.file = {
        appenders: ['file'],
        level: log.file.level
      };
    }

    log4js.configure(config);

    if (log.console.enabled) {
      this._loggers.push(log4js.getLogger('console'));
    }
    if (log.file.enabled) {
      this._loggers.push(log4js.getLogger('file'));
    }
  }
}

export default Logger;
