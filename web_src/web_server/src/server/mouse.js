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
 * This module defines the mouse event handler.
 * @module api/http_api/mouse
 */

import Logger from '../log/logger.js';
import { isDeviceFile } from '../common/tool.js';
import fs from 'fs';
import { CONFIG_PATH, UTF8 } from '../common/constants.js';
import  HIDDevice  from '../modules/hid_devices.js';
import MouseBase from '../modules/mouse_base.js';

const logger = new Logger();

class Mouse {
  _jigglerActive = false;
  _jigglerTimeDiff = 60000;  //uint: ms
  _isAbsoluteMode = true;
  _absMouse = null;
  _relMouse = null;
  _lastUserInteraction = 0;
  constructor() {
    if (!Mouse._instance) {
      this._init();
      Mouse._instance = this;
    }
    return Mouse._instance;
  }

  _init() {
    const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._mouseMode = hid.mouseMode;
    if(this._mouseMode === 'dual') {
      this._absMouse = new MouseBase('/dev/hidg1');
      this._relMouse = new MouseBase('/dev/hidg2');
    }else if( this._mouseMode === 'absolute') {
      this._absMouse = new MouseBase('/dev/hidg1');
    }else if( this._mouseMode === 'relative') {
      this._relMouse = new MouseBase('/dev/hidg1');
    }
    this._jigglerActive = hid.mouseJiggler;
    this._jigglerTimeDiff = hid.jigglerInterval*1000; //ms==>s
    this._lastUserInteraction = Date.now(); 
    this._jigglerLoop();
  }

  open() {
    if(this._absMouse) {
      this._absMouse.open();
    }
    if(this._relMouse) {
      this._relMouse.open();
    }
  }

  close() {
    if(this._absMouse) {
      this._absMouse.close();
    }
    if(this._relMouse) {
      this._relMouse.close();
    }
  }

  /**
   * Handles the mouse event and writes the data to /dev/hidg1.
   * @param {MouseEvent} event - The mouse event object.
   */
  handleEvent(event) {

    this._lastUserInteraction = Date.now();
    const {
      buttons,
      relativeX,
      relativeY,
      verticalWheelDelta,
      horizontalWheelDelta,
      isAbsoluteMode,
      sensitivity
    } = event;
    let data = null;
    if (isAbsoluteMode === true) {
      data = this._prepareAbsoluteMouseEvent(
        buttons,
        relativeX,
        relativeY,
        verticalWheelDelta,
        horizontalWheelDelta
      );
      this._isAbsoluteMode = true;
      if(this._absMouse){
        this._absMouse.write(data);
      }
    } else {
      data = this._prepareRelativeMouseEvent(
        buttons,
        relativeX,
        relativeY,
        verticalWheelDelta,
        horizontalWheelDelta,
        sensitivity
      );
      this._isAbsoluteMode = false;
      if(this._relMouse){
        this._relMouse.write(data);
      }
    }
  }

  getStatus(){
    if(this._isAbsoluteMode === true && this._mouseMode !== 'relative' && this._absMouse){ 
      return this._absMouse.getStatus();
    }else if( this._relMouse){
      return this._relMouse.getStatus();
    }else{
      return null;
    }
  }

  /**
   * Prepares a relative mouse event buffer based on the provided parameters.
   * @param {number} buttons - The button state of the mouse.
   * @param {number} movementX - The relative X movement of the mouse.
   * @param {number} movementY - The relative Y movement of the mouse.
   * @param {number} verticalWheelDelta - The vertical wheel delta of the mouse.
   * @param {number} horizontalWheelDelta - The horizontal wheel delta of the mouse.
   * @returns {Buffer} - The relative mouse event buffer.
   * @private`
   */
  _prepareRelativeMouseEvent(
    buttons,
    movementX,
    movementY,
    verticalWheelDelta,
    horizontalWheelDelta,
    sensitivity
  ) {
    const x = Math.min(Math.max(-127, Math.floor(movementX * sensitivity)), 127);
    const y = Math.min(Math.max(-127, Math.floor(movementY * sensitivity)), 127);
    // logger.info(`relativeX:${x} relativeY:${y}`);
    const buf = [0, 0, 0, 0, 0];
    buf[0] = buttons;
    buf[1] = x & 0xff;
    buf[2] = y & 0xff;
    buf[3] = this._translateVerticalWheelDelta(verticalWheelDelta) & 0xff;
    buf[4] = horizontalWheelDelta & 0xff;
    return Buffer.from(buf);
  }

