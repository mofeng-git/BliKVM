'use strict';

import { computed } from 'vue';
import { useDevice } from '@/composables/useDevice.js';
import { useTemperature } from '@/composables/useTemperature.js';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const { systeminfo } = storeToRefs(store);

export function useHealthCheck() {
  const { device } = useDevice();
  const { temperatureConverted } = useTemperature(device);

  const healthStatus = computed(() => {
    const isRamGood =
      1 - device.value.mem.actual / systeminfo.value.memTotal < device.value.health.ramThreshold;
    const isStorageGood =
      1 - device.value.storage.actual / systeminfo.value.storageTotal <
      device.value.health.storageThreshold;
    const isNetworkGood = device.value.networkLatency < device.value.health.networkLatencyThreshold;
    const isTemperatureGood = temperatureConverted.value < device.value.health.temperatureThreshold;

    return isRamGood && isStorageGood && isNetworkGood && isTemperatureGood ? 'Good' : 'Critical';
  });

  const healthIconColor = computed(() => {
    switch (healthStatus.value) {
      case 'Good':
        device.value.health.status = 'Good';
        return '#76FF03';
      case 'Degraded':
        device.value.health.status = 'Degraded';
        return 'orange';
      case 'Critical':
        device.value.health.status = 'Critical';
        return 'red';
      default:
        device.value.health.status = 'Critical';
        return 'red';
    }
  });

  const healthDetails = computed(() => {
    const ramUsage = ((device.value.mem.actual / systeminfo.value.memTotal) * 100).toFixed(1);
    const storageUsage = (
      (device.value.storage.actual / systeminfo.value.storageTotal) *
      100
    ).toFixed(1);

    return {
      ram: {
        usage: ramUsage,
        isGood:
          1 - device.value.mem.actual / systeminfo.value.memTotal <
          device.value.health.ramThreshold,
      },
      storage: {
        usage: storageUsage,
        isGood:
          1 - device.value.storage.actual / systeminfo.value.storageTotal <
          device.value.health.storageThreshold,
      },
      network: {
        latency: device.value.networkLatency,
        isGood: device.value.networkLatency < device.value.health.networkLatencyThreshold,
      },
      temperature: {
        value: temperatureConverted.value,
        isGood: temperatureConverted.value < device.value.health.temperatureThreshold,
      },
    };
  });

  return {
    healthStatus,
    healthIconColor,
    healthDetails,
  };
}
