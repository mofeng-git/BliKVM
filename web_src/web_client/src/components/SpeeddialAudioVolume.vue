<template>
  <v-speed-dial location="bottom end" open-on-hover transition="tab-transition">
    <template v-slot:activator="{ props: activatorProps }">
      <v-tooltip content-class="" location="bottom">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-fab
            v-bind="mergeProps(activatorProps, tooltipProps)"
            size="small"
            :icon="device.video.audioMuted ? 'mdi-volume-mute' : 'mdi-volume-source'"
            :color="device.video.audioMuted || device.isDisconnected ? 'error' : 'success'"
            @click="toggleAudio"
          />
        </template>
        <span>
          {{ device.video.audioMuted ? 'muted' : `volume ${device.video.audioVolume}` }}
        </span>
      </v-tooltip>
    </template>
  </v-speed-dial>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { mergeProps } from 'vue';

  const store = useAppStore();
  const { device } = useDevice();
  const { video } = storeToRefs(store);

  const toggleAudio = () => {
    device.value.video.audioVolume = 0;
  };
</script>
