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
import { createApiObj } from '../common/api.js';

const logger = new Logger();

const NotificationType = Object.freeze({
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
});

class Notification {
    static _instance = null;
    ws = null;
    _newNotification = false;

    constructor() {
        if (!Notification._instance) {
            Notification._instance = this;
        }

        this.messages = {
            [NotificationType.INFO]: [],
            [NotificationType.WARNING]: [],
            [NotificationType.ERROR]: [],
        };
        return Notification._instance;
    }

    initWebSocket(ws) {
        this.ws = ws;
        this.sendMessage();  
    }

    addMessage(type, text) {
        if (!NotificationType[type.toUpperCase()]) {
            logger.error(`Invalid message type ${type}`);
            return;
        }

        const message = {
            subtitle: new Date().toLocaleString(),  
            text: text,
        };

        if (this.messages[type].length >= 10) {
            this.messages[type].shift();
        }

        this.messages[type].push(message);

        this._newNotification = true; 
        if(type === NotificationType.ERROR) {
            this.sendAlert(text);
        }
        this.sendMessage();
    }

    sendMessage() {
        if (this.ws) {
            const allMessages = Object.keys(this.messages).map(type => ({
                title: type,
                contents: this.messages[type],
            }));
            const ret = createApiObj();
            ret.data.newNotification = this._newNotification;
            ret.data.notification = allMessages;
            const jsonMessage = JSON.stringify(ret);
            this.ws.send(jsonMessage);
            this._newNotification = false;
        } else {
            logger.warn('Notification WebSocket is not initialized.');
        }
    }

    sendAlert(text) {
        if(this.ws) {
            const ret = createApiObj();
            ret.data.alert = text;
            const jsonMessage = JSON.stringify(ret);
            this.ws.send(jsonMessage);
        }
    }
}

export {NotificationType, Notification};
