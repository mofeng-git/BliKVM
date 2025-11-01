
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
 * Represents the hardware types.
 * @enum {number}
 */
const HardwareType = {
  /**
   * Unknown hardware type.
   */
  UNKNOWN: 0,
  /**
   * Raspberry Pi 4B.
   */
  PI4B: 1,
  /**
   * Compute Module 4.
   */
  CM4: 2,
  /**
   * MangoPi hardware.
   */
  MangoPi: 3,
  /**
   * BliKVM hardware.
   */
  BliKVMV5CM4: 4
};

const ModuleState = {
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
};

const SwitchModulesID = {
  BliKVM_switch_v1: 1,
  BliKVM_switch_v2: 2,
  TESmart_HSW0801_switch: 3,
  TESmart_HSW1601_switch: 4
};

export { HardwareType, ModuleState, SwitchModulesID };
