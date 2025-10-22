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
import path from 'path';
import { CONFIG_PATH, UTF8 } from '../../common/constants.js';
import {fileExists} from '../../common/tool.js';
import Logger from '../../log/logger.js';

const logger = new Logger();
let supportLanguage = null;

const SymmapModifiers = {
    SHIFT: 0x1,
    ALTGR: 0x2,
    CTRL: 0x4
};

function getSysmap(lang) {
    const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    const filePath = path.join(hid.keymaps, `${lang}.json`);
    if(!fileExists(filePath)) {
        logger.error(`Keymap file not found: ${filePath}`);
        return null;
    }
    const keymap = JSON.parse(fs.readFileSync(filePath, UTF8));
    return keymap;
}

function getSupportLang() {
  if (supportLanguage !== null) {
    return supportLanguage;
  }
    try {
      const { hid } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      const files = fs.readdirSync(hid.keymaps);
      supportLanguage = files
        .filter(file => path.extname(file) === '.json')
        .map(file => path.basename(file, '.json'));
      return supportLanguage;
    } catch (err) {
        logger.error(`Error reading directory: ${err}`);
      return [];
    }
  }



export { SymmapModifiers, getSysmap, getSupportLang };