
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
<script setup lang="ts">
const props = defineProps({
  title: String
});
</script>

<template>
  <!-- ---------------------------------------------------- -->
  <!-- Table Card -->
  <!-- ---------------------------------------------------- -->
  <v-card variant="flat" elevation="0">
    <v-card-item>
      <v-card-title class="text-18">{{ props.title }}</v-card-title>
    </v-card-item>
    <v-divider></v-divider>

    <slot />
  </v-card>
</template>
