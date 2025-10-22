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

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const releaseDir = path.join(process.cwd(), 'release');

const createDirectoryIfNotExists = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory: ${dir}`, error);
  }
};

const deleteDirectoryIfExists = async (dir) => {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error deleting directory: ${dir}`, error);
  }
};

const copyRecursive = async (src, dest) => {
  try {
    const stat = await fs.stat(src);

    if (stat.isDirectory()) {
      await createDirectoryIfNotExists(dest);
      const entries = await fs.readdir(src);
      await Promise.all(entries.map(async (entry) => {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        await copyRecursive(srcPath, destPath);
      }));
    } else {
      const destDir = path.dirname(dest);
      await createDirectoryIfNotExists(destDir);
      await fs.copyFile(src, dest);
    }
  } catch (error) {
    console.error(`Error copying from ${src} to ${dest}`, error);
  }
};

/**
 * Retrieves the hardware type based on the device model.
 * @returns {string} The hardware type.
 */
function getHardwareType() {
  let hardwareSysType = '';
  let modelOutput = '';
  try {
    modelOutput = execSync('cat /proc/device-tree/model').toString();
  } catch (error) {
    modelOutput = '';
  }
  const pi4bSys = 'Raspberry Pi 4 Model B';
  const mangoPiSys = 'MangoPi Mcore';
  const piCM4Sys = 'Raspberry Pi Compute Module 4';

  if (modelOutput.includes(pi4bSys) || modelOutput.includes(piCM4Sys)) {
    hardwareSysType = 'pi';
  } else if (modelOutput.includes(mangoPiSys)) {
    hardwareSysType = 'h616';
  } else {
    hardwareSysType = 'none';
  }
  return hardwareSysType;
}

const copyLibDirectory = async (hardwareSysType) => {
  const libDir = path.join(process.cwd(), 'lib');
  const entries = await fs.readdir(libDir);
  await Promise.all(entries.map(async (entry) => {
    if (hardwareSysType === 'pi' && entry !== 'h616') {
      const srcPath = path.join(libDir, entry);
      const destPath = path.join(releaseDir, 'lib', entry);
      await copyRecursive(srcPath, destPath);
    } else if (hardwareSysType === 'h616' && entry !== 'pi') {
      const srcPath = path.join(libDir, entry);
      const destPath = path.join(releaseDir, 'lib', entry);
      await copyRecursive(srcPath, destPath);
    }
  }));
};

const copyFiles = async () => {
  await deleteDirectoryIfExists(releaseDir);
  await createDirectoryIfNotExists(releaseDir);

  const hardwareSysType = process.env.HARDWARE_TYPE || getHardwareType();

  if (hardwareSysType !== 'pi' && hardwareSysType !== 'h616') {
    console.error('Invalid hardware type. Use "pi" or "h616".');
    process.exit(1);
  }

  await copyLibDirectory(hardwareSysType);

  const itemsToCopy = [
    path.join('build', 'bin', 'server_app')
  ];
  await Promise.all(itemsToCopy.map(async (item) => {
    const srcPath = path.join(process.cwd(), item);
    const destPath = path.join(releaseDir, path.basename(item));
    await copyRecursive(srcPath, destPath);
  }));

  console.log('Files and directories copied successfully to release folder.');
};

copyFiles();
