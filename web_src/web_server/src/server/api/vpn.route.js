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

import { createApiObj, ApiCode } from '../../common/api.js';
import fs from 'fs';
import { executeCMD } from '../../common/tool.js';  
import Logger from '../../log/logger.js';

const logger = new Logger();

function apiVPNEnable(req, res, next) {
    try{
        const returnObject = createApiObj();
        const { vpn, active } = req.body;
        if(vpn !== 'tailscaled' && vpn !== 'zerotier-one' && vpn !== 'wg-quick@wg0' )
        {
            returnObject.code = ApiCode.INVALID_INPUT_PARAM;
            returnObject.msg = `vpn:${vpn} error, only support tailscaled, zerotier-one, wg-quick@wg0`;
            res.json(returnObject);
            return;
        }
        if(active === true){
            executeCMD(`systemctl enable --now ${vpn}`)
            .then(() => {
                returnObject.msg = `${vpn} started successfully`;
                res.json(returnObject);
            })
            .catch((err) => {
                returnObject.msg = err.message;
                returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
                res.json(returnObject);
                next(err);
            });
        }else{
            executeCMD(`systemctl disable --now ${vpn}`)
            .then(() => {
                returnObject.msg = `${vpn} stopped successful`;
                res.json(returnObject);
            })
            .catch((err) => {
                returnObject.msg = err.message;
                returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
                res.json(returnObject);
                next(err);
            });
        }
    }catch(err){
        next(err);
    }
}

function apiVPNState(req, res, next) {
    try {
        const returnObject = createApiObj();
        const vpnToInterfaceMap = {
            'tailscaled': 'tailscale0',
            'zerotier-one': 'zt0',
            'wg-quick@wg0': 'wg0'
        };
        const vpns = Object.keys(vpnToInterfaceMap);

        const promises = vpns.map(vpn => 
            executeCMD(`systemctl is-active ${vpn}`)
                .then(stdout => {
                    const state = stdout.trim();
                    if (state === 'active') {
                        // 如果 VPN 活跃，获取对应的网卡名称
                        const interfaceName = vpnToInterfaceMap[vpn];
                        return executeCMD(`ip addr show ${interfaceName}`)
                            .then(ipOutput => {
                                const ipMatch = ipOutput.match(/inet (\d+\.\d+\.\d+\.\d+)/); // 提取 IPv4 地址
                                const ip = ipMatch ? ipMatch[1] : null;
                                return { vpn, state, ip }; // 返回包含 IP 的对象
                            });
                    } else {
                        console.log(`VPN ${vpn} is inactive, no IP address available.`);
                        return { vpn, state, ip: null }; // 非活跃状态，IP 为 null
                    }
                })
                .catch(() => ({ vpn, state: 'inactive', ip: null })) // 捕获错误并返回默认值
        );

        Promise.all(promises)
            .then(results => {
                returnObject.data = results.reduce((acc, { vpn, state, ip }) => {
                    acc[vpn] = { state, ip };
                    return acc;
                }, {});
                res.json(returnObject);
            })
            .catch((err) => {
                if (!res.headersSent) {
                    returnObject.msg = err.message;
                    returnObject.code = ApiCode.INTERNAL_SERVER_ERROR;
                    res.json(returnObject);
                }
                next(err);
            });
    } catch (error) {
        if (!res.headersSent) {
            next(error);
        }
    }
}

export { apiVPNEnable, apiVPNState };
