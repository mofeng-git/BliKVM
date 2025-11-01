<template>
  <v-card class="custom-card mx-auto wrap-text" width="auto">
    <v-sheet width="100%">
      <v-sheet class="inner-sheet pa-4 mx-auto" width="100%">
        <v-sheet
          class="scrollable-container pa-4 mx-auto"
          max-width="800"
          rounded="lg"
          width="100%"
        >
          <v-form ref="form">
            <v-row dense no-gutters>
              <v-col cols="12">
                <v-switch
                  v-model="device.hid.isActive"
                  inset
                  :label="$t('hid.isActiveField')"
                  v-ripple
                  color="#76FF03"
                  @update:modelValue="toggleHid"
                />
              </v-col>
            </v-row>

            <v-row dense no-gutters>
              <v-col cols="12" class="d-flex justify-start">
                <v-switch
                  v-model="device.hid.passThrough"
                  inset
                  :label="$t('hid.passthrough')"
                  v-ripple
                  color="#76FF03"
                  @update:modelValue="isActiveHIDPassthrough"
                />
              </v-col>
            </v-row>

            <!-- USB Device Registration -->
            <div class="d-flex text-caption justify-start">
              {{ $t('settings.device.hid.modeField') }}
            </div>

            <v-select
              v-model="device.hid.mouse.mouseMode"
              :items="hidRegistrationOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              rounded="lg"
              density="compact"
              tile
              v-ripple
              color="#76FF03"
              @update:modelValue="changeHidMouseMode"
            >
            </v-select>

            <!-- Mouse Behaviour Mode -->
            <div
              v-if="device.hid.mouse.mouseMode === 'dual'"
              class="d-flex text-caption justify-start"
            >
              {{ $t('settings.device.hid.behaviourField') }}
            </div>

            <v-row
              v-if="device.hid.mouse.mouseMode === 'dual'"
              dense
              no-gutters
              class="d-flex justify-start align-center"
            >
              <v-col cols="auto">
                <v-btn-toggle
                  v-model="device.hid.mouse.absoluteMode"
                  density="compact"
                  rounded="lg"
                  v-ripple
                  color="#76FF03"
                  variant="outlined"
                  group
                  @update:modelValue="changeMouseMode"
                >
                  <v-btn :value="true">
                    {{ $t('settings.device.hid.absolute') }}
                  </v-btn>
                  <v-btn :value="false">
                    {{ $t('settings.device.hid.relative') }}
                  </v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>

            <br />

            <!-- Relative Sensitivity -->
            <v-row
              v-if="
                device.hid.mouse.mouseMode === 'relative' || device.hid.mouse.absoluteMode === false
              "
              dense
              no-gutters
              class="d-flex justify-start align-center"
            >
              <div class="d-flex text-caption justify-start">
                {{ $t('settings.device.hid.relativeSensitivityField') }}
              </div>
              <v-col cols="12">
                <!-- TODO change to v-slider -->
                <sliderField
                  :modelValue="device.hid.mouse.relativeSensitivity"
                  :min="0.1"
                  :max="2"
                  :step="0.1"
                  @update:modelValue="handleSensitivityChange"
                />
              </v-col>
            </v-row>

            <v-row dense no-gutters>
              <v-col cols="12">
                <v-switch
                  v-model="device.hid.mouse.wheelReverse"
                  inset
                  :label="$t('hid.wheelReverseField')"
                  v-ripple
                  color="#76FF03"
                  @update:modelValue="setMouseWheelDirection"
                />
              </v-col>
            </v-row>

            <v-row dense no-gutters v-if="device.hid.passThrough">
              <v-col cols="12">
                <v-switch
                  v-model="device.hid.passThroughWheelReverse"
                  inset
                  :label="$t('hid.passthroughWheelReverseField')"
                  v-ripple
                  color="#76FF03"
                  @update:modelValue="updateHIDPassthrough"
                />
              </v-col>
            </v-row>

            <v-row dense no-gutters class="d-flex justify-start align-center">
              <div class="d-flex text-caption justify-start">
                {{ $t('settings.device.hid.pollingIntervalField') }}
              </div>
              <v-col cols="12">
                <v-field variant="plain" active class="align-center">
                  <v-slider
                    v-model="device.hid.mouse.mousePollingInterval"
                    :min="10"
                    :max="100"
                    :step="10"
                    show-ticks="always"
                    tick-size="2"
                    v-ripple
                    color="#76FF03"
                    track-fill-color="#76FF03"
                  >
                    <template v-slot:append>
                      <v-text-field
                        v-if="device.hid.mouse.mousePollingInterval > 0"
                        v-model="device.hid.mouse.mousePollingInterval"
                        density="compact"
                        rounded="lg"
                        v-ripple
                        color="#76FF03"
                        style="width: 101px"
                        type="number"
                        suffix="ms"
                        variant="outlined"
                        hide-details
                        single-line
                      ></v-text-field>
                      <v-text-field
                        v-else
                        readonly
                        density="compact"
                        rounded="lg"
                        style="width: 100px"
                        variant="outlined"
                        hide-details
                        single-line
                      >
                        {{ $t('common.inactive') }}
                      </v-text-field>
                    </template></v-slider
                  >
                </v-field>
              </v-col>
            </v-row>

            <v-row dense no-gutters class="d-flex justify-start align-center">
              <div class="d-flex text-caption justify-start">
                {{ $t('settings.device.hid.mouseJigglerIntervalField') }}
              </div>
              <v-col cols="12">
                <v-field variant="plain" active class="align-center">
                  <v-slider
                    v-model="device.hid.mouse.jigglerInterval"
                    min="0"
                    :max="100"
                    :step="10"
                    show-ticks="always"
                    tick-size="2"
                    v-ripple
                    :color="device.hid.mouse.jigglerInterval === 0 ? '' : '#76FF03'"
                    track-fill-color="#76FF03"
                    @end="apiJiggler"
                  >
                    <template v-slot:append>
                      <v-text-field
                        v-if="device.hid.mouse.jigglerInterval > 0"
                        v-model="device.hid.mouse.jigglerInterval"
                        density="compact"
                        rounded="lg"
                        v-ripple
                        color="#76FF03"
                        style="width: 101px"
                        type="number"
                        suffix="s"
                        variant="outlined"
                        hide-details
                        single-line
                      ></v-text-field>
                      <v-text-field
                        v-else
                        readonly
                        density="compact"
                        rounded="lg"
                        style="width: 100px"
                        variant="outlined"
                        hide-details
                        single-line
                      >
                        {{ $t('common.inactive') }}
                      </v-text-field>
                    </template>
                  </v-slider>
                </v-field>
              </v-col>
            </v-row>
          </v-form>
        </v-sheet>
      </v-sheet>
    </v-sheet>
  </v-card>
