'use strict';

import { ref } from 'vue';
import { useTheme } from 'vuetify';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

export function useToggleTheme() {
  const store = useAppStore();
  const { isDarkTheme, isProcessing } = storeToRefs(store);
  const theme = useTheme();

  const error = ref(null);

  const toggleTheme = async () => {
    isProcessing.value = true; // This should trigger the watcher
    error.value = null;

    try {
      const newTheme = isDarkTheme.value ? 'dark' : 'light';
      theme.global.name.value = newTheme;
    } catch (error) {
      console.error('Error during theme toggle:', error);
      error.value = error;
    } finally {
      isProcessing.value = false; // This should also trigger the watcher
    }
  };

  return {
    isProcessing,
    error,
    isDarkTheme,
    toggleTheme,
  };
}
