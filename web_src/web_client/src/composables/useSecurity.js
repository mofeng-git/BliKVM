'use strict';

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const { security } = storeToRefs(store);

export function useSecurity(device) {
  const { t } = useI18n();

  const iconSessionDataList = computed(() => [
    {
      duration: 1,
      text: '1 hour',
      color: 'success',
      tooltip: t(''),
    },
    {
      duration: 4,
      text: '4 hour',
      color: 'success',
      tooltip: t(''),
    },
    {
      duration: 12,
      text: '12 hours',
      color: 'success',
      tooltip: t(''),
    },
    {
      duration: -1,
      text: 'until restart',
      color: 'success',
      tooltip: t(''),
    },
  ]);

  // TODO
  const sessionDuration = ref(security.value.sessionDuration || -1);

  // Function to handle duration
  const setSessionDuration = (duration) => {
    security.value.sessionDuration = duration; // Update the current duration

    // Set the session duration in localStorage with the expiration time
    const sessionKey = 'sessionDuration';
    localStorage.setItem(sessionKey, duration);
  };

  // Optionally, set an expiration time (in milliseconds)
  const expirationTime = Date.now() + sessionDuration * 60 * 1000; // 30 minutes from now
  localStorage.setItem('sessionExpiration', expirationTime);

  const resetConfig = async (device) => {
    try {
      //      const response = await apiClient.resetConfig(device);
      console.log('Reset successful:', response.data);
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  return {
    iconSessionDataList,
    setSessionDuration,
    resetConfig,
  };
}
