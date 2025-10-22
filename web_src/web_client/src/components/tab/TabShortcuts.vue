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
      <v-btn icon class="toolbar-btn" size="30" v-bind="props">
        <v-icon class="toolbar-icon">mdi-keyboard-variant</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ $t('tab.shortcuts.tip') }} </v-tooltip>
      </v-btn>
    </template>

    <UiParentCard :title="$t('tab.shortcuts.tip')" @mouseenter.stop @mousemove.stop @keydown.stop @keypress.stop
      @keyup.stop>

      <div v-for="(value, key) in shortcuts" :key="key" class="shortcut-button">
        <v-btn @click="handleShortcut(value)">
          {{ key }}
        </v-btn>
      </div>

    </UiParentCard>

  </v-menu>
</template>

<script setup>
import http from '@/utils/http.js';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const menu = ref(false);
const shortcuts = ref({});


const fetchShortcuts = async () => {
  const response = await http.post('/hid/shortcuts/config');
  if (response.status === 200 && response.data.code === 0) {
    shortcuts.value = response.data.data;
  }else{
    console.error('Failed to fetch shortcuts');
  }
};

const handleShortcut = (shortcut) => {
  const requestBody = {
    shortcuts: shortcut
  };  
  const response = http.post('/hid/shortcuts', requestBody);

  if (response.status === 200 && response.data.code === 0) {
    console.log('shortcut triggered');
  }
};

onMounted(() => {
  fetchShortcuts();
});

</script>

<style scoped>
.align-center {
  display: flex;
  align-items: center;
}
</style>