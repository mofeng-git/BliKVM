
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
 * This module provides utility functions.
 * @module common/tool
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { CONFIG_PATH, MSD_MOUNT_DIR } from '../common/constants.js';
import readEepromJson from './eepromReader.js';
import { v4 } from 'uuid';
import { HardwareType } from './enums.js';
import { execSync, exec } from 'child_process';
import si from 'systeminformation';
import Logger from '../log/logger.js';
import { createApiObj } from './api.js';
import {defaultConfig} from '../modules/update/app_default_config.js';

const logger = new Logger();

let hardwareSysType = HardwareType.UNKNOWN;
const EEPROM_V5_MATCH = 'BliKVM v5 CM4';
let eepromDetectStarted = false;
// 简易同步等待 Promise 的工具：使用 SharedArrayBuffer + Atomics.wait 实现阻塞，并加入超时保护
function runSync(promise, timeoutMs = parseInt(process.env.EEPROM_SYNC_TIMEOUT_MS || '1500', 10)) {
  const sab = new SharedArrayBuffer(4);
  const ia = new Int32Array(sab);
  let result; let error;
  promise.then(r => { result = r; Atomics.store(ia, 0, 1); Atomics.notify(ia, 0); })
         .catch(e => { error = e; Atomics.store(ia, 0, 1); Atomics.notify(ia, 0); });
  const start = Date.now();
  while (Atomics.load(ia, 0) === 0) {
    const elapsed = Date.now() - start;
    if (elapsed >= timeoutMs) {
      throw new Error(`runSync timeout after ${timeoutMs}ms`);
    }
    // 每次等待不超过剩余时间
    const waitMs = Math.min(50, Math.max(1, timeoutMs - elapsed));
    Atomics.wait(ia, 0, 0, waitMs);
  }
  if (error) throw error;
  return result;
}

/**
 * Checks if a directory exists at the specified path.
 *
 * @param {string} path - The path to the directory.
 * @returns {boolean} - Returns true if the directory exists, false otherwise.
 */
function dirExists(path) {
  return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
}

/**
 * Checks if a file exists at the specified path.
 *
 * @param {string} path - The path to the file.
 * @returns {boolean} - Returns true if the file exists and is a regular file, otherwise returns false.
 */
function fileExists(path) {
  return fs.existsSync(path) && fs.lstatSync(path).isFile();
}

