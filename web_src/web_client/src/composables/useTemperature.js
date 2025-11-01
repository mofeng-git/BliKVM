'use strict';

import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

const c2f = (c) => (c * 9) / 5 + 32;
const f2c = (f) => ((f - 32) * 5) / 9;

export function useTemperature(device) {
  const store = useAppStore();
  const { misc } = storeToRefs(store);

  //
  const temperatureColor = computed(() => {
    // temperatureConverted
    const currentTempC =
      misc.value.temperatureUnit === 'C'
        ? +temperatureConverted.value
        : f2c(+temperatureConverted.value);
    const thresholdC = +device.value.health.temperatureThreshold;
    return currentTempC < thresholdC ? '#76FF03' : 'red';
  });

  // tick
  const tickLabels = computed(() => {
    return misc.value.temperatureUnit === 'C'
      ? { 0: 'min', 100: 'max' }
      : { 32: 'min', 212: 'max' };
  });

  const temperatureConverted = computed(() => {
    const temp = device.value.board.cpu.temperature;
    if (temp === undefined || temp === null) return 0; // Default if undefined

    return misc.value.temperatureUnit === 'F' ? Math.round((temp * 9) / 5 + 32) : Math.round(temp);
  });

  const tempThresholdDisplay = computed({
    get() {
      const c = device.value.health.temperatureThreshold ?? 0;
      const ret = misc.value.temperatureUnit === 'C' ? Math.round(c) : Math.round(c2f(c));
      return ret;
    },
    set(v) {
      if (v == null || Number.isNaN(+v)) return;
      device.value.health.temperatureThreshold = misc.value.temperatureUnit === 'C' ? +v : f2c(+v);
    },
  });

  // slider
  const tempMin = computed(() => (misc.value.temperatureUnit === 'C' ? 0 : 32));
  const tempMax = computed(() => (misc.value.temperatureUnit === 'C' ? 100 : 212));

  return { temperatureConverted, tempThresholdDisplay, tempMax, tempMin, temperatureColor };
}
