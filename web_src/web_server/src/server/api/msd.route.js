
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
import { ApiCode, createApiObj } from '../../common/api.js';
import MSD from '../../modules/kvmd/kvmd_msd.js';
import Mouse from '../mouse.js';
import Keyboard from '../keyboard.js';
/**
 * /api/msd/state
 * /api/msd/upload?image=test.iso
 * /api/msd/upload?image=http://example.com/test.iso
 * /api/msd/create
 * {"type":"ventoy","images":["test.iso"],"name":"ventoy","size":"4G"}
 * /api/msd/connect?action=true
 * /api/msd/remove
 * /api/msd/delete?image=test.iso
 * /api/msd/images
 * /api/msd/copy?direction=blikvm-to-target
 * /api/msd/copy?direction=target-to-blikvm
 **/

function apiUpload(req, res, next) {
  try {
    const msd = new MSD();
    msd.uploadMultipleAsync(req, res, next);
  } catch (err) {
    next(err);
  }
}

function apiCreateMSD(req, res, next) {
  try {
    const msd = new MSD();
    msd.createMSD(req, res, next);
  } catch (err) {
    next(err);
  }
}

function apiState(req, res, next) {
  try {
    const msd = new MSD();
    const state = msd.getMSDState();
    const returnObject = createApiObj();
    returnObject.data = state;
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

async function apiConnect(req, res, next) {
  try {
    const keyboard = new Keyboard();
    keyboard.close();
    const mouse = new Mouse();
    mouse.close();

    const msd = new MSD();
    await msd.connectMSD(req, res, next);
    keyboard.open();
    mouse.open();
  } catch (err) {
    next(err);
  }
}

async function apiImages(req, res, next) {
  try {
    const returnObject = createApiObj();
    const msd = new MSD();
    returnObject.data = await msd.getImages();
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }
}

async function apiRemoveMSD(req, res, next) {

  const keyboard = new Keyboard();
  keyboard.close();
  const mouse = new Mouse();
  mouse.close();


  const msd = new MSD();
  await msd.removeMSD(req, res, next);
  keyboard.open();
  mouse.open();
}

function apiDeleteImage(req, res, next) {
  const msd = new MSD();
  const isodir = req.query.image;
  const returnObject = createApiObj();

  msd
    .deleteImage(isodir)
    .then((result) => {
      returnObject.msg = `Delete ${isodir} success`;
      returnObject.code = ApiCode.OK;
      res.json(returnObject);
    })
    .catch((error) => {
      returnObject.msg = `Delete ${isodir} failed: ${error.message}`;
      returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
      res.json(returnObject);
    });
}

function apiGetUploadProgress(req, res, next) {
  const msd = new MSD();
  msd.getUploadProgress(req, res, next);
}

function apiGetMakeImageProgress(req, res, next) {
  const msd = new MSD();
  msd.getMakeImageProgress(req, res, next);
}

export {
  apiUpload,
  apiCreateMSD,
  apiState,
  apiConnect,
  apiImages,
  apiRemoveMSD,
  apiDeleteImage,
  apiGetUploadProgress,
  apiGetMakeImageProgress
};
