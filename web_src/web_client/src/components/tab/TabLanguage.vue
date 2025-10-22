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
  <v-menu>
    <template v-slot:activator="{ props: menu }">
      <v-tooltip location="top">
        <template v-slot:activator="{ props: tooltip }">
          <v-btn icon class="toolbar-btn" size="30" v-bind="mergeProps(menu, tooltip)">
             <LanguageIcon stroke-width="1.5" size="22" />
          </v-btn>
        </template>
        <span>{{ $t('tab.language.tip') }}</span>
      </v-tooltip>
      
    </template>
    <v-list class="dropdown-menu" @mouseenter.stop @mousemove.stop>
      <v-list-item
      v-for="(item, index) in languageDD"
      :key="index"
      color="secondary"
      :active="$i18n.locale == item.value"
      class="d-flex align-center"
      @click="() => changeLanguage(item.value)"
    >
      <v-list-item-title class="text-subtitle-1 font-weight-regular">
        {{ item.title }}
        <span class="text-disabled text-subtitle-1 pl-2">({{ item.subtext }})</span>
      </v-list-item-title>
    </v-list-item>
    <v-list-item @click="openGithubLink">
      <v-list-item-title class="text-subtitle-1 font-weight-regular">
        {{ $t('tab.language.add') }}
    </v-list-item-title>
    </v-list-item>
    </v-list>
  </v-menu>

</template>

<script setup>
import { shallowRef } from 'vue';
import { LanguageIcon } from 'vue-tabler-icons';
import { mergeProps } from 'vue';

const { proxy } = getCurrentInstance();

const languageDD = shallowRef([
  { title: 'English', subtext: 'UK', value: 'en' },
  { title: '中国人', subtext: 'Chinese', value: 'zh' },
  { title: 'Italian', subtext: 'Italy', value: 'IT' },
  { title: 'Ukrainian', subtext: 'UA', value: 'UA' },
  { title: 'Malaysians', subtext: 'ms', value: 'ms' },
  { title: 'German', subtext: 'de', value: 'de' },
  { title: 'Russian', subtext: 'ru', value: 'ru' },
]);

function changeLanguage(language) {
  proxy.$i18n.locale = language;
  localStorage.setItem('selectedLanguage', language);
}

// Function to open a new tab with the specified GitHub URL
const openGithubLink = () => {
  window.open('https://github.com/ThomasVon2021/blikvm-web-client/tree/master/src/utils/locales', '_blank');
};

</script>
