'use strict';

import { ref } from 'vue';
import axios from 'axios';

export function useSystemOperations() {
  const isLoading = ref(false);
  const error = ref(null);

  const reboot = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await axios.post('/reboot');
      if (response.status === 200 && response.data.code === 0) {
        console.log('Reboot success');
      } else {
        console.log('Reboot error');
      }
    } catch (err) {
      console.error('Reboot error:', err);
      error.value = err;
    } finally {
      isLoading.value = false;
    }
  };

  const shutdown = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await axios.post('/shutdown');
      if (response.status === 200 && response.data.code === 0) {
        console.log('Shutdown success');
      } else {
        console.log('Shutdown error');
      }
    } catch (err) {
      console.error('Shutdown error:', err);
      error.value = err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    reboot,
    shutdown,
  };
}
