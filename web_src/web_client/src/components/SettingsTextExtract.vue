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
  <v-row class="d-flex align-center" style="padding: 2px 0; min-height: 30px">
    <!-- Left Column: Checkboxes -->
    <v-col cols="auto" class="d-flex flex-column">
      <v-radio-group v-model="ocr.ocrLanguage" color="#76FF03" class="d-flex flex-wrap" row>
        <v-radio
          v-for="(item, index) in ocrLanguageList"
          :key="index"
          :value="item.ocr"
          :label="item.label"
          class="mr-1"
          density="compact"
          style="padding: 0; min-height: 40px; height: 20px; line-height: 20px"
        />
      </v-radio-group>
    </v-col>
    <!-- Right Column: Button (Top Right) -->
    <v-col cols="auto" class="d-flex justify-end align-start">
      <v-btn
        :style="{
          color: '#76FF03',
        }"
        @click="handleOcrClick($event)"
      >
        <v-icon class="mr-2">mdi-select-arrow-up</v-icon>
        {{ $t('settings.text.extract.selectArea') }}
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup>
  import { useLanguage } from '@/composables/useLanguage';
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';

  const store = useAppStore();
  const { ocr } = storeToRefs(store);
  const { ocrLanguageList } = useLanguage();

  const handleOcrClick = (event) => {
    ocr.value.ocrSelection = true;
    console.log('OCR selection mode activated:', ocr.value.ocrSelection);
  };
</script>

<style scoped>
  .justify-center {
    display: flex;
    justify-content: center;
  }
</style>
