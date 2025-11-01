// useToggleHid.js
'use strict';

import { ref } from 'vue';
import axios from 'axios';

import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();

const { isHidActive } = storeToRefs(store);

export function useToggleHid() {
  const isProcessing = ref(false);
  const error = ref(null);
  const hidOrg = isHidActive.value;

  const toggleHid = async () => {
    isProcessing.value = true;
    error.value = null;
    try {
      const action = isHidActive.value ? 'enable' : 'disable';
      const response = await axios.post(`/hid?action=${action}`);
      if (response.status === 200 && response.data.code === 0) {
        console.log(`${action} success`);
      } else {
        console.log(`${action} error`);
      }
    } catch (error) {
      // for testing console("hid error");
      isHidActive.value = !hidOrg;
      console.error('Error during HID toggle:', error);
      error.value = error;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    isProcessing,
    error,
    isHidActive,
    toggleHid,
  };
}
