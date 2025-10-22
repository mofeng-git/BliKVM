import client from 'prom-client';
import basicAuth from 'basic-auth';
import si from 'systeminformation';
import fs from 'fs';

import { CONFIG_PATH, UTF8 } from '../common/constants.js';
import { getSystemInfo } from '../common/tool.js'; // 引入 getSystemInfo 函数
import Logger from '../log/logger.js';
import ATX from '../modules/kvmd/kvmd_atx.js';

const logger = new Logger();

class PrometheusMetrics {
  _enable = false;
  _username = '';
  _password = '';
  _interval = 15000;

  constructor() {
    if (!PrometheusMetrics._instance) {
      PrometheusMetrics._instance = this;
      this._register = new client.Registry();
      this._initMetrics();
    }
    return PrometheusMetrics._instance;
  }

  _initMetrics() {
    //client.collectDefaultMetrics({ register: this._register });

    const { prometheus } = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
    this._enable = prometheus.enabled;
    this._username = prometheus.username;
    this._password = prometheus.password;
    this._interval = prometheus.interval * 1000;

    this.cpuTemperature = new client.Gauge({
      name: 'cpu_temperature_celsius',
      help: 'Current CPU temperature in Celsius',
    });
    
    this.cpuLoad = new client.Gauge({
      name: 'cpu_load_percent',
      help: 'Current CPU load in percent',
    });


    this.memActual = new client.Gauge({
      name: 'memory_actual_free_bytes',
      help: 'Actual free memory in bytes',
    });

    this.storageActual = new client.Gauge({
      name: 'storage_actual_free_bytes',
      help: 'Actual free storage in bytes',
    });

    this.ledPwr = new client.Gauge({
      name: 'led_pwr',
      help: 'ATX Power LED status',
    });

    this.ledHDD = new client.Gauge({
      name: 'led_hdd',
      help: 'ATX HDD LED status',
    });
    
    this._register.registerMetric(this.cpuTemperature);
    this._register.registerMetric(this.cpuLoad);
    this._register.registerMetric(this.memActual);
    this._register.registerMetric(this.storageActual);

    this._register.registerMetric(this.ledPwr);
    this._register.registerMetric(this.ledHDD);

    setInterval(() => {
      this._updateMetrics();
    }, this._interval);

  }

  enable() {
    if (!this._enable) {
      this._intervalId = setInterval(() => {
        this._updateMetrics();
      }, this._interval);
      const configObj = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      configObj.prometheus.enabled = true;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(configObj, null, 2), UTF8);
      this._enable = true;
    }
  }
  
  disable() {
    if (this._enable) {
      clearInterval(this._intervalId);
      this._intervalId = null;
      const configObj = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      configObj.prometheus.enabled = true;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(configObj, null, 2), UTF8);
      this._enabled = false;
    }
  }

  setInterval(interval){
    if (this._interval !== interval) {
      clearInterval(this._intervalId);
      this._interval = interval * 1000;
      this._intervalId = setInterval(() => {
        this._updateMetrics();
      }, this._interval);

      const configObj = JSON.parse(fs.readFileSync(CONFIG_PATH, UTF8));
      configObj.prometheus.interval = interval;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(configObj, null, 2));
    }
  }

  // atx status
  //cpu temp
  // memory usage
  // disk usage
  async _updateMetrics() {
    try{
      const systemInfo = await getSystemInfo();
      this.cpuTemperature.set(systemInfo.temperature);
      this.cpuLoad.set(systemInfo.cpuLoad);
  
      const memData = await si.mem();
      this.memActual.set(memData.free);
  
      const fsData = await si.fsSize();
      const sdAvailableSpace = fsData
        .filter(fs => fs.fs.startsWith('/dev/mmcblk0'))
        .reduce((total, partition) => total + partition.available, 0);
      this.storageActual.set(sdAvailableSpace);
  
      const atx = new ATX();
      const atxState = atx.getATXState();
      this.ledPwr.set(atxState.ledPwr ? 1 : 0);
      this.ledHDD.set(atxState.ledHDD ? 1 : 0);
    }catch(error){
      logger.error(`Error updating metrics: ${error}`);
    }
  }

  async getMetrics() {
    return await this._register.metrics();
  }

  getState() {
    return this._enable;
  }
}

 // 创建 PrometheusMetrics 实例

// 定义基本鉴权中间件
const BasicAuthObj = (req, res, next) => {

  const user = basicAuth(req);
  const PrometheusMetricsObj = new PrometheusMetrics();
  const username = PrometheusMetricsObj._username; // 设置你的用户名
  const password = PrometheusMetricsObj._password; // 设置你的密码 
  if (!user || user.name !== username || user.pass !== password) {
    res.set('WWW-Authenticate', 'Basic realm="example"');
    return res.status(401).send('Authentication required.');
  }
  next();
};

export { PrometheusMetrics, BasicAuthObj };
