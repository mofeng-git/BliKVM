
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
 *
 * project config settings file
 *
 */
import project from '../package.json';
/**
 * Change the IP address below to your development testing machine's IP address. In the official environment, this configuration is invalid
 */
const dev_device_ip = '192.168.3.18';
const dev_device_port = '';

const env = process.env.NODE_ENV;

const version = project.version;
const build = project.build;

export default {
    version:version,
    build:build,
    host_ip : env === 'development' ? dev_device_ip : window.location.hostname,
    host_port: env === 'development' ? dev_device_port : (window.location.port && parseInt(window.location.port) !== 80 ? `:${window.location.port}` : ''),
    http_protocol: window.location.protocol
}
