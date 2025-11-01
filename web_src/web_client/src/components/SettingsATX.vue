<template>
  <v-expansion-panel value="power-management" @group:selected="getATXActive">
    <v-expansion-panel-title>
      <template v-slot:default="{ expanded }">
        <v-card class="transparent-card" density="compact" tile width="100%">
          <v-row no-gutters class="d-flex justify-start align-center">
            <v-col cols="1">
              <v-icon>mdi-power-settings</v-icon>
            </v-col>
            <v-col class="d-flex justify-start align-center" cols="8">
              {{ $t('settings.atx.title') }}
            </v-col>
            <v-col
              cols="3"
              class="d-flex justify-end align-center"
              :style="{
                color: device.isATXActive ? '#76FF03' : '#D32F2F',
              }"
            >
              <v-chip>
                {{ device.isATXActive ? $t('common.active') : $t('common.unavailable') }}
              </v-chip>
            </v-col>
          </v-row>
          <v-row v-if="expanded" dense>
            <v-col cols="*">
              <v-card-subtitle>
                {{ $t('settings.atx.subtitle') }}
              </v-card-subtitle>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-card-text class="text-medium-emphasis pa-6">
        <v-row dense no-gutters>
          <v-col cols="*">
            <v-switch
              v-model="device.isATXActive"
              inset
              :label="$t('settings.atx.showATXField')"
              v-ripple
              color="#76FF03"
              @update:modelValue="setATXActive"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
  import { useDevice } from '@/composables/useDevice.js';
  import { onMounted } from 'vue';
  import http from '@/utils/http.js';
  import { useAlert } from '@/composables/useAlert';

  const { device } = useDevice();
  const { sendAlert } = useAlert();

  async function getATXActive(selected) {
    try {
      if (!selected) return;
      const response = await http.get('/atx');
      if (response.status === 200 && response.data.code === 0) {
        device.value.isATXActive = response.data.data.isActive;
      } else {
        const title = 'ATX active';
        const message = response.data.msg || 'Failed to get ATX active status';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'ATX active';
      const message = error.message || 'Failed to get ATX active status';
      sendAlert('error', title, message);
    }
  }

  async function setATXActive(value) {
    try {
      const requestBody = {
        isActive: value,
      };
      const response = await http.post('/atx', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        device.value.isATXActive = response.data.data.isActive;
      } else {
        const title = 'ATX active';
        const message = response.data.msg || 'Failed to set ATX active status';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'ATX active';
      const message = error.message || 'Failed to set ATX active status';
      sendAlert('error', title, message);
    }
  }

  onMounted(() => {});
</script>
