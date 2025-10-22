
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

import {RateLimitedMouse} from './mouse.js'
function handleWSMessage( event, store ){

    const message = JSON.parse(event);

    if(message.version != null){
      store.webversion = message.version;
    }
    if (message.data.mouseStatus != null) {
      store.mouseStatus = message.data.mouseStatus;
    }
    if (message.data.keyboardStatus != null) {
      store.keyboardStatus = message.data.keyboardStatus;
    }
    if(message.data.hidStatus != null){
      if(message.data.hidStatus.mouseMode === 'dual'){
        store.mouseMode = 'dual';
      }else if(message.data.hidStatus.mouseMode === 'absolute'){
        store.mouseMode = 'absolute';
        store.absoluteMode = true;
        RateLimitedMouse.setMode(true);
      }else if(message.data.hidStatus.mouseMode === 'relative'){  
        store.mouseMode = 'relative';
        store.absoluteMode = false;
        RateLimitedMouse.setMode(false);
      }
      store.hidEnable = message.data.hidStatus.enable;
      store.mouseJiggler = message.data.hidStatus.mouseJiggler;
    }
    if( message.data.pong != null){
      let timestamp=new Date().getTime();
      let delay = (timestamp - message.data.pong)/2;
      store.LatencyMS = Math.round(delay*100)/100;
    }
    if( message.data.systemInfo != null){
      store.cpuLoad = message.data.systemInfo.cpuLoad;
      store.uptime = message.data.systemInfo.uptime;
      store.temperature = message.data.systemInfo.temperature;
    }
    if( message.data.videoStatus != null ){
      store.resolutionWidth = message.data.videoStatus.width;
      store.resolutionHeight = message.data.videoStatus.height;
      store.capturedFps = message.data.videoStatus.capturedFps;
      store.queuedFps = message.data.videoStatus.capturedFps;
    }
    if( message.data.notification != null ){
      store.notification = message.data.notification;
      store.newNotification = message.data.newNotification;
    }
    if( message.data.alert != null ){
      store.alert = message.data.alert;
      store.newAlert = true;
      console.log(store.alert,  store.newAlert);
    }
    if( message.data.atxStatus != null ){
      store.ledPwr = message.data.atxStatus.ledPwr;
      store.ledHDD = message.data.atxStatus.ledHDD;
    }
}

function sendPing(ws){
  let timestamp=new Date().getTime();
  ws.send(JSON.stringify({ping:timestamp}));
}

export {handleWSMessage, sendPing};