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
    <v-card-subtitle>
      {{ $t('settings.network.wol.subtitle') }}
    </v-card-subtitle>

    <v-card class="mx-auto wrap-text" @click.stop="keepMenuOpen">
      <v-list select-strategy="leaf">
        <v-list-item>
          <v-list-item-title>
            <v-btn-group density="compact" rounded="lg" v-ripple variant="tonal">
              <v-btn
                v-tooltip="$t('settings.network.wol.refreshList')"
                class="flex-grow-1 text-none"
                prepend-icon="mdi-refresh"
                color="#76FF03"
                v-ripple
                tile
                @click.stop="handleMenuItemClick('refresh')"
                >{{ $t('common.refresh') }}</v-btn
              >
            </v-btn-group>
          </v-list-item-title>
        </v-list-item>

        <v-list-item v-for="(item, index) in wolList.items" :key="item.mac">
          <v-list-item-title>
            <v-row dense class="d-flex justify-start align-center">
              <v-col cols="6">
                <v-text-field
                  v-model="item.name"
                  minlength="1"
                  :rules="deviceNameRules"
                  density="compact"
                  tile
                  rounded="lg"
                  v-ripple
                  color="#76FF03"
                  variant="outlined"
                  placeholder="Device name"
                  hide-details
                  single-line
                >
                </v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="item.mac"
                  maxlength="17"
                  :rules="macAddressRules"
                  density="compact"
                  tile
                  rounded="lg"
                  v-ripple
                  color="#76FF03"
                  variant="outlined"
                  placeholder="Mac address"
                  hide-details
                  single-line
                >
                </v-text-field>
              </v-col>
            </v-row>
            <v-row dense class="d-flex justify-end align-center">
              <v-col cols="auto" class="d-flex flex-row align-end justify-center" style="gap: 8px">
                <v-btn-group
                  density="compact"
                  rounded="lg"
                  v-ripple
                  variant="tonal"
                  group
                  selected-class="selected-orientation"
                >
                  <v-btn
                    class="flex-grow-1 text-none"
                    flat
                    prepend-icon="mdi-close"
                    color="#D32F2F"
                    v-ripple
                    tile
                    @click.stop="handleMenuItemClick('delete', item.mac)"
                    >{{ $t('common.remove') }}
                    <template #prepend>
                      <v-icon color="#D32F2F" />
                    </template>
                  </v-btn>

                  <v-btn
                    class="flex-grow-1 text-none"
                    prepend-icon="mdi-rocket-launch"
                    color="#76FF03"
                    v-ripple
                    tile
                    @click.stop="handleMenuItemClick('wol', item.mac)"
                    >{{ $t('settings.network.wol.wakeup') }}</v-btn
                  >
                </v-btn-group>
              </v-col>
            </v-row>
          </v-list-item-title>
        </v-list-item>

        <br />
        <!-- always add an empty item -->

        <v-list-item>
          <v-list-item-title>
            <v-row dense class="d-flex justify-start align-center">
              <v-col cols="6">
                <v-text-field
                  v-model="deviceName"
                  minlength="1"
                  :rules="deviceNameRules"
                  density="compact"
                  tile
                  rounded="lg"
                  v-ripple
                  color="#76FF03"
                  variant="outlined"
                  :placeholder="$t('settings.network.wol.newDeiviceName')"
                  hide-details
                  single-line
                  @keydown.stop
                  @keyup.stop
                >
                </v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="deviceMac"
                  maxlength="17"
                  :rules="macAddressRules"
                  density="compact"
                  tile
                  rounded="lg"
                  v-ripple
                  color="#76FF03"
                  variant="outlined"
                  :placeholder="$t('settings.network.wol.newDeviceMac')"
                  hide-details
                  single-line
                  @keydown.stop
                  @keyup.stop
                >
                </v-text-field>
              </v-col>
            </v-row>
            <v-row dense class="d-flex justify-end align-center">
              <v-col cols="auto" class="d-flex flex-row align-end justify-center" style="gap: 8px">
                <v-btn
                  class="flex-grow-1 text-none"
                  prepend-icon="mdi-plus"
                  color="#76FF03"
                  v-ripple
                  tile
                  flat
                  variant="tonal"
                  :disabled="!canAddDevice"
                  @click.stop="handleMenuItemClick('add')"
                  >{{ $t('settings.network.wol.add') }}
                  <template #prepend>
                    <v-icon color="#76FF03" />
                  </template>
                </v-btn>
              </v-col>
            </v-row>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-sheet>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const route = useRoute();
  const store = useAppStore();

  import { useWOL } from '@/composables/useWOL';

  const { deviceNameRules, macAddressRules, loadWol, wolList, addDevice, removeDevice, wakeOnLan } =
    useWOL();

  const deviceName = ref('');
  const deviceMac = ref('');

  // Computed property to check if add button should be enabled
  const canAddDevice = computed(() => {
    const nameValid = deviceNameRules.every((rule) => rule(deviceName.value) === true);
    const macValid = macAddressRules.every((rule) => rule(deviceMac.value) === true);

    // Check if MAC address already exists in the current list
    const items = wolList.value?.items || [];
    const macExists = items.some(
      (item) => item.mac?.toLowerCase() === deviceMac.value.toLowerCase()
    );

    return nameValid && macValid && !macExists;
  });

  // Method to keep the menu open
  const keepMenuOpen = (event) => {
    // You can add additional logic here if needed
    event.stopPropagation(); // Stop the event from bubbling up
  };

  // TODO action
  const handleMenuItemClick = (button, value) => {
    if (button === 'refresh') {
      loadWol(); // Assuming loadWol returns a list
    } else if (button === 'add') {
      addDevice(deviceName.value, deviceMac.value);
      // Clear input fields after adding device
      deviceName.value = '';
      deviceMac.value = '';
    } else if (button === 'delete') {
      removeDevice(value);
    } else if (button === 'wol') {
      wakeOnLan(value);
    }
  };

  const handleAddDevice = () => {
    try {
      addDevice(deviceName.value, deviceMac.value);
    } catch (error) {
      console.error(error.message);
    }
  };

  const cancel = async () => {
    try {
      console.log('cancel');
    } catch (error) {
      console.error('Error during cancel operation:', error);
    }
  };

  // !! TODO you have to think when you want to process the user's changes. Directly or centrally (with OK button)
  // For me it should be centrally

  const save = async () => {
    try {
      console.log('save');
      handleAddDevice();
    } catch (error) {
      console.error('Error during save operation:', error);
    }
  };

  const actionHandlers = {
    //  resetDefaults: handleResetDefaults,
    ok: save,
    close: cancel,
  };
</script>

<style scoped>
  .selected-orientation {
    background-color: #76ff03 !important;
    color: black !important;
  }
</style>
