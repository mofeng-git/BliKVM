
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
  <svg class="pc-icon">
    <use :xlink:href="`${spritePath}#${props.name}`"></use>
  </svg>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps({
  name: String
});

const spritePath = ref<string | null>(null);

onMounted(async () => {
  try {
    // Load the SVG sprite dynamically with an absolute path
    spritePath.value = (await import.meta.env.BASE_URL) + 'assets/svg/sprite.svg';
  } catch (error) {
    console.error('Error loading SVG sprite:', error);
  }
});
</script>
