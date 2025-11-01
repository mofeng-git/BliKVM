'use strict';

import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const { security, account } = storeToRefs(store);
const twoFaAuthQrCode = ref('');
const twoFaSecret = ref('');
const stepper = ref(1);

export function useAuthentication() {
  const { sendAlert } = useAlert();

  const getTwoFaInfo = async () => {
    try {
      const requestBody = {
        username: account.value.user || '',
      };
      const response = await http.post('/2fa/info', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        if (response.data.data) {
          security.value.is2FaEnabled = response.data.data.enable;
          if (security.value.is2FaEnabled === true) {
            stepper.value = 3;
          } else {
            stepper.value = 1;
          }
          twoFaAuthQrCode.value = response.data.data.qrCode;
          twoFaSecret.value = response.data.data.secret;
        }
      } else {
        const title = 'Authentication';
        const message = response.data.msg || 'Failed to get 2fa state';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Authentication';
      const message = error.message || 'Catch to get 2fa state';
      sendAlert('error', title, message);
    }
  };

  const apiAuthEnabled = async (value) => {
    try {
      console.log('apiAuthEnabled called with value:', value);
      let authEnabled;
      if (value === 'disabled') {
        authEnabled = false;
      } else {
        authEnabled = true;
      }
      const requestBody = {
        auth: authEnabled,
      };
      const response = await http.post('/auth', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        if (response.data.data) {
          security.value.isAuthEnabled = response.data.data.auth;
        }
      } else {
        const title = 'Authentication';
        const message = response.data.msg || 'Failed to toggle auth';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Authentication';
      const message = error.message || 'Catch to toggle auth';
      sendAlert('error', title, message);
    }
  };

  const apiGetAuthState = async () => {
    try {
      const response = await http.get('/auth/state');
      if (response.status === 200 && response.data.code === 0) {
        security.value.isAuthEnabled = response.data.data.auth;
      } else {
        const title = 'Authentication';
        const message = response.data.msg || 'Failed to get auth state';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Authentication';
      const message = error.message || 'Catch to get auth state';
      sendAlert('error', title, message);
    }
  };

  const enableTwoFactorAuth = async (twoFaCode) => {
    if (!twoFaCode) {
      return;
    }
    const requestBody = {
      username: account.value.user,
      code: twoFaCode,
    };
    const response = await http.post('/2fa?action=enable', requestBody);
    if (response.status === 200 && response.data.code === 0) {
      getTwoFaInfo();
    }
  };

  const disableTwoFactorAuth = async (twoFaCode) => {
    const requestBody = {
      username: account.value.user,
      code: twoFaCode,
    };
    const response = await http.post('/2fa?action=disable', requestBody);
    if (response.status === 200 && response.data.code === 0) {
      getTwoFaInfo();
    }
  };

  return {
    stepper,
    twoFaAuthQrCode,
    twoFaSecret,
    getTwoFaInfo,
    apiAuthEnabled,
    enableTwoFactorAuth,
    apiGetAuthState,
    disableTwoFactorAuth,
  };
}
