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
 * This module defines the HTTP and WebSocket API server.
 * @module api/http_api/http_api
 */

import http from 'http';
import https from 'https';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Logger from '../log/logger.js';
import fs from 'fs';
import routes from './api/routes.js';
import { WebSocketServer, WebSocket } from 'ws';
import Mouse from './mouse.js';
import Keyboard from './keyboard.js';
import { ApiCode, createApiObj } from '../common/api.js';
import { CONFIG_PATH, UTF8, JWT_SECRET } from '../common/constants.js';
import { fileExists, processPing, getSystemInfo } from '../common/tool.js';
import path from 'path';
import { apiGetAuthState, apiLogin } from './api/login.route.js';
import jwt from 'jsonwebtoken';
import HID from '../modules/kvmd/kvmd_hid.js';
import { wsGetVideoState } from './api/video.route.js';
import startTusServer from './tusServer.js';
import { createSshServer, activeSSHConnections } from './sshServer.js';
import { NotificationType, Notification } from '../modules/notification.js';
import ATX from '../modules/kvmd/kvmd_atx.js';
import { createProxyMiddleware } from 'http-proxy-middleware';
import httpProxy from 'http-proxy';
import { PrometheusMetrics, BasicAuthObj } from './prometheus.js';
import { createSerialServer } from './serialServer.js';

const logger = new Logger();

/**
 * Represents the state of the HTTP API.
 * @enum {string}
 */
const HttpServerState = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
};

function getRootPath() {
  let rootPath;
  if (process.env.NODE_ENV === 'development') {
    const { server } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    rootPath = server.rootPath;
  } else {
    rootPath = __dirname;
  }
  return rootPath;
}

let G_AuthState = true;

/**
 * Represents an HTTP API server.
 * @class
 * @property {HttpServerState} state - The state of the HTTP API.
 */
class HttpServer {
  /**
   * Represents the singleton instance of the HttpServer class.
   * @type {HttpServer}
   * @private
   */
  static _instance = null;

  /**
   * The name of the HTTP API.
   * @type {string}
   * @private
   */
  _name = 'httpServer';

  /**
   * Https server instance.
   * @type {Server<Request, Response>}
   * @private
   */
  _server = null;
  _httpsServerPort = 443;

  /**
   * Https server instance.
   * @type {Server<Request, Response>}
   * @private
   */
  _httpServer = null;
  _httpServerPort = 80;

  _protocol = 'https';

  /**
   * WebSocket server instance.
   * @type {WebSocketServer}
   * @private
   */
  _wss = null;

  _wsTerminal = null;

  /**
   * Represents the options for the HTTP API.
   * @type {Object}
   * @private
   */
  _option = null;

  /**
   * Represents the state of the HttpServer.
   * @type {HttpServerState}
   * @private
   */
  _state = HttpServerState.STOPPED;

  /**
   * Represents the HttpServer class.
   * @constructor
   */
  constructor() {
    if (!HttpServer._instance) {
      HttpServer._instance = this;
      this._init();
    }

    return HttpServer._instance;
  }

  /**
   * Get the state of the HTTP API.
   * @returns {HttpServerState} The state of the HTTP API.
   * @private
   */
  get state() {
    return this._state;
  }

  /**
   * Setter for the state property.
   * @param {HttpServerState} value - The new value for the state.
   * @private
   */
  set state(value) {
    this._state = value;
  }

