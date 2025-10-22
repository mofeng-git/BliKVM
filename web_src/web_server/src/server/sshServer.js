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

import { Client as SSHClient } from "ssh2";
import Logger from '../log/logger.js';
import { CONFIG_PATH, UTF8 } from '../common/constants.js';
import fs from 'fs';
import {NotificationType, Notification } from '../modules/notification.js';

const logger = new Logger();
let activeSSHConnections = 0;


const createSshServer = (ws) => {
  const { server } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
  const serverInfo = {
    host: '0.0.0.0',
    port: 22,
    username: server.sshUser,
    password: server.sshPassword,
  };

  const ssh = new SSHClient();
  let connectionClosed = false;

  ssh.on("ready", () => {
    activeSSHConnections++; 
    ws.send("*** SSH CONNECTION ESTABLISHED ***\r\n");
    logger.info("SSH connection established.");

    ssh.shell({ term: 'xterm' }, (err, stream) => {
      if (err) {
        return ws.emit("\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n");
      }

      ws.on("message", (data) => {
        const obj = JSON.parse(data);

        if (obj.Op === "resize") {
          stream.setWindow(obj.Rows, obj.Cols);
        } else if (obj.Op === "stdin") {
          stream.write(obj.Data);
        }
      });

      ws.on("close", () => {
        logger.info("SSH WebSocket closed.");
        ssh.end();
      });

      stream.on("data", (data) => {
        ws.send(data.toString("utf-8"));
      }).on("close", () => {
        ssh.end();
      });
    });
  }).on("close", () => {
    if (!connectionClosed) {
      activeSSHConnections--; // 减少连接计数
      connectionClosed = true; // 标记连接已关闭
      logger.info(`SSH connection closed. Active connections: ${activeSSHConnections}`);
    }
    ws.close();
  }).on("error", (err) => {
    logger.error(`\r\n*** SSH CONNECTION ERROR: ${err.message} ***\r\n`);
    const notification = new Notification();
    notification.addMessage(NotificationType.ERROR, `SSH CONNECTION ERROR: ${err.message}`);
    ws.close();
  }).on("end", () => {
    if (!connectionClosed) {
      activeSSHConnections--; // 减少连接计数
      connectionClosed = true; // 标记连接已关闭
      logger.info(`SSH connection end. Active connections: ${activeSSHConnections}`);
    }
    ws.close();
  })
  .connect(serverInfo);
};

export  { createSshServer, activeSSHConnections };
