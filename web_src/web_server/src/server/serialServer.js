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

import { SerialPort } from 'serialport';
import Logger from '../log/logger.js';
import { CONFIG_PATH, UTF8 } from '../common/constants.js';
import fs from 'fs';
import { NotificationType, Notification } from '../modules/notification.js';

const logger = new Logger();
let activeSerialConnections = 0;
let currentSerial = null;
let serialPath = null;
let serialBaudRate = null;

function setSerialConfig(path, baudRate) {
  serialPath = path;
  serialBaudRate = baudRate;
}

const createSerialServer = (ws) => {
  if (!serialPath || !serialBaudRate) {
    logger.error('Serial port path or baud rate not set. Please configure them first.');
    ws.send('*** Serial port path or baud rate not set. Please configure them first. ***\r\n');
    return;
  }
  const portPath = serialPath;
  const baudRate = serialBaudRate;

  // 如果已有串口连接，先关闭它
  if (currentSerial && currentSerial.isOpen) {
    logger.info(`Closing existing serial connection on ${currentSerial.path}`);
    currentSerial.close((err) => {
      if (err) {
        logger.error(`Error closing serial port: ${err.message}`);
      }
    });
  }

  const serial = new SerialPort({ path: portPath, baudRate });
  currentSerial = serial; // 更新全局串口实例

  let connectionClosed = false;

  serial.on('open', () => {
    activeSerialConnections++;
    logger.info(`Serial port ${portPath} opened. Active serial connections: ${activeSerialConnections}`);
    ws.send(`*** SERIAL PORT ${portPath} OPENED @ ${baudRate}bps ***\r\n`);
  });

  ws.on('message', (data) => {
    try {
      const obj = JSON.parse(data);
      if (obj.Op === 'stdin') {
        serial.write(obj.Data, (err) => {
          if (err) {
            logger.error(`Serial write error: ${err.message}`);
          }
        });
      }
    } catch (err) {
      logger.error(`Invalid WS message format: ${err.message}`);
    }
  });

  ws.on('close', () => {
    logger.info('Serial WebSocket closed.');
    if (serial.isOpen) {
      serial.close((err) => {
        if (err) {
          logger.error(`Error closing serial port: ${err.message}`);
        }
      });
    }
    if (currentSerial === serial) {
      currentSerial = null; // 清理全局变量
    }
  });

  serial.on('data', (data) => {
    ws.send(data.toString('utf-8'));
  });

  serial.on('close', () => {
    if (!connectionClosed) {
      activeSerialConnections--;
      connectionClosed = true;
      logger.info(`Serial connection closed. Active serial connections: ${activeSerialConnections}`);
    }
    ws.close();
  });

  serial.on('error', (err) => {
    logger.error(`Serial error: ${err.message}`);
    const notification = new Notification();
    notification.addMessage(NotificationType.ERROR, `SERIAL ERROR: ${err.message}`);
    ws.close();
  });
};

export { createSerialServer, activeSerialConnections, setSerialConfig };
