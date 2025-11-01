'use strict';

import { ref } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

export function useNotification() {
  const store = useAppStore();
  const { showNotification, notification } = storeToRefs(store);

  const markAsRead = () => {
    showNotification.value = true;
    // notification.value.items = 0;
  };

  return {
    markAsRead,
  };
}