function isDeviceFile(path) {
  try {
    fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Creates a directory recursively if it doesn't exist.
 * @param {string} dirname - The directory path to create.
 * @returns {boolean} Returns true if the directory is created successfully, false otherwise.
 */
function createDir(dirname) {
  if (dirExists(dirname)) {
    return true;
  }

  const parentDir = path.dirname(dirname);
  if (parentDir !== dirname) {
    if (createDir(parentDir)) {
      fs.mkdirSync(dirname);
      return true;
    }
  }

  return false;
}

/**
 * Creates a file at the specified file path.
 * @param {string} filePath - The path of the file to be created.
 * @param {boolean} [append=false] - Optional. Specifies whether to append to an existing file. Default is false.
 */
function createFile(filePath, append = false) {
  const dirname = path.dirname(filePath);
  createDir(dirname);
  if (append) {
    fs.appendFileSync(filePath, '');
  } else {
    fs.writeFileSync(filePath, '');
  }
}

/**
 * Generates a unique code.
 * @returns {string} The generated unique code.
 */
function generateUniqueCode() {
  return v4();
}

/**
 * Generates a random secret password of the specified length.
 *
 * @param {number} length - The length of the password to generate.
 * @returns {string} The generated password.
 */
function generateSecret(length) {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const allChars = uppercaseChars + lowercaseChars + numberChars;

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  return password;
}

/**
 * Retrieves the hardware type based on the device model.
 * @returns {enmus} The hardware type, see HardwareType.
 */
function getHardwareType() {
  if (hardwareSysType === HardwareType.UNKNOWN) {
    const modelOutput = execSync('cat /proc/device-tree/model').toString();
    const pi4bSys = 'Raspberry Pi 4 Model B';
    const mangoPiSys = 'MangoPi Mcore';
    const piCM4Sys = 'Raspberry Pi Compute Module 4';

    if (modelOutput.includes(pi4bSys)) {
      hardwareSysType = HardwareType.PI4B;
    } else if (modelOutput.includes(mangoPiSys)) {
      hardwareSysType = HardwareType.MangoPi;
    } else if (modelOutput.includes(piCM4Sys)) {
      hardwareSysType = HardwareType.CM4;
      if (!eepromDetectStarted) {
        eepromDetectStarted = true;
        if (!fs.existsSync('/dev/i2c-8')) {
          return hardwareSysType;
        }
        try {
          const meta = runSync(readEepromJson({ length: 256, returnMeta: true }), 1000);
          if (meta && meta.present && meta.json && meta.json.device_version === EEPROM_V5_MATCH) {
            hardwareSysType = HardwareType.BliKVMV5CM4;
          }
        } catch (e) {
        }
      }
    }
  }
  return hardwareSysType;
}

function executeScriptAtPath(scriptPath, args = []) {
  const bashCommand = `bash ${scriptPath} ${args.join(' ')}`;
  return new Promise((resolve, reject) => {
    exec(bashCommand, (error, stdout, stderr) => {
      if (error) {
        const err = new Error(`Script execution failed: ${stderr}`);
        err.code = error.code;
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

function executeCMD(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function getSystemType() {
  try {
    const output = execSync('mount | grep " / "', { encoding: 'utf-8' });
    if (output.includes('ro,noatime')) {
      return 'ro';
    } else if (output.includes('rw,noatime')) {
      return 'rw';
    } else {
      return 'error';
    }
  } catch (error) {
    return 'error';
  }
}

function changetoRWSystem() {
  try {
    const output = execSync('mount | grep " / "', { encoding: 'utf-8' });
    if (output.includes('ro,noatime')) {
      execSync('mount -o remount,rw /');
    }
    return true;
  } catch (error) {
    return false;
  }
}

function changetoROSystem() {
  try {
    const output = execSync('mount | grep " / "', { encoding: 'utf-8' });
    if (output.includes('rw,noatime')) {
      execSync('mount -o remount,ro /');
    }
    return true;
  } catch (error) {
    return false;
  }
}

function getAllFilesInDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    let fileList = [];

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        fileList.push(filePath);
      } else if (stats.isDirectory()) {
        const subFiles = getAllFilesInDirectory(filePath);
        fileList = fileList.concat(subFiles);
      }
    });
    return fileList;
  } catch (err) {
    return [];
  }
}

/**
 * 延迟指定的毫秒数。
 * @param {number} ms - 延迟的毫秒数。
 * @returns {Promise} Promise 对象，表示延迟完成。
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isMounted(target) {
  try {
    // 规范化去掉末尾斜杠
    if (target.length > 1 && target.endsWith('/')) target = target.slice(0, -1);
    const data = await fsPromises.readFile('/proc/mounts', 'utf-8');
    return data.split('\n').some(line => {
      if (!line) return false;
      // /proc/mounts 用空格分隔，第二列是挂载点
      const parts = line.split(' ');
      return parts[1] === target;
    });
  } catch {
    return false;
  }
}

async function getDiskSpace(targetPath) {
  try {
    // 规范化路径，避免尾部多余的 `/`
    const normalizedPath = path.resolve(targetPath);

    // 获取磁盘信息
    const disk = await si.fsSize();
    if (!disk || !disk.length) {
      // 在某些精简 / docker 环境下，systeminformation 可能拿不到 fsSize，
      // 这里退回使用 `df -P <path>` 直接读取指定路径所在分区的信息。
      try {
        const output = execSync(`df -P ${normalizedPath}`, { encoding: 'utf-8' });
        const lines = output.trim().split('\n');
        if (lines.length >= 2) {
          const parts = lines[1].trim().split(/\s+/);
          // df -P: Filesystem Size Used Avail Use% MountedOn
          const sizeKb = parseInt(parts[1], 10);
          const usedKb = parseInt(parts[2], 10);
          if (!Number.isNaN(sizeKb) && !Number.isNaN(usedKb)) {
            return {
              used: usedKb * 1024,
              size: sizeKb * 1024
            };
          }
        }
        logger.error('df fallback for fsSize() returned unexpected output');
      } catch (e) {
        logger.error(`df fallback for fsSize() failed: ${e.message}`);
      }
      // 实在拿不到再返回空对象
      return {};
    }

    // 1) 精确匹配挂载点（经典场景）
    let diskOnPath = disk.find((d) => d.mount === normalizedPath);

    // 2) 如果不是挂载点，按“最长前缀”匹配所在分区，例如：
    //    - 目录：/media/blikvm/ventoy
    //    - 挂载：/ 或 /media
    //    选择 mount 前缀最长的一项
    if (!diskOnPath) {
      const candidates = disk
        .filter((d) => {
          if (!d.mount) return false;
          const mountPath =
            d.mount.length > 1 && d.mount.endsWith('/') ? d.mount.slice(0, -1) : d.mount;
          return normalizedPath === mountPath || normalizedPath.startsWith(`${mountPath}/`);
        })
        .sort((a, b) => b.mount.length - a.mount.length);

      if (candidates.length > 0) {
        diskOnPath = candidates[0];
      }
    }

    // 3) 兜底：退回根分区 `/`
    if (!diskOnPath) {
      diskOnPath = disk.find((d) => d.mount === '/');
    }

    if (!diskOnPath) {
      // 4) 再兜底：选择容量最大的分区，视为“系统分区”（适配部分 docker 环境）
      const sorted = disk
        .filter((d) => typeof d.size === 'number' && d.size > 0)
        .sort((a, b) => b.size - a.size);
      if (sorted.length > 0) {
        diskOnPath = sorted[0];
      } else {
        logger.error(`can't find any fsSize entry for path: ${normalizedPath}`);
        return {};
      }
    }

    const resJson = {
      used: diskOnPath.used,
      size: diskOnPath.size // 分区总容量
    };
    return resJson;
  } catch (err) {
    // 捕获异常并返回null
    return null;
  }
}

async function readVentoyDirectory(ventoyDirectory) {
  try {
    // Use getDiskSpace to get disk space information. Prefer configured mount.
    let diskStat = await getDiskSpace(MSD_MOUNT_DIR);
    if (!diskStat || !diskStat.size) {
      // Backward compatibility with old mount path
      diskStat = await getDiskSpace('/mnt/msd/ventoy');
    }
    if (!diskStat || !diskStat.size) {
      diskStat = await getDiskSpace('/mnt');
    }
    const { used = 0, size = 0 } = diskStat || {};

    const files = await fsPromises.readdir(ventoyDirectory);

    const fileInformation = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(ventoyDirectory, file);
        try {
          const stats = await fsPromises.stat(filePath);

          // Check if the file is a regular file
          if (stats.isFile()) {
            return {
              name: file,
              path: filePath,
              imageSize: stats.size,
              date: stats.mtime
            };
          }
        } catch (error) {
          // Handle error for individual file stat
          console.error(`Error reading file stats for ${file}:`, error);
        }
      })
    );

    // Filter out undefined values (directories or non-regular files)
    const filteredFileInformation = fileInformation.filter((info) => info);
    const capacity = size > 0 ? (((size - used) / size) * 100).toFixed(2) : '0.00';
    return {
      size,
      used,
      capacity,
      files: filteredFileInformation
    };
  } catch (error) {
    console.error('Error reading directory:', error);
  }
}

async function readDirectoryFiles(directory) {
  try {
    const { used, size } = await getDiskSpace(directory);
    const files = await fsPromises.readdir(directory);

    const fileInformation = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(directory, file);
        try {
          const stats = await fsPromises.stat(filePath);

          // Check if the file is a regular file
          if (stats.isFile()) {
            return {
              name: file,
              path: filePath,
              imageSize: stats.size,
              date: stats.mtime
            };
          }
        } catch (error) {
          // Handle error for individual file stat
          console.error(`Error reading file stats for ${file}:`, error);
        }
      })
    );

    // Filter out undefined values (directories or non-regular files)
    const filteredFileInformation = fileInformation.filter((info) => info);
    return {
      size,
      used,
      files: filteredFileInformation
    };
  } catch (error) {
    console.error('Error reading directory:', error);
  }
}

function processPing(ws, ping) {
  const ret = createApiObj();
  ret.data.pong = ping;
  ws.send(JSON.stringify(ret));
}

async function getSystemInfo() {
  try {
    const [load, uptime, temp] = await Promise.all([
      si.currentLoad(),
      si.time(),
      si.cpuTemperature()
    ]);

    const cpuLoad = load.currentLoad.toFixed(2);
    const temperature = temp.main.toFixed(2);
    const uptimeSeconds = uptime.uptime;
    const days = Math.floor(uptimeSeconds / (24 * 3600));
    const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const formattedUptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;


    const resJson = {
      cpuLoad: parseFloat(cpuLoad),
      uptime: formattedUptime,
      temperature: parseFloat(temperature)
    };
    return resJson;
  } catch (err) {
    logger.error(`getSystemInfo Error: ${err.message}`);
  }
}

function getCurrentTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

let cachedConfig = null;
function getDefaultConfig() {
  if (cachedConfig !== null) {
    return cachedConfig;
  }
  if (fs.existsSync(CONFIG_PATH) === false) {
    cachedConfig = defaultConfig;
  } else {
    const configFile = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    cachedConfig = configFile;
  }
  return cachedConfig;
}


export {
  dirExists,
  fileExists,
  createDir,
  createFile,
  generateUniqueCode,
  generateSecret,
  getHardwareType,
  executeScriptAtPath,
  isDeviceFile,
  executeCMD,
  getSystemType,
  changetoRWSystem,
  changetoROSystem,
  getAllFilesInDirectory,
  sleep,
  readVentoyDirectory,
  processPing,
  getSystemInfo,
  readDirectoryFiles,
  isMounted,
  getDiskSpace,
  getDefaultConfig,
  getCurrentTimestamp
};