</template>

<script setup>
  import { onMounted, computed } from 'vue';
  import http from '@/utils/http.js';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { RateLimitedMouse } from '../utils/mouse.js';
  import { useAlert } from '@/composables/useAlert.js';
  import { useI18n } from 'vue-i18n';

  // Define the props and use v-model binding
  const props = defineProps({
    label: String,
    index: Number,
    modelValue: Boolean, // Auto-bound for v-model:is-menu-visible
  });

  const emit = defineEmits(['update:modelValue']);
  const store = useAppStore();
  const { device } = useDevice();
  const { t } = useI18n();
  const { isProcessing } = storeToRefs(store);
  const hidRegistrationModes = ['dual', 'absolute', 'relative'];
  const hidRegistrationOptions = computed(() =>
    hidRegistrationModes.map((mode) => ({
      value: mode,
      title: t(`settings.device.hid.registration.${mode}`),
    }))
  );

  const { sendAlert } = useAlert(alert);

  const handleRefreshClick = (key) => {
    switch (key) {
      case 'mouseMode':
        device.value.hid.mouse.mouseMode = hid.originalMouse.mouseMode.value;
        break;

      case 'pollingIntervalMS':
        device.value.hid.mouse.pollingIntervalMS = hid.originalMouse.pollingIntervalMS.value;
        break;

      case 'relativeSensitivity':
        device.value.hid.mouse.relativeSensitivity = hid.originalMouse.relativeSensitivity.value;
        break;

      case 'jiggler':
        device.value.hid.mouse.jigglerIntervalList = hid.originalMouse.jiggler.value;
        break;

      case 'squashRelativeMoves':
        device.value.hid.mouse.squashRelativeMoves = originalMouse.squashRelativeMoves.value;
        break;

      case 'reverseScrolling':
        device.value.hid.mouse.reverseScrolling = hid.originalMouse.reverseScrolling.value;
        break;

      default:
        break;
    }
  };

  async function apiJiggler(value) {
    isProcessing.value = true;
    try {
      const requestBody = {
        interval: value,
      };
      const response = await http.post('/mouse/jiggler', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        console.log('mouse jiggler success');
      } else {
        console.log('mouse jiggler error');
      }
    } catch (error) {
      console.error('Error during mouse jiggler trigger:', error);
    }
    isProcessing.value = false;
  }

  async function changeHidMouseMode(value) {
    try {
      const requestBody = {
        mouseMode: value,
      };
      const response = await http.post('/hid/mode', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        console.log(response.data.msg);
      } else {
        const title = 'Change mouse mode';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Change mouse mode';
      const message = error.message || 'Error during mouse hid mode change';
      sendAlert('error', title, message);
    }
  }

  async function changeMouseMode(newValue) {
    try {
      console.log('changeMouseMode:', newValue);
      device.value.hid.mouse.absoluteMode = newValue;
      RateLimitedMouse.setMode(newValue);
    } catch (error) {
      console.error('Error during changing mouse mode:', error);
    }
  }

  const handleSensitivityChange = (value) => {
    localStorage.setItem('mouseSensitivity', value);
    device.value.hid.mouse.relativeSensitivity = value;
    adjustSensitivity(value);
  };

  const adjustSensitivity = (value) => {
    RateLimitedMouse.setSensitivity(value);
  };

  const setMouseWheelDirection = (newValue) => {
    if (newValue === false) {
      localStorage.setItem('wheelDeriction', 1);
      RateLimitedMouse.setWheelDeriction(1);
    } else {
      localStorage.setItem('wheelDeriction', -1);
      RateLimitedMouse.setWheelDeriction(-1);
    }
  };

  async function isActiveHIDPassthrough(value) {
    try {
      const requestBody = {
        isActive: value,
      };
      const response = await http.post('/hid/loop', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        device.value.hid.passThrough = response.data.data.enabled;
        console.log(response.data);
      } else {
        const title = 'Active HID Passthrough';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Active HID Passthrough';
      const message = error.message || 'Error during active HID Passthrough';
      sendAlert('error', title, message);
    }
  }

  async function updateHIDPassthrough(value) {
    try {
      const requestBody = {
        wheelReverse: value,
      };
      const response = await http.post('/hid/loop/update', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        device.value.hid.passThroughWheelReverse = response.data.data.wheelReverse;
      } else {
        const title = 'Active HID Passthrough';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Reverse Passthrough Mouse Wheel';
      const message = error.message || 'Error during Passthrough mouse reverse';
      sendAlert('error', title, message);
    }
  }

  async function toggleHid(newValue) {
    try {
      const actionValue = newValue ? 'enable' : 'disable';
      const response = await http.post(`/hid?action=${actionValue}`);
      if (response.status === 200 && response.data.code === 0) {
      } else {
        console.log(`${actionValue} error`);
      }
    } catch (error) {
      const title = 'Toggle HID';
      const message = error.message || 'Error during atx button trigger';
      sendAlert('error', title, message);
    }
  }

  async function getHIDPassthroughStatus() {
    try {
      const response = await http.get('/hid/loop');
      if (response.status === 200 && response.data.code === 0) {
        device.value.hid.passThrough = response.data.data.enabled;
        device.value.hid.passThroughWheelReverse = response.data.data.wheelReverse;
      } else {
        console.log(`${actionValue} error`);
      }
    } catch (error) {
      console.error('Error during atx button trigger:', error);
    }
  }

  onMounted(() => {
    getHIDPassthroughStatus();
  });
</script>
