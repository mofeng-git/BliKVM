'use strict';

import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert';
import { useAppStore } from '@/stores/stores';
import { ref } from 'vue';
import { useDevice } from '@/composables/useDevice';

const { device } = useDevice();
const prometheusActiveValue = ref(false);

export function usePrometheus() {
  const { sendAlert } = useAlert();

  const apiPrometheusState = async (selected) => {
    try {
      if (selected && typeof selected === 'object' && 'value' in selected) {
        selected = selected.value;
      }
      if (!selected) return;
      const response = await http.get('/prometheus');
      if (response.status === 200 && response.data.code === 0) {
        prometheusActiveValue.value = response.data.data.enable || false;
      } else {
        const title = 'Prometheus';
        const message = response.data.msg || 'Failed to get state';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Prometheus';
      const message = error.message || 'Catch to get state';
      sendAlert('error', title, message);
    }
  };

  const apiPrometheusActive = async (isActive) => {
    try {
      const requestBody = {
        enable: isActive,
      };
      console.log('apiPrometheusActive called with value:', requestBody);

      const response = await http.post('/prometheus', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        prometheusActiveValue.value = response.data.data.enable || false;
      } else {
        const title = 'Prometheus';
        const message = response.data.msg || 'Failed to active Prometheus';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Prometheus';
      const message = error.message || 'Catch to active Prometheus';
      sendAlert('error', title, message);
    }
  };

  return {
    prometheusActiveValue,
    apiPrometheusState,
    // keep both names temporarily to avoid breaking callers
    apiPrometheusActive,
  };
}
