<template>
  <div class="py-2">
    <v-sparkline
      v-if="values.length >= 2"
      :model-value="values"
      color="#76FF03"
      gradient-direction="left"
      style="width: 50"
      height="35"
      line-width="10"
      type="trend"
      :min="0"
      :max="100"
      padding="25"
      smooth
      auto-draw
      auto-draw-easing
    >
    </v-sparkline>

    <div v-else>No data available</div>
  </div>
</template>

<script setup>
  import { useDevice } from '@/composables/useDevice';

  //TODO
  //https://chatgpt.com/c/68474824-b350-8010-95b2-994ecf9fee9e

  const { device } = useDevice();
  //const data = ref([]);
  //const color = ref("#da5656");

  /*
// Watch networkLatency changes
watch(
  () => device.value.networkLatency,
  (newLatency) => {
    if (isValidNumber(newLatency)) {
      data.value.unshift(newLatency);
      if (data.value.length > 15) data.value.pop();
    } else {
      console.warn("Ignored invalid latency:", newLatency);
    }
  }
);
*/

  const dataPoints = ref([]); // { time: timestamp, value: number }
  const color = '#76FF03';
  const WINDOW_SECONDS = 5;

  function isValidNumber(n) {
    return typeof n === 'number' && !isNaN(n) && isFinite(n);
  }

  // Add new data point with current timestamp
  function addDataPoint(value) {
    if (!isValidNumber(value)) return;
    const now = Date.now();
    console.log('Adding data point:', { time: now, value });
    dataPoints.value.push({ time: now, value });
    cleanupOldData(now);
  }

  // Remove points older than 30 seconds
  function cleanupOldData(now) {
    const cutoff = now - WINDOW_SECONDS * 1000;
    while (dataPoints.value.length && dataPoints.value[0].time < cutoff) {
      dataPoints.value.shift();
    }
  }

  // Compute only the values for the sparkline from current dataPoints
  const values = computed(() => dataPoints.value.map((p) => p.value));

  let timer = null;

  onMounted(() => {
    timer = setInterval(() => {
      const simulatedLatency = Math.random() * 100 + 10; // 10-110
      addDataPoint(simulatedLatency);
    }, 500);
  });

  onBeforeUnmount(() => {
    clearInterval(timer);
  });
</script>

<style scoped>
  .green-text {
    color: #76ff03;
  }
</style>
