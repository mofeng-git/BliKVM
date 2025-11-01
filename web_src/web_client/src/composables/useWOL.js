'use strict';

import { ref, onMounted } from 'vue';
import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert.js';

const { sendAlert } = useAlert(alert);
const wolList = ref({ items: [] });

export function useWOL() {
  const deviceNameRules = [(v) => !!v || 'Device name is required'];
  const macAddressRegex = /^((([a-f0-9]{2}:){5})|(([a-f0-9]{2}-){5}))[a-f0-9]{2}$/i;
  const macAddressRules = [
    (v) => !!v || 'MAC address is required',
    (v) => macAddressRegex.test(v) || 'Invalid MAC address format. Must be XX:XX:XX:XX:XX:XX',
  ];

  const loadWol = async () => {
    try {
      const response = await http.get('/wol');
      if (response.status === 200 && response.data.code === 0) {
        wolList.value.items = response.data.data || [];
      }
    } catch (error) {
      const title = 'Get WOL devices.';
      const message = error.message || 'Failed to load WOL devices.';
      sendAlert('error', title, message);
    }
  };

  // Utility: Add a new WOL device
  const addDevice = async (name, mac) => {
    try {
      if (!name || !mac) {
        const title = 'Add WOL devices.';
        const message = 'Failed to add WOL devices.';
        sendAlert('error', title, message);
        return;
      }

      const requestBody = {
        name: name,
        mac: mac,
      };
      const response = await http.post('/v2/wol', requestBody);
      console.log('response:', response);
      if (response.status === 200 && response.data.code === 0) {
        console.log('response.data:', response.data.data);
        if (response.data.data) {
          // If the response contains data, update the wolList
          wolList.value.items = response.data.data;
        }
      }
    } catch (error) {
      const title = 'Add WOL devices.';
      const message = error.message || 'Failed to add WOL devices.';
      sendAlert('error', title, message);
    }
  };

  // Utility: Remove a WOL device by MAC address
  const removeDevice = async (mac) => {
    try {
      if (!mac) {
        const title = 'Remove WOL devices.';
        const message = 'Failed to remove WOL devices.';
        sendAlert('error', title, message);
        return;
      }
      const requestBody = {
        mac: mac,
      };
      const response = await http.delete('/wol', { data: requestBody });
      console.log('response:', response);
      if (response.status === 200 && response.data.code === 0) {
        if (response.data.data) {
          // If the response contains data, update the wolList
          wolList.value.items = response.data.data;
          console.log('wolList.value.items:', wolList.value.items);
        }
      }
    } catch (error) {
      const title = 'Remove WOL devices.';
      const message = error.message || 'Failed to remove WOL devices.';
      sendAlert('error', title, message);
    }
  };

  const findDeviceByMacId = (mac) => {
    return wolList.value.items.find((item) => item.mac === mac);
  };

  // Utility: Get a device by MAC address
  const findDeviceByDeviceId = (deviceId) => {
    return wolList.value.items.find((item) => item.deviceId === deviceId);
  };

  // Computed: Total number of devices
  const totalDevices = computed(() => wolList.value.items.length);

  const wakeOnLan = async (mac) => {
    try {
      if (!mac) {
        const title = 'Wakeup WOL devices.';
        const message = 'Failed to wake up WOL devices.';
        sendAlert('error', title, message);
        return;
      }
      const requestBody = {
        macs: [mac],
      };
      const response = await http.post('/wol/send', requestBody);
      if (response.status !== 200 || response.data.code !== 0) {
        const title = 'Wakeup WOL devices.';
        const message = response.data.msg || 'Failed to wake up WOL devices.';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Wakeup WOL devices.';
      const message = error.message || 'Failed to wake up WOL devices.';
      sendAlert('error', title, message);
    }
  };

  onMounted(loadWol);

  return {
    deviceNameRules,
    macAddressRules,
    loadWol,
    wolList,
    addDevice,
    removeDevice,
    findDeviceByMacId,
    findDeviceByDeviceId,
    totalDevices,
    wakeOnLan,
  };
}
