<template>
  <!-- Health Check -->
  <v-expansion-panels v-model="panelProxy" multiple>
    <v-expansion-panel value="health" @group:selected="handlePanelOpen">
      <v-expansion-panel-title>
        <template v-slot:default="{ expanded }">
          <v-row dense no-gutters class="d-flex justify-end align-center">
            <v-col cols="1">
              <v-icon>mdi-hospital</v-icon>
            </v-col>
            <v-col class="d-flex justify-start align-center" cols="4">
              {{ $t('settings.device.healthCheck.title') }}
            </v-col>
            <v-col class="d-flex justify-end align-center">
              <HealthCheck />
            </v-col>
          </v-row>
        </template>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-card-text class="text-medium-emphasis pa-6">
          <div class="text-caption">
            {{ $t('settings.device.healthCheck.ramThreshold') }}
            ({{ convertBytesToGiB(device.mem.actual, 1) }}/{{
              convertBytesToGiB(systeminfo.memTotal)
            }}GB)
          </div>
          <v-row dense no-gutters>
            <v-col cols="*">
              <v-slider
                v-model="device.health.ramThreshold"
                :max="1"
                :min="0.1"
                :step="0.1"
                v-ripple
                :color="ramThresholdColor"
                :track-fill-color="ramThresholdColor"
                @end="onSetHealthThreshold"
              >
                <template v-slot:append>
                  <div
                    :style="{
                      color: ramThresholdColor,
                      fontWeight: 'bold',
                      minWidth: '50px',
                      textAlign: 'right',
                    }"
                  >
                    {{ Math.round(device.health.ramThreshold * 100) }}%
                  </div>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <div class="text-caption">
            {{ $t('settings.device.healthCheck.storageThreshold') }}
            ({{ convertBytesToGiB(device.storage.actual) }}/{{
              convertBytesToGiB(systeminfo.storageTotal)
            }}GB)
          </div>

          <v-row dense no-gutters>
            <v-col cols="*">
              <v-slider
                v-model="device.health.storageThreshold"
                :max="1"
                :min="0.1"
                :step="0.1"
                v-ripple
                :color="storageColor"
                :track-fill-color="storageColor"
                @end="onSetHealthThreshold"
              >
                <template v-slot:append>
                  <div
                    :style="{
                      color: storageColor,
                      fontWeight: 'bold',
                      minWidth: '50px',
                      textAlign: 'right',
                    }"
                  >
                    {{ Math.round(device.health.storageThreshold * 100) }}%
                  </div>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <div class="text-caption">
            {{ $t('settings.device.healthCheck.networkLatencyThreshold') }}
            ({{ $t('common.current') }} {{ device.networkLatency }}ms)
          </div>

          <v-row dense no-gutters>
            <v-col cols="*">
              <v-slider
                v-model="device.health.networkLatencyThreshold"
                :max="200"
                :min="1"
                :step="1"
                tick-size="4"
                v-ripple
                :color="netWorkColor"
                :track-fill-color="netWorkColor"
                @end="onSetHealthThreshold"
              >
                <template v-slot:append>
                  <div
                    :style="{
                      color: netWorkColor,
                      fontWeight: 'bold',
                      minWidth: '60px',
                      textAlign: 'right',
                    }"
                  >
                    {{ device.health.networkLatencyThreshold }}ms
                  </div>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <div class="text-caption">
            {{ $t('settings.device.healthCheck.temperatureThreshold') }}
            ({{ $t('common.current') }} {{ temperatureConverted }}°{{ misc.temperatureUnit }})
          </div>

          <v-row dense no-gutters>
            <v-col cols="*">
              <v-slider
                :key="misc.temperatureUnit"
                v-model="tempThresholdDisplay"
                :max="tempMax"
                :min="tempMin"
                :step="1"
                tick-size="4"
                v-ripple
                :color="temperatureColor"
                :track-fill-color="temperatureColor"
                @end="onSetHealthThreshold"
              >
                <template v-slot:append>
                  <div
                    :style="{
                      color: temperatureColor,
                      fontWeight: 'bold',
                      minWidth: '50px',
                      textAlign: 'right',
                    }"
                  >
                    {{ tempThresholdDisplay }}°{{ misc.temperatureUnit }}
                  </div>
                </template>
              </v-slider>
            </v-col>
          </v-row>
        </v-card-text>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
  import { computed } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice.js';
  import { useConversion } from '@/composables/useConversion.js';
  import { useAppStore } from '@/stores/stores';
  import { useTemperature } from '@/composables/useTemperature.js';
  import { useHealth } from '@/composables/useHealth.js';

  // v-model:innerPanel support
  const props = defineProps({
    innerPanel: { type: Array, default: () => [] },
    // Delegate saving action to parent (optional)
    setHealthThreshold: { type: Function, default: null },
  });
  const emit = defineEmits(['update:innerPanel']);
  const panelProxy = computed({
    get: () => props.innerPanel,
    set: (val) => emit('update:innerPanel', val),
  });

  const { device } = useDevice();
  const { convertBytesToGiB } = useConversion();
  const store = useAppStore();
  const { misc, systeminfo } = storeToRefs(store);
  const { temperatureConverted, tempThresholdDisplay, tempMax, tempMin, temperatureColor } =
    useTemperature(device);
  const { getHealthThreshold } = useHealth();

  const ramThresholdColor = computed(() => {
    return 1 - device.value.mem.actual / systeminfo.value.memTotal <
      device.value.health.ramThreshold
      ? '#76FF03'
      : 'red';
  });

  const storageColor = computed(() => {
    return 1 - device.value.storage.actual / systeminfo.value.storageTotal <
      device.value.health.storageThreshold
      ? '#76FF03'
      : 'red';
  });

  const netWorkColor = computed(() => {
    return device.value.networkLatency < device.value.health.networkLatencyThreshold
      ? '#76FF03'
      : 'red';
  });

  const handlePanelOpen = async (selected) => {
    if (typeof selected === 'object' && selected && 'value' in selected) {
      selected = selected.value;
    }
    if (!selected) return;
    // Load thresholds on open
    getHealthThreshold();
  };

  const onSetHealthThreshold = () => {
    if (typeof props.setHealthThreshold === 'function') {
      props.setHealthThreshold();
    }
  };
</script>

<style scoped></style>
