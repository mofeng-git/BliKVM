'use strict';

import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert.js';
import { useDevice } from '@/composables/useDevice';

const { sendAlert } = useAlert();
const { device } = useDevice();

export function useHealth() {
  const getHealthThreshold = async () => {
    try {
      const response = await http.get('/healthcheck');
      if ((response.status === 200) & (response.data.code === 0)) {
        device.value.health.ramThreshold = response.data.data.RAM;
        device.value.health.networkLatencyThreshold = response.data.data.latency;
        device.value.health.storageThreshold = response.data.data.storage;
        device.value.health.temperatureThreshold = response.data.data.temperature;
        device.value.mem.actual = response.data.data.current.mem.actual;
        device.value.storage.actual = response.data.data.current.storage.actual;
      } else {
        const title = 'Get Health Error';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Get Health Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  return {
    getHealthThreshold,
  };
}
