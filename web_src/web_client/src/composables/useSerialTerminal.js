'use strict';

import http from '@/utils/http.js';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const { serial } = storeToRefs(store);

const serialPortList = ref([]); // Initialize hdmiSwitch as an object with items array
const serialBaudrateList = ref([9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]); // Baudrate options

export function useSerialPorts() {
  const getPortList = async () => {
    try {
      const response = await http.get('/serial');
      if (response.status === 200 && response.data.code === 0) {
        if (response.data.data) {
          serialPortList.value = response.data.data;
        }
      } else {
        const title = 'Serial';
        const message = response.data.msg || 'Failed to get serial port list';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Serial';
      const message = error.message || 'Catch to get serial port list';
      sendAlert('error', title, message);
    }
  };

  const setSerial = async () => {
    try {
      const requestBody = {
        path: serial.value.serialFile,
        baudrate: serial.value.baudrate,
      };
      const response = await http.post('/serial', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        if (response.data.data) {
          serialPortList.value = response.data.data;
        }
      } else {
        const title = 'Serial';
        const message = response.data.msg || 'Failed to set serial port';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Serial';
      const message = error.message || 'Catch to set serial port';
      sendAlert('error', title, message);
    }
  };

  return {
    serialPortList,
    serialBaudrateList,
    getPortList,
    setSerial,
  };
}
