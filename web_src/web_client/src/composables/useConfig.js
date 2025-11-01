'use strict';

import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import router from '@/router';

const store = useAppStore();
const retainCredentialsValue = ref(false);

export function useConfig() {
  const { sendAlert } = useAlert();

  const apiResetConfig = async () => {
    try {
      const requestBody = {
        retainCredentials: retainCredentialsValue.value,
      };
      const response = await http.post('/security/config/reset', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        router.push('/').catch((error) => console.log(error));
      } else {
        const title = 'Config';
        const message = response.data.msg || 'Failed to reset config';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Config';
      const message = error.message || 'Catch to reset config';
      sendAlert('error', title, message);
    }
  };

  return {
    retainCredentialsValue,
    apiResetConfig,
  };
}
