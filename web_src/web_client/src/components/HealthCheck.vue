<template>
  <v-tooltip text="Tooltip" location="bottom" content-class="">
    <template v-slot:activator="{ props }">
      <v-chip :color="healthIconColor">
        <v-icon>mdi-heart-pulse</v-icon>
      </v-chip>
    </template>
    {{ device.health.status }}
  </v-tooltip>
</template>

<script setup>
  import { useDevice } from '@/composables/useDevice.js';
  import { useHealthCheck } from '@/composables/useHealthCheck.js';

  const { device } = useDevice();
  const { healthIconColor } = useHealthCheck();
</script>
