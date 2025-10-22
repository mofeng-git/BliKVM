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
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom" @open="fetchSwitchConfig">
    <template v-slot:activator="{ props }">
      <v-btn icon class="toolbar-btn" size="30" v-bind="props">
        <v-icon class="toolbar-icon">mdi-video-switch</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ $t('tab.switch.tip') }}</v-tooltip>
      </v-btn>
    </template>
    <UiParentCard :title="$t('tab.switch.tip')" @mouseenter.stop @mousemove.stop>

      <v-row>

        <v-col cols="12" sm="6" md="4" class="text-center align-center">
          <v-switch color="primary" v-model="switchEnabled"  :label="switchEnabled ? $t('label.enable') : $t('label.disable')"  hide-details
            @change="toggleSwitch"></v-switch>
          <v-dialog v-model="availableSwitch">
            <v-card>
              <v-card-text>
                {{ switchEnabledResultText }}
              </v-card-text>
              <v-card-actions>
                <v-btn color="primary" block @click="availableSwitch = false">{{ $t('button.close') }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-autocomplete :label="$t('tab.switch.choose_a_model')" class="ml-3" v-model="switchValue" :items="switchModles" 
          item-title="title" item-value="id" 
            color="primary" variant="filled" hide-details @update:modelValue="changeSwitchModle"></v-autocomplete>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-autocomplete :label="$t('tab.switch.choose_a_channel')" class="ml-3 flex-grow-1" v-model="channelValue" :items="channelItems"
          :item-title="getChannelText" item-value="name"  
          color="primary" variant="filled" hide-details @update:modelValue="changeSwitchChannel"></v-autocomplete>
        </v-col>
        <v-col cols="12" sm="6" md="4" class="text-center align-center">
          <v-chip :color="switchStateColor" class="ma-2">{{ switchState }}</v-chip>
        </v-col>
        <v-col cols="12" sm="6" md="4" class="text-center align-center">
          <v-btn @click="fetchSwitchConfig" append-icon="mdi-refresh" :ripple="true" color="primary">
            {{ $t('common.refresh') }}
          </v-btn>
        </v-col>

        <v-col cols="12" sm="6" md="4" class="text-center align-center">
          <div class="text-center">
            <v-dialog v-model="dialog" persistent @keydown.stop @keyup.stop>
              <template v-slot:activator="{ props }">
                <v-btn color="primary" v-bind="props"> {{ $t('tab.switch.config') }} </v-btn>
              </template>
              <v-card style="height: 300px" class="overflow-auto">
                <v-card-title class="pa-5">
                  <span class="text-h5">{{ $t('tab.switch.config') }}</span>
                </v-card-title>
                <v-card-text>

                  <v-container v-if="switchValue !== 'None'">
                    <v-row>
                      <v-col cols="12">
                        <v-text-field v-model="devicePath" :label="$t('common.device_path')" required rounded="0"> </v-text-field>
                      </v-col>

                      <v-col v-for="(item, index) in channelItems" :key="index" cols="12" sm="6" md="4">
                        <v-text-field v-model="channelItems[index].override" :label="`Channel ${index + 1}`" required
                          rounded="0"></v-text-field>
                      </v-col>
                    </v-row>
                  </v-container>
                  <div v-else class="text-center">
                    {{ $t('tab.switch.no_model_selected') }}
                  </div>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="error" variant="text" @click="close"> {{ $t('button.close') }} </v-btn>
                  <v-btn color="success" variant="text" @click="save"> {{ $t('button.save') }} </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>
        </v-col>

      </v-row>
    </UiParentCard>

  </v-menu>
</template>

<script setup>
import { ref } from 'vue';

import UiParentCard from '@/components/shared/UiParentCard.vue';
import http from '@/utils/http.js';

const menu = ref(false);

const switchModles = ref([
  'None',
  'BliKVM_switch_v1',
  'BliKVM_switch_v2'
]);

const switchValue = ref(['None']);
const channelValue = ref(['None']);
const devicePath = ref('/dev/ttyUSB0');
const dialog = ref(false);
const switchEnabled = ref(false);
const availableSwitch = ref(false);
const switchEnabledResultText = ref("");
const channelItems = ref();
const switchState = ref('None');
const switchObj = ref();

const switchStateColor = computed(() => {
  return switchState.value === 'RUNNING' ? 'success' : 'error';
});

function getChannelText(item) {
  return item.override !== '' ? item.override : item.name;
}

async function changeSwitchChannel() {
  try {
      const id = switchValue.value;
      const requestBody = {
        channel: channelValue.value
      };
      const response = await http.post(`/switch/${id}/channel`, requestBody);
      if (response.status === 200 && response.data.code === 0) {
        console.log('set module success');
      }
  } catch (error) {
    console.log(error);
  }
}

async function toggleSwitch() {
  try {
    if (switchValue.value === 'None') {
      switchEnabled.value = false;
      availableSwitch.value = true;
      switchEnabledResultText.value = 'No select module!';
    } else {
      const requestPathBody = {
        isActive: switchEnabled.value
      };
      const id = switchValue.value;
      console.log("requestPathBody:", requestPathBody , 'switchValue:', switchValue.value , " id:", id);
      const response = await http.post(`/switch/${id}/activate`, requestPathBody);

      if (response.data.code !== 0) {
        switchEnabled.value = false;
        availableSwitch.value = true;
        switchEnabledResultText.value = response.data.msg;
      }
      await fetchSwitchConfig();
    }

  } catch (error) {
    console.log(error);
  }
}

async function changeSwitchModle() {
  try {
    if(switchEnabled.value === true){
      const activeSwitchId = switchValue.value;
      const requestPathBody = {
        isActive: false
      };
      const response = await http.post(`/switch/${activeSwitchId}/activate`, requestPathBody);
      console.log('response:', response.data);
    }
    console.log('changeSwitchModle switchValue:', switchValue.value);
    const switchId = switchValue.value - 1;
    if(switchId >= 0){
      channelItems.value = switchObj.value.items[switchId].channels;
    }

  } catch (error) {
    console.log(error);
  }
}

function close() {
  dialog.value = false;
}

async function save() {
  if (switchValue.value === 'None') {
    console.error('No model selected!');
    return;
  }
  const activeSwitchId = switchValue.value;
  const requestPathBody = {
    id: activeSwitchId,
    title: switchObj.value.items[activeSwitchId - 1].title,
    subtitle: switchObj.value.items[activeSwitchId - 1].subtitle,
    channelCount: switchObj.value.items[activeSwitchId - 1].channelCount,
    deviceFile: devicePath.value,
    activeChannel: switchObj.value.items[activeSwitchId - 1].activeChannel,
    channels: channelItems.value.map((item, index) => ({
      name: item.name,
      override: item.override
    }))
  };
  const response = await http.post(`/switch/${activeSwitchId}/update`, requestPathBody);

  if (response.status === 200) {
    console.log('switch set config successfully:', response.data);
  } else {
    console.error('Failed to set switch config:', response);
  }

  dialog.value = false;
}

async function fetchSwitchConfig() {
  try {
    const response = await  http.get('/switch');
    if (response.status === 200  && response.data.code === 0) {
      //console.log('get switch state successfully:', response.data);
      switchEnabled.value = response.data.data.isActive;
      const activeSwitchId = response.data.data.activeSwitchId - 1;
      if (activeSwitchId < 0) {
        switchValue.value = 'None';
        channelValue.value = 'None';
        switchState.value = "STOP"
        return;
      }
      switchValue.value = switchModles.value[activeSwitchId].id;
      channelItems.value = response.data.data.items[activeSwitchId].channels;
      const activeChannel = response.data.data.items[activeSwitchId].activeChannel;
      if( activeChannel !== 'None') {
        channelValue.value = response.data.data.items[activeSwitchId].channels[activeChannel-1];
      } else {
        channelValue.value = response.data.data.items[activeSwitchId].channels[0];
      }
      devicePath.value = response.data.data.items[activeSwitchId].deviceFile;
      switchState.value = response.data.data.isActive ? 'RUNNING' : 'STOP';
    } else {
      console.error('Failed to get switch state:', response.data);
    }
  } catch (error) {
    console.log(error);
  }
}

async function fetchSwitchList() {
  try {
    const response = await http.get('/switch');
    if (response.status === 200 && response.data.code === 0) {
        //console.log('get switch list successfully:', response.data);
        switchObj.value = response.data.data;
        switchModles.value = response.data.data.items.map(item => ({
          title: item.title,
          id: item.id
        }));
        const activeSwitchId = response.data.data.activeSwitchId - 1;
        if( activeSwitchId >= 0){
          switchValue.value = switchModles.value[activeSwitchId].id;
        }
    }
    else {
      console.error('Failed to set switch devicepath:', response);
    }
  } catch (error) {
    console.log(error);
  }
}

onMounted(async () => {
  await fetchSwitchList();
  await fetchSwitchConfig();
});

</script>

<style scoped>
.align-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>