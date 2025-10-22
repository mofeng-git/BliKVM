
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

// ===============================|| Ui Parent Card||=============================== //
<template>
  <v-card variant="flat">
    <v-card-item>
      <div class="d-sm-flex align-center justify-space-between">
        <v-card-title>{{ props.title }}</v-card-title>
        <slot name="action"></slot>
      </div>
    </v-card-item>
    <v-divider></v-divider>
    <v-card-text>
      <slot />
    </v-card-text>
  </v-card>
</template>
