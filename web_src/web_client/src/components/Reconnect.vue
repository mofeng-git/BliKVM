<template>
  <v-dialog
    v-model="device.isDisconnected"
    @keydown.stop
    @keyup.stop
    max-width="500px"
    :persistent="isReconnecting"
    :z-index="zIndex.modal"
  >
    <v-card rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="#D32F2F" icon="mdi-wifi-off" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block">
              {{ $t('diagnostics.connectionLost') }}
            </strong>
          </template>

          <div class="d-flex align-center mb-4">
            <v-progress-circular
              v-if="isReconnecting"
              :model-value="progressPercentage"
              :indeterminate="false"
              color="#76FF03"
              size="24"
              width="3"
              class="mr-3"
            >
            </v-progress-circular>
            <v-icon v-else color="warning" class="mr-3" size="24">mdi-alert-circle</v-icon>

            <div class="flex-grow-1">
              <div v-if="isReconnecting" class="text-body-2 mb-2">
                {{ $t('diagnostics.reconnectMessage', { countdownDisplay }) }}
              </div>
              <div v-else class="text-body-2 mb-2">
                {{ $t('diagnostics.reconnectStopMessage') }}
              </div>
            </div>
          </div>

          <div class="text-body-2 text-medium-emphasis">
            {{ $t('diagnostics.connectionLostDetail') }}
          </div>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-card-actions class="bg-surface-light">
        <v-spacer />

        <v-btn
          border
          class="text-none"
          color="white"
          :text="$t('common.dismiss')"
          variant="tonal"
          @click="dismiss"
        />

        <v-btn
          border
          class="text-none"
          color="white"
          :text="$t('diagnostics.reloadWindow')"
          variant="tonal"
          @click="reload"
        />

        <v-btn
          class="text-none"
          color="#76FF03"
          :text="$t('diagnostics.retryNow')"
          variant="tonal"
          :disabled="!isReconnecting"
          @click="retryNow"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { computed } from 'vue';
  import { useDevice } from '@/composables/useDevice';
  import { useConnection } from '@/composables/useConnection';
  import { zIndex } from '@/styles/zIndex';

  const { device } = useDevice();
  const { isProcessing, countdownSeconds, reload, retryConnection, maxCountdownSeconds } =
    useConnection(device);

  const isReconnecting = computed(() => {
    // With infinite retries, we're always reconnecting unless user cancels
    return !device.value.userCancelledReconnect && device.value.isDisconnected;
  });

  const countdownDisplay = computed(() => {
    return countdownSeconds.value || '0';
  });

  const progressPercentage = computed(() => {
    if (!maxCountdownSeconds.value || maxCountdownSeconds.value === 0) return 0;
    const remaining = countdownSeconds.value || 0;
    return Math.round(((maxCountdownSeconds.value - remaining) / maxCountdownSeconds.value) * 100);
  });

  const retryNow = () => {
    // Clear existing timeout and retry immediately
    if (device.value.reconnectTimeout) {
      clearTimeout(device.value.reconnectTimeout);
      device.value.reconnectTimeout = null;
    }
    // Reset count to get 10-second delay on manual retry
    device.value.reconnectCount = 0;
    retryConnection();
  };

  const dismiss = () => {
    // Set flag to stop reconnection attempts
    device.value.userCancelledReconnect = true;

    // Clear any pending reconnection
    if (device.value.reconnectTimeout) {
      clearTimeout(device.value.reconnectTimeout);
      device.value.reconnectTimeout = null;
    }

    // Hide dialog
    device.value.isDisconnected = false;

    // Reset for next disconnection
    device.value.lastDisconnectTime = null;
    device.value.reconnectCount = 0;
  };
</script>
