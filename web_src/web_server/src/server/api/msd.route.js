
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
import fs from 'fs';
import { ApiCode, createApiObj } from '../../common/api.js';
import { MSD_MOUNT_DIR, MSD_CONFIG_FILE, UTF8 } from '../../common/constants.js';
import MSD from '../../modules/kvmd/kvmd_msd.js';
import Mouse from '../mouse.js';
import Keyboard from '../keyboard.js';
import { readDirectoryFiles, isMounted} from '../../common/tool.js';
import Logger from '../../log/logger.js';
import { getDiskSpace } from '../../common/tool.js';

const logger = new Logger();
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


async function apiMSDMount(req, res, next) {
  try {
    const msd = new MSD();
    await msd.mountMSD(req, res, next);
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

// Return used/size for the virtual media mount point.
// Prefer the configured MSD_MOUNT_DIR, but keep backward-compatible
// fallbacks for older images (/mnt/msd/ventoy) and legacy /mnt to
// avoid returning an empty object on mismatched mount paths.
async function getMntSize(req, res, next) {
  try {
    const returnObject = createApiObj();

    // Try configured mount dir first
    let stat = await getDiskSpace(MSD_MOUNT_DIR);
    let mountPath = MSD_MOUNT_DIR;
    // Backward-compat: old images used /mnt/msd/ventoy
    if (!stat || !stat.size) {
      stat = await getDiskSpace('/mnt/msd/ventoy');
      if (stat && stat.size) mountPath = '/mnt/msd/ventoy';
    }
    // Legacy fallback: some environments may still use /mnt directly
    if (!stat || !stat.size) {
      stat = await getDiskSpace('/mnt');
      if (stat && stat.size) mountPath = '/mnt';
    }

    const used = stat?.used ?? 0;
    const size = stat?.size ?? 0;
    returnObject.data = { used, size, mount: mountPath };
    returnObject.code = ApiCode.OK;
    res.json(returnObject);
  } catch (err) {
    next(err);
  }

}

async function apiGetMSDFiles(req, res, next) {
  try {
    const returnObject = createApiObj();
    const mounted = await isMounted(MSD_MOUNT_DIR);
    const config = JSON.parse(fs.readFileSync(MSD_CONFIG_FILE, UTF8));
    const configMounted = config.file_mount_flag === "true" ? true : false;
    if( mounted !== configMounted){
      config.file_mount_flag = mounted ? "true" : "false";
      fs.writeFileSync(MSD_CONFIG_FILE, JSON.stringify(config, null, 2), UTF8);
    }
    if (!mounted) {
      logger.warn(`path not mounted: ${path}`);
      returnObject.code = ApiCode.OK;
      returnObject.msg = `${MSD_MOUNT_DIR} not mounted`;
      res.json(returnObject);
      return;
    }
    const files =  await readDirectoryFiles(MSD_MOUNT_DIR);
    returnObject.code = ApiCode.OK;
    returnObject.data = files;
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
  apiGetMSDFiles,
  apiMSDMount,
  getMntSize,
  apiGetMakeImageProgress
};
