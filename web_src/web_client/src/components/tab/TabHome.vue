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
            <v-btn icon class="toolbar-btn" size="30" v-bind="mergeProps(menu, tooltip)" @click="goMainPage">
              <v-icon class="toolbar-icon">mdi-home</v-icon>
            </v-btn>
          </template>
          <span>{{ $t('tab.home') }}</span>
        </v-tooltip>
      </template>
    </v-menu>
  </template>
  
  <script setup>
  import { mergeProps } from 'vue';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();

  const goMainPage = () => {
    router.push('/main');
};

</script>
  