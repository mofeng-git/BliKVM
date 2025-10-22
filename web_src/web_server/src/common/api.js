
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
 * This module defines the API object and its default values.
 * @module api/common/api
 */

/**
 * The version of the API.
 * @type {string}
 */
const API_VERSION = '1.6.0';

/**
 * Represents the error codes used in the API.
 * 100-199 indicates request error,
 * 200-299 indicates server error.
 * @enum {number}
 */
const ApiCode = {
  OK: 0,
  INVALID_CREDENTIALS: 100,
  NULL_TOKEN: 101,
  INVALID_TOKEN: 102,
  INVALID_INPUT_PARAM: 200,
  INTERNAL_SERVER_ERROR: 300
};

/**
 * Creates an API object with default values.
 * @returns {Object} The created API object.
 * @property {string} version The version of the API.
 * @property {string} msg The message of the API.
 * @property {ApiCode} code The error code of the API.
 * @property {Object} data The data of the API.
 */
function createApiObj() {
  return {
    version: API_VERSION,
    msg: '',
    code: ApiCode.OK,
    data: {}
  };
}

export { API_VERSION, ApiCode, createApiObj };
