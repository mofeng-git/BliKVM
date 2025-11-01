<!--
****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
****************************************************************************
-->
<template>
  <v-sheet class="mx-auto wrap-text">
    <v-expansion-panels v-model="expandedPanels" multiple>
      <!-- Dynamically rendered items -->
      <template v-if="kvmSwitch.items.length > 0">
        <template v-for="(item, index) in kvmSwitch.items" :key="item.id">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <template v-slot:default="{ expanded }">
                <v-row dense no-gutters>
                  <v-col cols="1">
                    <v-icon color="#76FF03">mdi-cable-data</v-icon>
                  </v-col>
                  <v-col class="d-flex justify-start align-center" cols="8">
                    <template v-if="$vuetify.display.smAndUp">
                      <v-divider
                        class="mx-3 align-self-center"
                        length="24"
                        thickness="0"
                        vertical
                      ></v-divider>
                    </template>
                    {{ item.title }} <br />
                    {{ item.subtitle }}
                  </v-col>
                  <v-col
                    class="d-flex justify-end align-center"
                    :style="{
                      color: '#76FF03',
                    }"
                  >
                    <v-chip v-if="kvmSwitch.isActive">
                      {{ kvmSwitch.activeSwitchId === item.id ? $t('common.active') : '' }}
                    </v-chip>
                  </v-col>
                </v-row>
              </template>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-card-text class="text-medium-emphasis pa-6">
                <v-row>
                  <v-col cols="12">
                    <v-switch
                      :model-value="kvmSwitch.isActive && kvmSwitch.activeSwitchId === item.id"
                      inset
                      :label="$t('settings.switch.activeField')"
                      color="#76FF03"
                      @update:modelValue="(val) => toggleSwitch(val, item.id)"
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="item.deviceFile"
                      :label="$t('settings.switch.deviceFile')"
                      density="compact"
                      color="#76FF03"
                      :color="device.kvmSwitch.isActive ? '#76FF03' : ''"
                      clearable
                      @keydown.stop
                      @keypress.stop
                      @keyup.stop
                      @blur="updateDeviceFile(item.id)"
                    />
                  </v-col>
                </v-row>

                <!-- Channel Overrides 2 columns-->
                <v-row v-if="item.channels?.length">
                  <v-col cols="12">
                    <v-row>
                      <v-col v-for="channel in item.channels" :key="channel.name" cols="6">
                        <div
                          class="d-flex text-subtitle-1 align-center"
                          style="padding: 2px 0; min-height: 30px"
                        >
                          <v-text-field
                            v-model="channel.override"
                            :label="`Channel ${channel.name}`"
                            v-ripple
                            dense
                            tile
                            rounded="lg"
                            color="#76FF03"
                            density="compact"
                            variant="outlined"
                            hide-details
                            single-line
                            clearable
                            @keydown.stop
                            @keypress.stop
                            @keyup.stop
                            @blur="updateChannelLable(item.id)"
                          />
                        </div>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </template>
      </template>
    </v-expansion-panels>
  </v-sheet>
</template>

<script setup>
  import { ref } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { useHdmiSwitch } from '@/composables/useHdmiSwitch';
  import { useAlert } from '@/composables/useAlert.js';

  const { sendAlert } = useAlert(alert);
  // Define the props and use v-model binding
  const props = defineProps({
    label: String,
    index: Number,
    modelValue: Boolean, // Auto-bound for v-model:is-menu-visible
  });

  const { device } = useDevice();

  const expandedPanels = ref([]);

  const emit = defineEmits(['update:modelValue']);

  const { kvmSwitch, updateHDMISwitch, activateHDMISwitch, loadHdmiSwitch } = useHdmiSwitch();

  const updateDeviceFile = async (id) => {
    try {
      updateHDMISwitch(id);
    } catch (error) {
      const title = 'Switch Error';
      const message = error.message || 'An error occurred while updating the device file.';
      sendAlert('error', title, message);
    }
  };

  const updateChannelLable = async (id) => {
    try {
      updateHDMISwitch(id);
    } catch (error) {
      const title = 'Switch Error';
      const message = error.message || 'An error occurred while updating the device file.';
      sendAlert('error', title, message);
    }
  };

  const toggleSwitch = async (val, id) => {
    try {
      activateHDMISwitch(val, id);
    } catch (error) {
      const title = 'Switch Error';
      const message = error.message || 'An error occurred while toggling the switch.';
      sendAlert('error', title, message);
    }
  };

  onMounted(async () => {});
</script>
