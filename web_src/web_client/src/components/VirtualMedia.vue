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
  <v-sheet class="mx-auto wrap-text" width="480">
    <v-card-title>
      <v-row class="d-flex align-center" no-gutters>
        <v-col cols="auto">
          <v-tabs v-model="tab" :items="tabs" align-tabs="start" height="60" slider-color="#76FF03">
            <template v-slot:tab="{ item }">
              <v-tab
                v-if="item.experimental"
                :prepend-icon="item.icon"
                :text="item.text"
                :value="item.value"
                color="#76FF03"
                class="text-none"
              ></v-tab>
            </template>

            <template v-slot:item="{ item }">
              <v-tabs-window-item value="tab-stream" class="pa-4">
                <v-card-subtitle class="d-flex justify-start">
                  {{ $t('settings.msd.stream.subtitle') }}z
                </v-card-subtitle>
                <VirtualMediaStream />
              </v-tabs-window-item>
              <v-tabs-window-item value="tab-url" class="pa-4">
                <v-card-subtitle class="d-flex justify-start">
                  {{ $t('settings.msd.url.subtitle') }}
                </v-card-subtitle>
                <VirtualMediaUrl />
              </v-tabs-window-item>
              <v-tabs-window-item value="tab-local" class="pa-4" border>
                <v-card-subtitle class="d-flex justify-start">
                  {{ $t('settings.msd.local.subtitle') }}
                </v-card-subtitle>
                <VirtualMediaLocal />
              </v-tabs-window-item>
            </template>
          </v-tabs>
        </v-col>
      </v-row>
    </v-card-title>
  </v-sheet>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useVirtualMedia } from '@/composables/useVirtualMedia';

  const { t } = useI18n();
  const store = useAppStore();
  const { items } = useVirtualMedia();

  const { msd, isExperimental } = storeToRefs(store);

  // local variables
  const tab = ref('tab-local');

  const tabs = [
    {
      icon: 'mdi-folder',
      text: t('common.local'),
      value: 'tab-local',
      experimental: true,
    },
    {
      icon: 'mdi-link-variant',
      text: 'URL',
      value: 'tab-url',
      experimental: false,
    },
    {
      icon: 'mdi-web',
      text: 'Stream',
      value: 'tab-stream',
      experimental: false,
    },
  ];

  const cancel = async () => {
    try {
      // Emit the event to the parent
      // TODO    emit("update:modelValue", false);
      msd.value.isMenuActive = false;
    } catch (error) {
      console.error('Error during cancel operation:', error);
    }
  };

  const save = async () => {
    try {
      // Emit the event to the parent
      emit('update:modelValue', false);
    } catch (error) {
      console.error('Error during save operation:', error);
    }
  };

  const actionHandlers = {
    //  resetDefaults: handleResetDefaults,
    ok: save,
    cancel: cancel,
  };

  const handleClick = async (actionType) => {
    const action = actionHandlers[actionType];
    if (action) {
      try {
        await action(); // Await the action if it's async
      } catch (error) {
        console.error(`Error handling actionType ${actionType}:`, error);
      }
    } else {
      console.error(`No handler found for actionType: ${actionType}`);
    }
  };

  // Computed property for `used` and `capacity`
  const chartData = computed(() => {
    const capacity = parseInt(items.value.capacity) || 0; // Parse capacity as an integer
    const used = 100 - capacity; // Calculate used percentage

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

  onMounted(async () => {});
</script>
