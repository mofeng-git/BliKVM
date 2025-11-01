<!--
    ****************************************************************************
    #                                                                            #
    #    BliKVM Copyright (C) 2021-present     blicube <info@blicube.com>        #
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
  <v-snackbar
    v-model="showAlert"
    multi-line
    variant="elevated"
    color="surface"
    contained
    :location="misc.alert.location"
    rounded="lg"
    :text="misc.alert.text"
    timeout="5000"
    closable
    max-width="400"
  >
    <template #text>
      <div class="d-flex align-start">
        <v-icon :color="getAlertColor(misc.alert.type)" start>
          {{ getAlertIcon(misc.alert.type) }}
        </v-icon>

        <div>
          <strong class="d-inline-block text-subtitle-2 mb-1">{{ misc.alert.title }}</strong>

          <div>
            {{ misc.alert.text }}
          </div>
        </div>
      </div>
    </template>

    <template #actions>
      <v-btn
        class="mt-n7"
        density="comfortable"
        icon="$close"
        size="small"
        @click="showAlert = false"
      />
    </template>
  </v-snackbar>
</template>

<script setup>
  import { onMounted, computed } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';
  import { useAlert } from '@/composables/useAlert.js';

  const store = useAppStore();
  const { misc } = storeToRefs(store);
  const { getAlertIcon, getAlertColor, initializeAlert } = useAlert();

  // Show alert if there's an active alert (always show demo alerts)
  const showAlert = computed({
    get: () => misc.value.alert.isActive,
    set: (value) => (misc.value.alert.isActive = value),
  });

  onMounted(() => {
    initializeAlert();
  });
</script>
