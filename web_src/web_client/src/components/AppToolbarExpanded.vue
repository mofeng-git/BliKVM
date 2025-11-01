<template>
  <v-tooltip location="top" content-class="">
    <template v-slot:activator="{ props: tooltipProps }">
      <v-icon
        class="toolbar-icon"
        v-bind="tooltipProps"
        :color="device.atx.isPowerLedActive ? '#76FF03' : '#D32F2F'"
        style="cursor: default"
        >mdi-power</v-icon
      >
    </template>
    <span
      >{{ $t('settings.atx.iconInfo') }}
      {{ device.atx.isPowerLedActive ? $t('common.active') : $t('common.inactive') }}</span
    >
  </v-tooltip>

  <v-tooltip location="top" content-class="">
    <template v-slot:activator="{ props: tooltipProps }">
      <v-icon
        class="toolbar-icon"
        v-bind="tooltipProps"
        :color="device.atx.isHDDLedActive ? '#76FF03' : '#D32F2F'"
        style="cursor: default"
        >mdi-set-top-box</v-icon
      >
    </template>
    <span
      >{{ $t('settings.atx.ledHdd') }}
      {{ device.atx.isHDDLedActive ? $t('common.active') : $t('common.inactive') }}</span
    >
  </v-tooltip>

  <v-tooltip location="top" content-class="">
    <template v-slot:activator="{ props: tooltipProps }">
      <div
        v-bind="tooltipProps"
        style="cursor: default; display: flex; align-items: center; gap: 4px"
      >
        <!-- <AppOverlaySparkline /> -->
        {{ device.networkLatency }}ms
      </div>
    </template>
    <span>{{ $t('settings.network.latency') }}</span>
  </v-tooltip>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { useDevice } from '@/composables/useDevice';

  const { device } = useDevice();
</script>
