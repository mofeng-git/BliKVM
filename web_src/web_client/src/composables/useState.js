'use strict';

import { ref } from 'vue';
import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert';
import router from '@/router';

/**
 * useState - Fetch /api/state (video & kvmdmain status).
 *
 * Exposes only one method:
 * - refresh(): trigger a GET /api/state and handle errors via alert.
 */
export function useState() {
  const { sendAlert } = useAlert();
  const error = ref(null);

  const apiBinState = async () => {
    error.value = null;
    try {
      const res = await http.get('/check/token');
      if (res.status === 200 && res.data.code === 0) {
      } else if (res.status === 401) {
        router.push({ name: 'index' }).catch((error) => console.log(error));
      } else {
        const msg = res.data?.msg || `Request failed (${res.status})`;
        error.value = msg;
        sendAlert('error', 'System State', msg);
      }
    } catch (e) {
      const msg = e?.response?.data?.msg || e?.message || 'Request failed';
      error.value = msg;
      sendAlert('error', 'System State', msg);
    }
  };

  return { apiBinState };
}
