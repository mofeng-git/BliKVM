<template>
  <v-card class="custom-card mx-auto wrap-text" width="500">
    <br />

    <div class="card-content">
      <v-expansion-panels v-model="outerPanel1" multiple>
        <SettingsKVM />
      </v-expansion-panels>

      <!-- GUI -->
      <v-expansion-panels v-model="outerPanel2" multiple>
        <SettingsGUI />
      </v-expansion-panels>

      <v-expansion-panels v-model="outerPanel3" multiple>
        <SettingsText />
      </v-expansion-panels>

      <v-expansion-panels v-model="outerPanel4" multiple v-if="isExperimental">
        <v-expansion-panel value="scripts">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-card class="transparent-card" density="compact" tile width="100%">
                <v-row dense no-gutters>
                  <v-col cols="1">
                    <v-icon color="#26A69A">mdi-file-code-outline</v-icon>
                  </v-col>
                  <v-col class="d-flex justify-start align-center" cols="6">
                    {{ $t('settings.scripts.title') }}
                  </v-col>
                </v-row>
                <v-row v-if="expanded" dense>
                  <v-col cols="*">
                    <v-card-subtitle>
                      {{ $t('settings.scripts.subtitle') }}
                    </v-card-subtitle>
                  </v-col>
                </v-row>
              </v-card>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <Scripts />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-expansion-panels v-model="outerPanel5" multiple v-if="isExperimental">
        <v-expansion-panel value="analytics" readonly>
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-card class="transparent-card" density="compact" tile width="100%">
                <v-row dense no-gutters>
                  <v-col cols="1">
                    <v-icon color="#00E5FF">mdi-view-dashboard</v-icon>
                  </v-col>
                  <v-col class="d-flex justify-start align-center" cols="6">
                    {{ $t('settings.analytics.title') }}
                    (<v-icon>mdi-alpha</v-icon>)
                  </v-col>
                </v-row>
                <v-row v-if="expanded" dense>
                  <v-col cols="12">
                    <v-card-subtitle>
                      {{ $t('settings.analytics.subtitle') }}
                    </v-card-subtitle>
                  </v-col>
                </v-row>
              </v-card>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-expansion-panels v-model="innerPanel" multiple> </v-expansion-panels>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-expansion-panels v-model="outerPanel6" multiple>
        <v-expansion-panel value="virtual-media">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-card class="transparent-card" density="compact" tile width="100%">
                <v-row dense no-gutters>
                  <v-col cols="1">
                    <v-icon color="#76FF03">mdi-folder-cog-outline</v-icon>
                  </v-col>
                  <v-col class="d-flex justify-start align-center" cols="5">
                    {{ $t('settings.msd.title') }}
                  </v-col>
                </v-row>
                <v-row v-if="expanded" dense>
                  <v-col cols="12">
                    <v-card-subtitle>
                      {{ $t('settings.msd.subtitle') }}
                    </v-card-subtitle>
                  </v-col>
                </v-row>
              </v-card>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <VirtualMedia />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-expansion-panels v-model="outerPanel7" multiple>
        <Storage />
      </v-expansion-panels>

      <!-- Power Management -->
      <v-expansion-panels v-model="outerPanel8" multiple>
        <SettingsATX />
      </v-expansion-panels>

      <v-expansion-panels v-model="outerPanel9" multiple>
        <v-expansion-panel value="kvm-switch" @group:selected="loadHdmiSwitch">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-card class="transparent-card" density="compact" tile width="100%">
                <v-row dense no-gutters>
                  <v-col cols="1">
                    <v-icon color="#FFEA00">mdi-server-network-outline</v-icon>
                  </v-col>
                  <v-col class="d-flex justify-start align-center" cols="4">
                    {{ $t('settings.switch.title') }}
                  </v-col>
                </v-row>
                <v-row v-if="expanded" dense>
                  <v-col cols="12">
                    <v-card-subtitle>
                      {{ $t('settings.switch.subtitle') }}
                    </v-card-subtitle>
                  </v-col>
                </v-row>
              </v-card>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <Switch />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Network -->
      <v-expansion-panels v-model="outerPanel8" multiple>
        <SettingsNetwork />
      </v-expansion-panels>

      <!-- Security -->
      <v-expansion-panels v-model="outerPanel9" multiple>
        <SettingsSecurity />
      </v-expansion-panels>

      <!-- integration -->
      <v-expansion-panels v-model="outerPanel10" multiple>
        <SettingsIntegration />
      </v-expansion-panels>

      <!-- serial -->
      <v-expansion-panels v-model="outerPanel11" multiple>
        <v-expansion-panel value="terminal">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-card class="transparent-card" density="compact" tile width="100%">
                <v-row dense no-gutters>
                  <v-col cols="1">
                    <v-icon color="#26A69A">mdi-console-line</v-icon>
                  </v-col>
                  <v-col class="d-flex justify-start align-center" cols="6">
                    {{ $t('settings.serial.title') }}
                  </v-col>
                </v-row>
                <v-row v-if="expanded" dense>
                  <v-col cols="*">
                    <v-card-subtitle>
                      {{ $t('settings.serial.subtitle') }}
                    </v-card-subtitle>
                  </v-col>
                </v-row>
              </v-card>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <SerialTerminal />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </v-card>
