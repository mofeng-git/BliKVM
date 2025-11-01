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

// Modules that can emit notifications
const NotificationModule = Object.freeze({
    GENERAL: 'general',
    KEYBOARD: 'keyboard',
    MOUSE: 'mouse',
    HID: 'hid',
    SHORTCUTS: 'shortcuts',
    ATX: 'atx',
    FAN: 'fan',
    DISPLAY: 'display',
});

class Notification {
    static _instance = null;
    ws = null;

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

    addMessage(type = NotificationType.INFO, text, module = NotificationModule.GENERAL) {
        let normalizedType = String(type || '').toLowerCase();
        const validTypes = Object.values(NotificationType);
        if (!validTypes.includes(normalizedType)) {
            logger.warn(`Unknown notification type '${type}', fallback to '${NotificationType.INFO}'`);
            normalizedType = NotificationType.INFO;
        }

        const normalizedModule = String(module || '').toLowerCase();
        const validModules = Object.values(NotificationModule);
        const finalModule = validModules.includes(normalizedModule)
            ? normalizedModule
            : NotificationModule.GENERAL;
        if (finalModule !== normalizedModule) {
            logger.warn(`Unknown notification module '${module}', fallback to '${NotificationModule.GENERAL}'`);
        }

        const message = {
            timestamp: Date.now(),
            module: finalModule,
            text: String(text ?? ''),
        };

        if (this.messages[normalizedType].length >= 10) {
            this.messages[normalizedType].shift();
        }

        this.messages[normalizedType].push(message);

        this.sendMessage();
    }

    sendMessage() {
        if (this.ws) {
            // Flatten to an array of message items: { timestamp, type, module, text }
            const messages = Object.keys(this.messages).flatMap(type => {
                return this.messages[type].map(m => ({
                    timestamp: m.timestamp,
                    type,
                    module: m.module,
                    text: m.text,
                }));
            });
            const ret = createApiObj();
            ret.type = 'notification';
            // Put all content under data; front-end treats arrival as new
            ret.data.notification = messages;
            this.ws.send(JSON.stringify(ret));
        } else {
            logger.warn('Notification WebSocket is not initialized.');
        }
    }
}

// Module-level singleton and convenience helpers
const notification = new Notification();

function notifyText(text, module = NotificationModule.GENERAL) {
    notification.addMessage(NotificationType.INFO, text, module);
}

const Notify = {
    // Generic sender with type
    send: (type, text, module = NotificationModule.GENERAL) => notification.addMessage(type, text, module),
    // Shorthands
    info: (text, module = NotificationModule.GENERAL) => notification.addMessage(NotificationType.INFO, text, module),
    warning: (text, module = NotificationModule.GENERAL) => notification.addMessage(NotificationType.WARNING, text, module),
    error: (text, module = NotificationModule.GENERAL) => notification.addMessage(NotificationType.ERROR, text, module),
    // WebSocket init passthrough
    initWebSocket: (ws) => notification.initWebSocket(ws),
};

export { NotificationType, NotificationModule, Notification, notification, Notify, notifyText };
