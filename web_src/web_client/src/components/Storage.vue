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
  <v-expansion-panels v-model="panel" multiple>
    <v-expansion-panel value="storage" @group:selected="handlePanelOpen">
      <v-expansion-panel-title>
        <template v-slot:default="{ expanded }">
          <v-card class="transparent-card" density="compact" tile width="100%">
            <v-row dense no-gutters>
              <v-col cols="1">
                <v-icon color="#76FF03">mdi-sim-outline</v-icon>
              </v-col>
              <v-col class="d-flex justify-start align-center" cols="5">
                {{ $t('settings.storage.title') }}
              </v-col>
            </v-row>
            <v-row v-if="expanded" dense>
              <v-col cols="12">
                <v-card-subtitle>
                  {{ $t('settings.storage.subtitle') }}
                </v-card-subtitle>
              </v-col>
            </v-row>
          </v-card>
        </template>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-card-text class="text-medium-emphasis pa-6">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="device.msd.msdDeviceFile"
                readonly
                :label="$t('settings.msd.deviceFileField')"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col align-self="start">
              <div class="text-center mt-2" style="font-size: 16px; font-weight: 500">
                <!-- maxMSDImageSize shows MSD-specific free space (for virtual media images), 
                     NOT general storage. It's calculated from MSD partition after fetchImageList() -->
                {{ $t('settings.storage.freeSize') }}: {{ maxMSDImageSize }} Gb
              </div>
              <div style="width: 280px; height: 170px">
                <Doughnut :data="chartData" :options="options" />
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
  import { onMounted } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { useDevice } from '@/composables/useDevice';
  import { useVirtualMedia } from '@/composables/useVirtualMedia';
  import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
  import { Doughnut } from 'vue-chartjs';

  ChartJS.register(ArcElement, Tooltip, Legend);

  const { device } = useDevice();

  const { maxMSDImageSize, fetchMntSize } = useVirtualMedia();

  const panel = ref([]);

  // Handle panel open event - load both system info and MSD image list
  const handlePanelOpen = async (selected) => {
    if (typeof selected === 'object' && selected && 'value' in selected) {
      selected = selected.value;
    }
    if (!selected) return;

    // Load MSD image list to get MSD-specific free space
    // This is different from general storage - it's the space available for virtual media images
    await fetchMntSize();
  };

  // Computed property for `used` and `capacity`
  const chartData = computed(() => {
    const used =
      parseInt((device.value.msd.mntUsedSize / device.value.msd.mntTotalSize) * 100) || 0; // Parse capacity as an integer
    const capacity = 100 - used; // Calculate used percentage

    return {
      labels: [`Used (${used}%)`, `Free (${capacity}%)`],
      datasets: [
        {
          backgroundColor: ['#36A2EB', 'green'],
          data: [used, capacity], // Dynamically bind `used` and `capacity`
        },
      ],
    };
  });

  // Chart options
  /// Chart options with smart percentage formatting
  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          // Customizing the tooltip label callback
          label: function (tooltipItem) {
            // Access the dataset and the value
            const dataset = tooltipItem.dataset;
            const value = dataset.data[tooltipItem.dataIndex];
            const total = dataset.data.reduce((sum, val) => sum + val, 0);

            // Calculate the percentage
            const percentage = (value / total) * 100;

            // Use toFixed(2) for non-integers
            const formattedPercentage = Number.isInteger(percentage)
              ? `${percentage}%`
              : `${percentage.toFixed(2)}%`;

            // Access the label from the chart's data
            const label = tooltipItem.chart.data.labels[tooltipItem.dataIndex];

            // Return only the formatted label and value
            return `${label} (${value}%)`;
          },
        },
        // Disable the default tooltip item display to avoid duplication
        filter: function (tooltipItem) {
          // This ensures only the legend color item is shown in the tooltip
          return tooltipItem.datasetIndex === 0;
        },
      },
      legend: {
        position: 'right',
      },
    },
    maintainAspectRatio: false,
  };

  onMounted(() => {});
</script>

<style scoped>
  /* TODO duplicate with session style */
  .transparent-card {
    background: transparent !important;
    box-shadow: none !important;
  }
</style>
