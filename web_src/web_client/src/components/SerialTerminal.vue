<template>
  <v-card-text class="text-medium-emphasis pa-6">
    <v-form ref="form">
      <!-- serial port -->

      <!-- baudrate -->
      <v-row dense no-gutters>
        <v-col cols="12">
          <label class="text-subtitle-1 font-weight-medium mb-2 d-block">
            {{ $t('settings.serial.serialPortField') }}</label
          >

          <div class="d-flex align-center ga-2">
            <v-select
              v-model="serial.serialFile"
              :items="serialPortList"
              item-title="name"
              item-value="value"
              variant="outlined"
              rounded="lg"
              density="compact"
              tile
              v-ripple
              color="#76FF03"
            ></v-select>
          </div>
        </v-col>

        <v-col cols="12">
          <label class="text-subtitle-1 font-weight-medium mb-2 d-block">
            {{ $t('settings.serial.baudrateField') }}</label
          >

          <div class="d-flex align-center ga-2">
            <v-select
              v-model="serial.baudrate"
              :items="serialBaudrateList"
              item-title="name"
              item-value="value"
              variant="outlined"
              rounded="lg"
              density="compact"
              tile
              v-ripple
              color="#76FF03"
            ></v-select>
          </div>
        </v-col>
      </v-row>
    </v-form>
  </v-card-text>
</template>

<script setup>
  import { onMounted } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const store = useAppStore();
  const { serial } = storeToRefs(store);

  import { useSerialPorts } from '@/composables/useSerialTerminal';

  const { getPortList, serialPortList, serialBaudrateList } = useSerialPorts();

  onMounted(() => {
    getPortList();
  });
</script>
