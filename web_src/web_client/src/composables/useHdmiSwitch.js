'use strict';

import { onMounted } from 'vue';
import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert.js';

const { sendAlert } = useAlert();

// Initialize hdmiSwitch as an object with items array
const kvmSwitch = ref({ items: [] });

export function useHdmiSwitch() {
  const updateHDMISwitch = async (index) => {
    try {
      console.log('Updating HDMI switch index: ', index, kvmSwitch.value);
      const requestPathBody = {
        id: index,
        title: kvmSwitch.value.items[index - 1].title,
        subtitle: kvmSwitch.value.items[index - 1].subtitle,
        channelCount: kvmSwitch.value.items[index - 1].channelCount,
        deviceFile: kvmSwitch.value.items[index - 1].deviceFile,
        activeChannel: kvmSwitch.value.items[index - 1].activeChannel,
        channels: kvmSwitch.value.items[index - 1].channels,
      };

      console.log('Request body for updating HDMI switch:', requestPathBody);

      const response = await http.post(`/switch/${index}/update`, requestPathBody);

      if (response.status === 200 && response.data.code === 0) {
        // Update the kvmSwitch object with the new data
        kvmSwitch.value = response.data.data.kvmSwitch;
        console.log('switch set config successfully:', response.data);
      } else {
        console.error('Failed to set switch config:', response);
      }
    } catch (error) {
      console.error('set switch config error:', error);
    }
  };

  const activateHDMISwitch = async (value, id) => {
    try {
      const requestPathBody = {
        isActive: value,
      };
      const response = await http.post(`/switch/${id}/activate`, requestPathBody);
      if (response.status === 200 && response.data.code === 0) {
        console.log('HDMI Switch activated successfully');
        // Optionally, you can reload the switch state after activation
        await loadHdmiSwitch();
      }
    } catch (error) {
      console.error('Failed to activate HDMI switch:', error);
    }
  };

  const channelHDMISwitch = async (index) => {
    try {
      const response = await http.post('/switch/channel', { index });
      console.log('Response from /api/switch/channel:', response);
      if (response.status === 200 && response.data.code === 0) {
        console.log('HDMI Switch channel changed successfully');
        // Optionally, you can reload the switch state after changing the channel
        await loadHdmiSwitch();
      }
    } catch (error) {
      console.error('Failed to change HDMI switch channel:', error);
    }
  };

  const loadHdmiSwitch = async (selected = true) => {
    try {
      if (typeof selected === 'object' && selected && 'value' in selected) {
        selected = selected.value;
      }
      if (!selected) return;
      const response = await http.get('/switch');
      //  console.log("Response from /api/switch:", response);
      if (response.status === 200 && response.data.code === 0) {
        kvmSwitch.value = response.data.data; // Assign json kvmSwitch object to ref
        // console.log("HDMI Switch loaded successfully:", kvmSwitch.value);
      }
    } catch (error) {
      console.error('Failed to load shortcuts:', error);
    }
  };

  const changeSwitchChannel = async (channelName) => {
    try {
      if (channelName <= 0 || channelName > 16) {
        const status = 'error';
        const title = 'Switch';
        const message = `error channel ${channelName}`;
        sendAlert(status, title, message);
        return;
      }
      const id = kvmSwitch.value.activeSwitchId;
      if (id <= 0 || id > 4) {
        const status = 'error';
        const title = 'Switch';
        const message = `error active id ${id}`;
        sendAlert(status, title, message);
        return;
      }
      const requestBody = {
        channel: channelName,
      };
      const response = await http.post(`/switch/${id}/channel`, requestBody);
      if (response.status === 200 && response.data.code === 0) {
        console.log('set module success');
      }
      kvmSwitch.value.items.forEach((item) => {
        if (item.id === id) {
          item.activeChannel = channelName;
        }
      });
      //
      setTimeout(async () => {
        await loadHdmiSwitch();
      }, 2000); // 延迟 2 秒执行
    } catch (error) {
      console.log(error);
    }
  };

  onMounted(() => {});

  return {
    kvmSwitch,
    loadHdmiSwitch,
    updateHDMISwitch,
    activateHDMISwitch,
    channelHDMISwitch,
    changeSwitchChannel,
  };
}