</template>

<script setup>
  import { onMounted } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice.js';
  import { useSecurity } from '/src/composables/useSecurity.js';
  import { useHdmiSwitch } from '@/composables/useHdmiSwitch';

  const store = useAppStore();
  const { device } = useDevice();
  const { loadHdmiSwitch } = useHdmiSwitch();

  // TODO are we will using this, why?
  // Define the props and use v-model binding
  const props = defineProps({
    label: String,
    index: Number,
    modelValue: Boolean, // Auto-bound for v-model:is-menu-visible
  });

  const emit = defineEmits(['update:modelValue']);

  const { security, misc, isExperimental } = storeToRefs(store);
  const { resetConfig } = useSecurity(device);

  // Method to keep the menu open
  const keepMenuOpen = (event) => {
    // You can add additional logic here if needed
    event.stopPropagation(); // Stop the event from bubbling up
  };

  const outerPanel1 = ref([]);
  const outerPanel2 = ref([]);
  const outerPanel3 = ref([]);
  const outerPanel4 = ref([]);
  const outerPanel5 = ref([]);
  const outerPanel6 = ref([]);
  const outerPanel7 = ref([]);
  const outerPanel8 = ref([]);
  const outerPanel9 = ref([]);
  const outerPanel10 = ref([]);
  const outerPanel11 = ref([]);
  const outerPanel12 = ref([]);
  const outerPanel13 = ref([]);
  const innerPanel = ref([]);

  const tickLabels = computed(() => {
    if (misc.value.temperatureUnit === 'C') {
      return {
        0: 'min',
        100: 'max',
      };
    } else {
      return {
        0: 'min',
        120: 'max',
      };
    }
  });

  const tickLabel = (value) => {
    return tickLabels.value[value] || value; // Default to the number if no label is found
  };

  const handleReset = async (device) => {
    try {
      await resetConfig(device);
      console.log('Device reset completed');
    } catch (error) {
      console.error('Error resetting device:', error);
    }
  };

  ////////////
  // TODO move to useSecurity
  // Ensure isAuthEnabled is true if is2FaEnabled is true
  watchEffect(() => {
    if (security.value.is2FaEnabled) {
      security.value.isAuthEnabled = true;
    }
  });

  const cancel = async () => {
    try {
      // Emit the event to the parent
      emit('update:modelValue', false);
      device.value.hid.mouse.isMenuActive = false;
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

  onMounted(() => {});
</script>

<style scoped>
  .selected-panel {
    background-color: #e3f2fd !important;
    /* Light blue background for selected panel */
    color: #1565c0 !important;
    /* Dark blue text color */
  }

  .transparent-card {
    background: transparent !important;
    box-shadow: none !important;
  }

  .custom-card {
    height: 100%;
    /* Set the card height to 100% of its container */
  }

  .card-content {
    height: 100%;
    /* Ensure content takes up full height of the card */
    overflow-y: auto;
    /* Enable vertical scrolling when content exceeds the card height */
    padding-right: 10px;
    /* Ensure scrollbar is visible */
  }

  .subtitle-text {
    white-space: pre-line;
  }

  .border-indicator {
    width: 4px;
    height: 75%;
    background-color: #76ff03;
    position: absolute;
    left: 0;
    top: 15%;
  }

  .selected-item-inner {
    width: 100%;
    display: flex;
    justify-content: start;
    background-color: transparent;
  }

  .cursor-menu {
    max-width: none;
    /* Allow it to grow beyond default max width */
    width: auto;
    /* Set width to auto */
  }

  .dropdown-menu {
    min-width: 150px;
  }

  .cursor-default {
    cursor: default;
  }

  .cursor-grab {
    cursor: grab;
  }

  .cursor-crosshair {
    cursor: crosshair;
  }

  .cursor-text {
    cursor: text;
  }

  .cursor-none {
    cursor: none;
  }

  /* Custom Blue Dot cursor using an image */
  .cursor-green-dot {
    cursor: mdi-circle-small;
  }

  .selected-orientation {
    background-color: #76ff03 !important;
    color: black !important;
  }
</style>
