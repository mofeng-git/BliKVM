import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { startSession } from '@/composables/session.js';

export function useConnection(device) {
  const store = useAppStore();
  const { isProcessing } = storeToRefs(store);

  const countdownSeconds = ref(0);
  const maxCountdownSeconds = ref(0);
  const nextReconnectTime = ref(null);
  let countdownInterval = null;

  // Calculate next delay based on reconnect count (matches AppKVM.vue logic)
  const calculateNextDelay = () => {
    const currentAttempt = Math.max(0, device.value.reconnectCount - 1);
    // Keep in sync with session.js attemptReconnect() delays (in seconds): [1s, 10s, 20s, 40s]
    const delays = [1, 10, 20, 40];
    return delays[Math.min(currentAttempt, delays.length - 1)];
  };

  // Reloads the current window
  const reload = () => {
    window.location.reload();
  };

  // Retry connection immediately
  const retryConnection = () => {
    try {
      if (device.value.ws && device.value.ws.readyState !== WebSocket.OPEN) {
        stopCountdown();
        // Trigger reconnect by calling startSession directly
        startSession();
      }
    } catch (error) {
      console.error('Error during manual retry:', error);
    }
  };

  // Start countdown logic for reconnection
  const startCountdown = () => {
    if (countdownInterval) return; // Prevent multiple intervals

    isProcessing.value = true;

    const totalSeconds = calculateNextDelay();
    countdownSeconds.value = totalSeconds;
    maxCountdownSeconds.value = totalSeconds;
    nextReconnectTime.value = Date.now() + totalSeconds * 1000;
    countdownInterval = setInterval(() => {
      const remaining = Math.ceil((nextReconnectTime.value - Date.now()) / 1000);
      countdownSeconds.value = Math.max(0, remaining);

      if (countdownSeconds.value <= 0) {
        stopCountdown();
        // Note: Next countdown will be triggered by the watcher when AppKVM.vue sets new reconnectTimeout
      }
    }, 250); // Update every 250ms - balance between smoothness and performance
  };

  // Stop countdown
  const stopCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    countdownSeconds.value = 0;
    maxCountdownSeconds.value = 0;
    nextReconnectTime.value = null;
  };

  // Watch for disconnection status changes
  watch(
    () => device.value.isDisconnected,
    (disconnected) => {
      if (disconnected && !device.value.userCancelledReconnect) {
        // Reset cancel flag on new disconnection
        device.value.userCancelledReconnect = false;
        startCountdown();
      } else {
        stopCountdown();
        isProcessing.value = false;
      }
    }
  );

  // Watch for reconnect timeout changes (when a new reconnect is scheduled)
  watch(
    () => device.value.reconnectTimeout,
    (newTimeout) => {
      if (newTimeout && device.value.isDisconnected && !device.value.userCancelledReconnect) {
        // Restart countdown for next attempt
        startCountdown();
      }
    }
  );

  // On mount, check if already disconnected
  onMounted(() => {
    if (device.value.isDisconnected) {
      startCountdown();
    }
  });

  // Cleanup on unmount
  onUnmounted(stopCountdown);

  return {
    isProcessing,
    reload,
    countdownSeconds,
    maxCountdownSeconds,
    retryConnection,
  };
}