  /**
   * Prepares a mouse event buffer based on the provided parameters.
   * @param {number} buttons - The button state of the mouse.
   * @param {number} relativeX - The relative X coordinate of the mouse.
   * @param {number} relativeY - The relative Y coordinate of the mouse.
   * @param {number} verticalWheelDelta - The vertical wheel delta of the mouse.
   * @param {number} horizontalWheelDelta - The horizontal wheel delta of the mouse.
   * @returns {Buffer} - The mouse event buffer.
   * @private
   */
  _prepareAbsoluteMouseEvent(
    buttons,
    relativeX,
    relativeY,
    verticalWheelDelta,
    horizontalWheelDelta
  ) {
    const [x, y] = this._scaleMouseCoordinates(relativeX, relativeY);
    // logger.info(`AbsoluteX:${relativeX} AbsoluteY:${relativeY}`);
    const buf = [0, 0, 0, 0, 0, 0, 0];
    buf[0] = buttons;
    buf[1] = x & 0xff;
    buf[2] = (x >> 8) & 0xff;
    buf[3] = y & 0xff;
    buf[4] = (y >> 8) & 0xff;
    buf[5] = this._translateVerticalWheelDelta(verticalWheelDelta) & 0xff;
    buf[6] = horizontalWheelDelta & 0xff;
    return Buffer.from(buf);
  }

  /**
   * Scales the mouse coordinates based on the given relative values.
   * @param {number} relativeX - The relative X coordinate.
   * @param {number} relativeY - The relative Y coordinate.
   * @returns {number[]} The scaled mouse coordinates as an array [x, y].
   * @private
   */
  _scaleMouseCoordinates(relativeX, relativeY) {
    const maxHidValue = 0x7fff;
    const x = parseInt(relativeX * maxHidValue);
    const y = parseInt(relativeY * maxHidValue);

    return [x, y];
  }

  /**
   * Translates the vertical wheel delta value.
   * @param {number} value - The vertical wheel delta value to be translated.
   * @returns {number} The translated vertical wheel delta value.
   * @private
   */
  _translateVerticalWheelDelta(value) {
    return -value;
  }

  setRelativeSens(value) {
    this._relative_sens = value;
  }

  startJiggler() {
    this._jigglerActive = true;
    this._jigglerLoop();
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    config.hid.mouseJiggler = true;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), UTF8);
  }



  _jigglerLoop() {
    if (!this._jigglerActive) return;

    if (this._jigglerTimeDiff <= 0) {
      logger.error('Invalid jigglerTimeDiff value. It must be greater than 0.');
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastInteraction = currentTime - this._lastUserInteraction;
    if (timeSinceLastInteraction >= this._jigglerTimeDiff) {
      logger.info(`No user interaction detected for ${this._jigglerTimeDiff/1000} seconds, activating mouse jiggler.`);

      if (this._mouseMode === 'relative' ) {
        this._performRelativeJiggle();
      } else {
        this._performAbsoluteJiggle();
      }

      this._lastUserInteraction = Date.now(); 
    }

    setTimeout(() => this._jigglerLoop(), this._jigglerTimeDiff);
  }

  _performAbsoluteJiggle() {
    const jiggleSequence = [
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.5 }
    ];
    jiggleSequence.forEach(({ x, y }) => {
      const buf = this._prepareAbsoluteMouseEvent(0, x, y, 0, 0);
      this._absMouse.write(buf);
    });
  }

  _performRelativeJiggle() {
    const jiggleSequence = [
      { x: -10, y: -10 },
      { x: 10, y: 10 }
    ];

    jiggleSequence.forEach(({ x, y }) => {
      const buf = this._prepareRelativeMouseEvent(0, x, y, 0, 0, 1);
      this._relMouse.write(buf);
    });
  }

  stopJiggler() {
    this._jigglerActive = false;
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    config.hid.mouseJiggler = false;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), UTF8);
    logger.info('stop mouse jiggler success');
  }

  updateJigglerInterval(interval) {
    this._jigglerTimeDiff = interval*1000; //ms==>s
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    config.hid.jigglerInterval = interval ;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), UTF8);
  }

  getJigglerStatus() {
    return this._jigglerActive;
  }
}

export default Mouse;