  /**
   * Starts the HTTP service.
   * @returns {Promise<Object>} A promise that resolves to an object containing the service name, port, and message.
   * @property {string} name - The name of the service.
   * @property {number} port - The port number of the service.
   * @property {string} msg - The message describing the state of the service.
   */
  startService() {
    return new Promise((resolve, reject) => {
      this._state = HttpServerState.STARTING;
      if (this._protocol === 'https') {
        this._server.listen(this._httpsServerPort, () => {
          logger.info(
            `Https Api started at https://localhost:${this._httpsServerPort}, state: ${this._state}`
          );
          logger.info(
            `WebSocket Api started at ws://localhost:${this._httpsServerPort}, state: ${this._state}`
          );
          resolve('ok');
        });
        this._httpServer.listen(this._httpServerPort, () => {
          this._state = HttpServerState.RUNNING;
        });
      } else {
        this._server.listen(this._httpServerPort, () => {
          this._state = HttpServerState.RUNNING;
          logger.info(
            `Http Api started at http://localhost:${this._httpServerPort}, state: ${this._state}`
          );
          logger.info(
            `WebSocket Api started at ws://localhost:${this._httpServerPort}, state: ${this._state}`
          );
          resolve('ok');
        });
      }

    });
  }

  /**
   * Closes the HTTP API service.
   * @returns {Promise<Object>} A promise that resolves to an object containing the service name, port, and message.
   * @property {string} name - The name of the service.
   * @property {number} port - The port number of the service.
   * @property {string} msg - The message describing the state of the service.
   */
  closeService() {
    return new Promise((resolve, reject) => {
      this._state = HttpServerState.STOPPING;

      const wsClientNumber = this._wss.clients.size;
      this._wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });

      const checkClose = () => {
        if (wsClientNumber <= 0) {
          this._server.close(() => {
            this._state = HttpServerState.STOPPED;
            logger.info(
              `Http Api closed at http://localhost:${this._httpsServerPort}, state: ${this._state}`
            );
            logger.info(
              `WebSocket Api closed at ws://localhost:${this._httpsServerPort}, state: ${this._state}`
            );
            resolve('ok');
          });
        } else {
          setTimeout(checkClose, 100);
        }
      };

      checkClose();
    });
  }

  _ipWhitelistMiddleware(IP_WHITELIST) {
    return (req, res, next) => {
      let clientIp = req.ip || req.connection.remoteAddress;
      if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.replace('::ffff:', '');
      }
      if (IP_WHITELIST.includes(clientIp)) {
        next();
      } else {
        logger.warn(`IP ${clientIp} is not allowed to access this server.`);
        res.status(403).json({ error: 'Forbidden' });
      }
    };
  }

  /**
   * Initializes the HTTP API server.
   * @private
   */
  _init() {
    const { server, video, msd } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._protocol = server.protocol;
    this._httpsServerPort = server.https_port;
    this._httpServerPort = server.http_port;
    G_AuthState = server.auth;
    const app = express();

    if (server.ipWhite.enable === true) {
      const IP_WHITELIST = server.ipWhite.list;
      app.use(this._ipWhitelistMiddleware(IP_WHITELIST));
    }

    app.use(
      cors({
        origin: true,
        credentials: true
      })
    );
    app.use(bodyParser.json());
    app.use(express.static(path.join(getRootPath(), 'dist')));
    app.use(express.text());

    app.use('/video', createProxyMiddleware({
      target: `http://127.0.0.1:${video.port}`,
      changeOrigin: true,
      secure: false,
    }));

    app.use('/tus', createProxyMiddleware({
      target: `http://127.0.0.1:${msd.tusPort}`,
      changeOrigin: false,
      secure: false,
      on: {
        proxyReq: (proxyReq, req, res) => {
          proxyReq.setHeader('X-Forwarded-Proto', this._protocol);
        },
      },
    }));

    const janus_server = server.protocol === 'http' ? 'http://127.0.0.1:8188' : 'https://127.0.0.1:8989';
    this._proxy = httpProxy.createProxyServer({
      target: janus_server, // Janus server address
      ws: true,
      changeOrigin: true,
      secure: false,
    });

    app.post('/api/login', apiLogin);
    app.get('/api/auth/state', apiGetAuthState);

    const PrometheusMetricsObj = new PrometheusMetrics();
    app.get('/api/metrics', BasicAuthObj, async (req, res) => {
      res.set('Content-Type', PrometheusMetricsObj._register.contentType);
      res.end(await PrometheusMetricsObj.getMetrics());
    });

    if (server.auth === true) {
      app.use(this._httpVerityMiddle);
    }

    app.use(this._httpRecorderMiddle);
    startTusServer();  // start tus server
    routes.forEach((route) => {
      if (route.method === 'get') {
        app.get(route.path, route.handler);
      } else if (route.method === 'post') {
        app.post(route.path, route.handler);
      } else if (route.method === 'delete') {
        app.delete(route.path, route.handler);
      }
    });

    app.use(this._httpErrorMiddle);

    app.get('*', this._otherRoute);

    //start http or https server

    if (server.protocol === 'http') {
      this._server = http.createServer(app);
    } else {

      this._server = https.createServer({
        key: fs.readFileSync(server.ssl.key),
        cert: fs.readFileSync(server.ssl.cert)
      }, app);

      this._httpServer = http.createServer((req, res) => {
        const host = req.headers.host.replace(/:\d+$/, `${this._httpsServerPortps}`);
        res.writeHead(301, { Location: `https://${host}${req.url}` });
        res.end();
      });

    }

    this._httpServerEvents();

    this._wss = new WebSocketServer({
      noServer: true
    });

    this._wsTerminal = new WebSocketServer({
      noServer: true
    });

    this._wsSerial = new WebSocketServer({
      noServer: true
    });

    this._wss.on('connection', this._websocketServerConnectionEvent.bind(this));

    this._wsTerminal.on('connection', (ws) => {
      createSshServer(ws);
    });

    this._wsSerial.on('connection', (ws, req) => {
      console.log("serial connection");
      createSerialServer(ws);
    });

    this._server.on('upgrade', (request, socket, head) => {

      const url = new URL(request.url, `http://${request.headers.host}`);
      const pathname = url.pathname;

      if (server.auth === true) {
        const token = url.searchParams.get('token');
        jwt.verify(token, JWT_SECRET, (err, user) => {
          if (err) {
            logger.error('invalid wss token');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
          }
          if (pathname === '/wss') {
            this._wss.handleUpgrade(request, socket, head, (ws) => {
              this._wss.emit('connection', ws, request);
            });
          } else if (pathname === '/ssh') {
            this._wsTerminal.handleUpgrade(request, socket, head, (ws) => {
              this._wsTerminal.emit('connection', ws, request);
            });
          } else if (pathname === '/janus') {
            this._proxy.ws(request, socket, head);
          } else if (pathname === '/serial') {
            this._wsSerial.handleUpgrade(request, socket, head, (ws) => {
              this._wsSerial.emit('connection', ws, request);
            });
          }
          else {
            socket.destroy();
          }

        });
      } else {
        if (pathname === '/wss') {
          this._wss.handleUpgrade(request, socket, head, (ws) => {
            this._wss.emit('connection', ws, request);
          });
        } else if (pathname === '/ssh') {
          this._wsTerminal.handleUpgrade(request, socket, head, (ws) => {
            this._wsTerminal.emit('connection', ws, request);
          });
        } else if (pathname === '/janus') {
          this._proxy.ws(request, socket, head);
        }
        else if (pathname === '/serial') {
          this._wsSerial.handleUpgrade(request, socket, head, (ws) => {
            this._wsSerial.emit('connection', ws, request);
          });
        } else {
          socket.destroy();
        }
      }
    });
  }

  _otherRoute(req, res) {
    try {
      const distDir = `${getRootPath()}/dist`;
      if (req.url === '/') {
        res.sendFile(`${distDir}/index.html`);
        return;
      }
      const path = distDir + req.url;
      if (fileExists(path)) {
        logger.info(`path:${path}`);
        res.sendFile(path);
      } else {
        res.sendFile(`${distDir}/index.html`);
      }
    } catch (err) {
      logger.error(`route[*]: ${err.message}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Handles a WebSocket connection.
   * @param {WebSocket} ws - The WebSocket connection.
   * @param {http.IncomingMessage} req - The HTTP request object.
   * @private
   */
  _websocketServerConnectionEvent(ws, req) {
    try {
      const notification = new Notification();
      notification.initWebSocket(ws);

      logger.info(`WebSocket Client connected, total clients: ${this._wss.clients.size}`);

      const mouse = new Mouse();
      const keyboard = new Keyboard();
      const hid = new HID();
      const atx = new ATX();
      const heartbeatInterval = setInterval(async () => {
        if (ws.readyState === WebSocket.OPEN) {
          const systemInfo = await getSystemInfo();
          const ret = createApiObj();
          ret.data.type = 'heartbeat';
          ret.data.timestamp = new Date().toISOString();
          ret.data.serverStatus = this._state;
          ret.data.mouseStatus = mouse.getStatus();
          ret.data.keyboardStatus = keyboard.getStatus();
          ret.data.hidStatus = hid.getStatus();
          ret.data.systemInfo = systemInfo;
          ret.data.videoStatus = await wsGetVideoState();
          ret.data.atxStatus = atx.getATXState();
          ret.data.clientsConnected = this._wss.clients.size;
          ret.data.activeSSHConnections = activeSSHConnections;
          ws.send(JSON.stringify(ret));
        }
      }, 2000);

      ws.on('message', (message) => {
        const obj = JSON.parse(message);
        const keys = Object.keys(obj);
        if (keys.includes('m')) {
          mouse.handleEvent(obj.m);
        } else if (keys.includes('k')) {
          keyboard.handleEvent(obj.k);
        } else if (keys.includes('ping')) {
          processPing(ws, obj.ping);
        }
      });

      ws.on('close', () => {
        clearInterval(heartbeatInterval);
        logger.info(`WebSocket Client disconnected, total clients: ${this._wss.clients.size}`);
      });
    } catch (err) {
      logger.error(`Error handling Websocket request: ${err.message}`);
      const ret = createApiObj();
      ret.code = ApiCode.INTERNAL_SERVER_ERROR;
      ret.msg = err.message;
      ws.send(JSON.stringify(ret));
      ws.close();
    }
  }

  /**
   * Handles server errors and sets the appropriate state, error code, and error message.
   * @private
   */
  _httpServerEvents() {
    this._server.on('error', (error) => {
      logger.error(`Http Server error: ${error.message}`);
    });
  }

  /**
   * Records HTTP requests and logs them using the logger.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   * @param {Function} next - The next middleware function.
   * @private
   */
  _httpRecorderMiddle(req, res, next) {
    if (req.url === '/main' || req.url === '/terminal') {
      next();
      return;
    }
    const requestType = req.method;
    const requestUrl = req.url;
    if (G_AuthState === true) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const username = decoded.username;
      logger.info(`http api request ${requestType} ${requestUrl} by ${username}`);
    } else {
      logger.info(`http api request ${requestType} ${requestUrl}`);
    }

    next();
  }

  /**
   * Verifies the key or OTP provided in the request body against the stored data.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   * @private
   */
  _httpVerityMiddle(req, res, next) {
    if (req.url === '/main' || req.url === '/terminal') {
      next();
      return;
    }
    const returnObject = createApiObj();
    returnObject.code = ApiCode.INVALID_CREDENTIALS;

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.error(`token is null:${req.url}`);
      returnObject.msg = 'token is null!';
      res.status(401).json(returnObject);
      return;
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logger.error('invalid token');
        returnObject.msg = 'invalid token';
        res.status(401).json(returnObject);
        return;
      }
      next();
    });
  }

  /**
   * Handles HTTP errors and sends an error response with status code 500.
   * @param {Error} err - The error object.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   * @param {Function} next - The next middleware function.
   * @private
   */
  _httpErrorMiddle(err, req, res, next) {
    logger.error(`Error handling HTTP request: ${err}`);
    const notification = new Notification();
    notification.addMessage(NotificationType.ERROR, `Error handling HTTP request: ${err}`);
    const ret = createApiObj();
    ret.code = ApiCode.INTERNAL_SERVER_ERROR;
    ret.msg = err.message;
    res.status(500).json(ret);
  }
}
export default HttpServer;
export { HttpServerState };
