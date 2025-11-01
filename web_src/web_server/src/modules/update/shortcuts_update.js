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
import { fileExists, dirExists } from '../../common/tool.js';
import { SHORTCUTS_PATH, UTF8, CONFIG_DIR } from '../../common/constants.js';
import Logger from '../../log/logger.js';

const logger = new Logger();

class ShortcutsConfigUpdate {
  constructor() {
    this._dirPath = CONFIG_DIR;
    this._filePath = SHORTCUTS_PATH;
    // Keep in sync with current defaults used by API and tests
    this._defaultConfig = {
      version: 1,
      shortcuts: {
        windows: {
          "Alt+Meta+Esc": ["AltLeft", "MetaLeft", "Escape"],
          "Alt+Shift": ["AltLeft", "ShiftLeft"],
          "Shift+Shift": ["ShiftLeft", "ShiftLeft"],
          "Win+Space": ["MetaLeft", "Space"],
          "Win": ["MetaLeft"],
          "Ctrl+W": ["ControlLeft", "KeyW"],
          "Alt+Tab": ["AltLeft", "Tab"],
          "Alt+F4": ["AltLeft", "F4"],
          "Alt+Enter": ["AltLeft", "Enter"],
          "Ctrl+Alt+F1": ["ControlLeft", "AltLeft", "F1"],
          "Ctrl+Alt+F2": ["ControlLeft", "AltLeft", "F2"],
          "Win+L": ["MetaLeft", "KeyL"]
        },
        macos: {
          "Cmd+Q": ["MetaLeft", "KeyQ"],
          "Cmd+W": ["MetaLeft", "KeyW"],
          "Cmd+Tab": ["MetaLeft", "Tab"],
          "Cmd+Space": ["MetaLeft", "Space"],
          "Cmd+H": ["MetaLeft", "KeyH"]
        },
        linux: {
          "Alt+Tab": ["AltLeft", "Tab"],
          "Alt+F4": ["AltLeft", "F4"],
          "Ctrl+Alt+T": ["ControlLeft", "AltLeft", "KeyT"],
          "Ctrl+Alt+L": ["ControlLeft", "AltLeft", "KeyL"],
          "Alt+F2": ["AltLeft", "F2"]
        },
        android: {
        },
        ios: {
          
        }
      }
    };
  }

  upgradeFile() {
    try {
      if (!dirExists(this._dirPath)) {
        fs.mkdirSync(this._dirPath, { recursive: true });
      }
      if (!fileExists(this._filePath)) {
        fs.writeFileSync(this._filePath, JSON.stringify(this._defaultConfig, null, 2), UTF8);
        logger.info(`shortcuts.json not found, wrote default to ${this._filePath}`);
        return;
      }
      // If exists, do nothing for now (no versioned migrations yet)
    } catch (error) {
      logger.error(`${error}`);
    }
  }
}

export default ShortcutsConfigUpdate;
