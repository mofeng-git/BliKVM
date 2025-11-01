import { execSync } from 'child_process';

function getHardwareTypeForConfig() {
  try {
    execSync('test -f /proc/device-tree/model', { stdio: 'ignore' });
    const modelOutput = execSync('cat /proc/device-tree/model').toString();
    const pi4bSys = 'Raspberry Pi 4 Model B';
    const mangoPiSys = 'MangoPi Mcore';
    const piCM4Sys = 'Raspberry Pi Compute Module 4';

    if (modelOutput.includes(pi4bSys) || modelOutput.includes(piCM4Sys)) {
      return 'pi';
    } else if (modelOutput.includes(mangoPiSys)) {
      return 'h616';
    } else {
      return 'none';
    }
  } catch (error) {
    console.warn('Warning: /proc/device-tree/model not found. Assuming generic hardware ("none").');
    return 'none';
  }
}

const hardware = getHardwareTypeForConfig();

const defaultConfig = {
    "version": 10,
    "deviceVersion": "BliKVM",
    "log": {
      "console": {
        "enabled": true,
        "level": "info"
      },
      "file": {
        "enabled": true,
        "level": "trace",
        "fileName": "/mnt/tmp/logs/app.log",
        "flags": "a",
        "maxLogSize": 30,
        "backups": 3
      }
    },
    "userManager": {
      "userFile": "./config/user.json"
    },
    "switchManager": {
      "file": "./config/switch.json"
    },
    "server": {
      "protocol": "https",
      "https_port": 443,
      "http_port": 80,
      "mdnsEnabled": true,
      "ssl": {
        "key": "./lib/https/key.pem",
        "cert": "./lib/https/cert.pem"
      },
      "rootPath": "/mnt/blikvm/web_src/web_server",
      "configPath": "/usr/bin/blikvm/package.json",
      "sshUser": "blikvm",
      "sshPassword": "blikvm",
      "auth": true,
      "authExpiration": 12
    },
    "video": {
      "port": 10004,
      "shell": "./lib/kvmd-video.sh",
      "bin": `./lib/${hardware}/ustreamer.bin`,
      "fps": 30,
      "quality": 80,
      "kbps": 2000,
      "gop": 30,
      "resolution": "1920x1080",
      "recordPath": "/mnt/tmp/record",
      "recordBin": `./lib/${hardware}/ustreamer-dump`
    },
    "janus": {
      "bin": `./lib/${hardware}/janus`,
      "configsFolder": `./lib/${hardware}/janus_configs`,
      "pluginsFolder": `./lib/${hardware}/janus_plugins`
    },
    "kvmd": {
      "bin": `./lib/${hardware}/kvmd-main`
    },
    "display": {
      "mode": "boot",
      "onBootTime": 3600,
      "cycleInterval": 60,
      "displayTime": 10,
      "secondaryIP": ""
    },
    "atx": {
      "isActive": true,
      "controlSockFilePath": "/var/blikvm/atx.sock",
      "stateSockFilePath": "/dev/shm/blikvm/atx",
      "power_on_delay": 500,
      "power_off_delay": 5000
    },
    "msd": {
      "enable": true,
      "shell": "./lib/kvmd-msd.sh",
      "stateFilePath": "/mnt/msd/config/msd.json",
      "tusPort": 10002
    },
    "mic": {
      "isRegistered": false
    },
    "hid": {
      "hidEnable": "./lib/hid/enable-gadget.sh",
      "hidDisable": "./lib/hid/disable-gadget.sh",
      "keymaps": "./lib/keymaps",
      "enable": true,
      "mouseMode": "dual",
      "mouseJiggler": false,
      "jigglerInterval": 60,
      "pass_through": {
        "enabled": false,
        "wheelReverse": false,
        "mouse_sensitivity": 0.3
      },
      "identity": {
        "idVendor": "0x1d6b",
        "idProduct": "0x0106",
        "manufacturer": "BliKVM",
        "product": "Multifunction USB Device"
      }
    },
    "prometheus":{
      "enabled": false,
      "username": "admin",
      "password": "admin",
      "interval": 15
    },
    "fan":{
      "tempThreshold": 65
    },
    "healthCheck": {
      "RAM": 0.7,
      "storage": 0.7,
      "latency": 80,
      "temperature": 70,
    },
    "codeOfConduct":{
      "isActive": true,
      "url": ""
    }
};

export { defaultConfig, getHardwareTypeForConfig};