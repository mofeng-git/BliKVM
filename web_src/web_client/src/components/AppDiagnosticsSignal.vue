<template>
  <v-overlay
    :model-value="showDiagnostics"
    :opacity="0"
    contained
    content-class="d-flex flex-column align-center justify-end w-100 h-100"
    :style="{ pointerEvents: 'none' }"
  >
    <!--
   <v-hover v-slot="{ isHovering, props }">  
-->

    <v-spacer />

    <!-- Center control bar -->
    <v-fade-transition>
      <div
        v-if="!device.video.isPlaying"
        class="position-absolute"
        style="top: 50%; left: 50%; transform: translate(-50%, -50%)"
      >
        <v-btn icon="undefined" size="180" border="xl" variant="text" text="sdfsf"> </v-btn>
      </div>
    </v-fade-transition>
    <!-- Show different states based on connection status -->
    <div v-if="device.video.connectionState === 'connecting'" class="connecting">
      <v-progress-circular indeterminate color="#76FF03" size="32" width="3" class="mb-2" />
      <div>{{ $t('diagnostics.connecting') || 'Connecting...' }}</div>
    </div>

    <div v-else-if="device.video.connectionState === 'no-signal'" class="connection-failed">
      <v-icon size="32" color="orange" class="mb-2">mdi-alert-circle</v-icon>
      <div>{{ $t('diagnostics.noSignal') }}</div>
      <div v-if="!device.video.isActive" class="text-caption mt-1">
        {{ $t('diagnostics.videoStreamerServerClosed') }}
      </div>
    </div>

    <v-spacer />
  </v-overlay>
</template>

<script setup>
  import { onMounted, onBeforeUnmount } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';

  const store = useAppStore();
  const { device } = useDevice();

  const { showDiagnostics } = storeToRefs(store);

  // Fallback: Show connection timeout after 10 seconds
  // This prevents "Connecting..." from showing forever
  onMounted(() => {
    device.value.video.connectingTimeout = setTimeout(() => {
      if (device.value.video.connectionState === 'connecting') {
        device.value.video.connectionState = 'no-signal';
      }
    }, 10000); // 10 seconds - reasonable wait time
  });

  // Cleanup on unmount
  onBeforeUnmount(() => {
    if (device.value.video.connectingTimeout) {
      clearTimeout(device.value.video.connectingTimeout);
    }
  });
</script>

<style scoped>
  .no-signal {
    font-size: 24px;
    font-weight: bold;
    color: red;
    text-align: center;
  }

  .connecting {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 500;
    color: #76ff03; /* Green color like other UI elements */
    text-align: center;
  }

  .connection-failed {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 500;
    color: orange;
    text-align: center;
  }
</style>
