<template>
  <v-speed-dial location="left center" open-on-hover transition="tab-transition">
    <template v-slot:activator="{ props: activatorProps }">
      <v-tooltip content-class="" location="bottom">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-fab
            v-bind="mergeProps(activatorProps, tooltipProps)"
            size="small"
            :icon="device.isDisconnected ? 'mdi-signal-off' : 'mdi-signal'"
            color="success"
            content-class=""
          />
        </template>
        <span> wifi / cabled? </span>
      </v-tooltip>
    </template>
  </v-speed-dial>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import router from '@/router';
  import { mergeProps } from 'vue';
  import { useDevice } from '@/composables/useDevice';

  const route = useRoute();

  const store = useAppStore();
  const { device } = useDevice();
</script>
