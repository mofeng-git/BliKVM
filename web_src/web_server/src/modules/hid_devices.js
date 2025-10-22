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

import Logger from '../log/logger.js';
import fs from 'fs';
import { CONFIG_PATH, UTF8 } from '../common/constants.js';
import { constants } from 'fs';
import Queue from '../common/queue.js';
import { isDeviceFile } from '../common/tool.js';

const logger = new Logger();

class HIDDevice{
    static _instance = null;
    _onlineStatus = true;
    _lastUserInteraction;
    _devicePath = '';
    eventQueue = new Queue();
    isProcessing = false;
    isClosing = false;
    _fd = null;
    _timeDiff = 5; //uint: ms

    writeToQueue(data) {
        this.eventQueue.enqueue(data);
    }

    readData() {
        return new Promise((resolve) => {
            if (this.eventQueue.isEmpty()) {
                resolve(null);
            } else {
                const data = this.eventQueue.dequeue();
                this._writeData(data);
                resolve();
            }
        });
    }

    async startWriteToHid() {
        while (true) {
            while (!this.eventQueue.isEmpty()) {
                await this.readData();
                await new Promise(resolve => setTimeout(resolve, this._timeDiff));
            }

            await new Promise((resolve) => this.eventQueue.once('data', resolve));
        }
    }

    open() {
        return new Promise((resolve, reject) => {
            if (this._fd !== null) {
                logger.warn(`File ${this._devicePath} already opened fd ${this._fd}`);
                resolve(this._fd);
                return;
            }
            if( isDeviceFile(this._devicePath) === false) {
                return;
            }
            logger.info(`Opening file ${this._devicePath}`);
            fs.open(this._devicePath, constants.O_WRONLY | constants.O_NONBLOCK, (err, fd) => {
                if (err) {
                    logger.error(`Error opening file: ${err}`);
                    this._onlineStatus = false;
                    reject(err);  // Reject promise if file opening fails
                    return;
                }
                this._fd = fd;
                logger.info(`File ${this._devicePath} opened fd ${this._fd}`);
                resolve(fd);  // Resolve promise with the file descriptor if file opens successfully
            });
        });
    }

    close() {
        this.isClosing = true;
        const checkAndClose = () => {
            if (this.isProcessing) {
                setTimeout(checkAndClose, 10);
            } else {
                if (this._fd) {
                    try {
                        fs.closeSync(this._fd);
                        logger.warn(`File ${this._devicePath} closed`);
                        this._fd = null;
                        this.isClosing = false;
                    } catch (err) {
                        logger.error(`Error closing file: ${err}`);
                    }
                }
            }
        };
        checkAndClose();
    }

    updateUserInteraction() {
        this._lastUserInteraction = Date.now();
    }

    handleEvent(event) {
        throw new Error('must overwrite by children class');
    }

    _writeData(data) {
        if (this.isClosing) {
            return;
        }

        if (this._fd !== null) {
            const dataBuffer = Buffer.from(data);
            // if(this._devicePath === '/dev/hidg0') {
            //     logger.info(`Writing to ${this._devicePath} data:${data}`);
            // }   
            fs.write(this._fd, dataBuffer, (err, written) => {
                if (err) {
                    this._onlineStatus = false;
                    logger.warn(`Error writing to ${this._devicePath} data:${data} ${err}`);
                } else {
                    this._onlineStatus = true;
                }
            });
        }
    }

    getStatus() {
        return this._onlineStatus;
    }
}

export default HIDDevice;
