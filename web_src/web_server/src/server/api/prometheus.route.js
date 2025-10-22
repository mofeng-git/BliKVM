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
import { PrometheusMetrics } from '../prometheus.js'
import Logger from '../../log/logger.js';

const logger = new Logger();

function apiPrometheusEnable(req, res, next) {
    try {
        const returnObject = createApiObj();
        const { enable } = req.body;
        const PrometheusMetricsObj = new PrometheusMetrics();
        if( enable === true){
            PrometheusMetricsObj.enable();
        }else{
            PrometheusMetricsObj.disable();
        }
        returnObject.msg = `Prometheus ${enable} success`;
        returnObject.data ={
            enable: PrometheusMetricsObj.getState()
        }
        res.json(returnObject);
    } catch (error) {
        next(error);
    }
}

function apiPrometheusState(req, res, next){
    try {
        const returnObject = createApiObj();
        const PrometheusMetricsObj = new PrometheusMetrics();
        returnObject.data ={
            enable: PrometheusMetricsObj.getState()
        }
        res.json(returnObject);
    } catch (error) {
        next(error);
    }
}


export { apiPrometheusEnable, apiPrometheusState }

