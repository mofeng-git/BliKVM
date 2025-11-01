'use strict';

import { ref, onMounted } from 'vue';
import http from '@/utils/http.js';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

export function useWebhook() {
  const store = useAppStore();

  const webhookList = ref({ items: [], events: [] });

  const loadWebhook = async () => {
    try {
      const response = await fetch('/data/webhook.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      webhookList.value.items = data.items || [];
      webhookList.value.events = data.events || []; // Make sure to populate events
      // console.log(webhookList.value.items);
      // console.log(webhookList.value.events);  // Log events for debugging
    } catch (error) {
      console.error('Failed to load webhook:', error);
    }
  };

  onMounted(loadWebhook);

  return {
    loadWebhook,
    webhookList,
  };
}
