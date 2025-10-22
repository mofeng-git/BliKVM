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
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom">

    <template v-slot:activator="{ props }">
      <v-btn icon :class="{'active-toolbar-btn': ledPwr, 'inactive-toolbar-btn': !ledPwr}" size="30" v-bind="props">
        <v-icon class="toolbar-icon">mdi-power</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ $t('tab.atx.tip') }} </v-tooltip>
      </v-btn>
    </template>

    <UiParentCard  :title="$t('tab.atx.title')" @mouseenter.stop @mousemove.stop @keydown.stop @keypress.stop @keyup.stop>
      <div class="d-flex align-center">
        <v-label class="font-weight-medium align-center">{{ $t('label.status') }}: </v-label>
        <v-chip  class="ma-2" :class="{'active-toolbar-btn': ledPwr, 'inactive-toolbar-btn': !ledPwr}">
        {{ $t('tab.atx.ledPwr') }}
        </v-chip>
        <v-chip class="ma-2" :class="{'active-toolbar-btn': ledHDD, 'inactive-toolbar-btn': !ledHDD}">
          {{ $t('tab.atx.ledHdd') }}
        </v-chip>
      </div>
      <v-row>
        <v-col cols="12" sm="6" md="6" class="text-center align-center" >
          <v-btn @click="triggerPowerButton('power')" append-icon="mdi-power" color="primary">
            {{ $t('tab.atx.atx_poweron') }} 
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" md="6" class="text-center align-center" >
          <v-btn @click="triggerPowerButton('power')" append-icon="mdi-power-sleep" color="primary">
            {{ $t('tab.atx.atx_poweroff') }} 
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" md="6" class="text-center align-center" >
          <v-btn  @click="triggerPowerButton('forcepower')" append-icon="mdi-power-off" color="primary">
            {{ $t('tab.atx.atx_forceoff') }} 
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" md="6" class="text-center align-center" >
          <v-btn @click="triggerPowerButton('reboot')" append-icon="mdi-refresh" color="primary">
            {{ $t('tab.atx.atx_reset') }} 
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" md="6" class="text-center align-center" >
          <v-text-field v-model="macAddress" label="MAC Address" outlined></v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="6" class="text-center align-center" >
          <v-btn color="primary" @click="wakeOnLan">{{ $t('tab.atx.wake_on_lan') }} </v-btn>
        </v-col>
      </v-row>
    </UiParentCard>

  </v-menu>
</template>

<script setup>
import http from '@/utils/http.js';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const menu = ref(false);
const macAddress = ref('');
const store = useAppStore();
const { ledPwr, ledHDD } = storeToRefs(store);

const triggerPowerButton = async (button) => {
  try {
    const response = await http.post(`/atx/click?button=${button}`);
    console.log(response.data)
    // return response.data;
  } catch (error) {
    console.error('Error during atx button trigger:', error);
  }
};

const wakeOnLan = async () => {
  try {
    const response = await http.post(`/wol?mac=${macAddress.value}`);
    console.log(response.data)
    // return response.data;
  } catch (error) {
    console.error('Error during wake on lan:', error);
  }
};

</script>

<style scoped>
.align-center {
  display: flex;
  align-items: center;
}

.active-toolbar-btn {
    color: rgb(52, 231, 8);
    border: 2px solid rgb(52, 231, 8);
    border-radius: 50%;
    padding: 5px;
    margin-right: 15px;
    transition: color 0.3s ease;
    animation: blink-animation 1s infinite; 
}

.inactive-toolbar-btn {
    color:red;
    border: 2px solid red;
    border-radius: 50%;
    padding: 5px;
    margin-right: 15px;
    transition: color 0.3s ease;
}

@keyframes blink-animation {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
    100% {
        opacity: 1;
    }
}
</style>