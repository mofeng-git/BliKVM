<template>
  <v-card class="custom-card-disavbled mx-auto wrap-text" width="auto" @click.stop="keepMenuOpen">
    <v-sheet elevation="5" class="inner-sheet pa-4 mx-auto" width="100%">
      <v-sheet class="scrollable-container pa-4 text-center mx-auto" max-width="800" width="100%">
        <v-form ref="form">
          <v-row no-gutters class="d-flex justify-start align-center">
            <v-col>
              <v-switch
                v-model="device.video.isActive"
                inset
                :label="$t('settings.device.video.isHDMIActivateField')"
                density="compact"
                v-ripple
                color="#76FF03"
                @update:modelValue="toggleVideo"
              />
            </v-col>
          </v-row>

          <v-row no-gutters class="d-flex justify-start align-center" v-if="isExperimental">
            <v-col>
              <v-switch
                v-model="device.video.excludeFromStreaming"
                inset
                :label="$t('device.video.excludeFromStreamingField')"
                density="compact"
                v-ripple
                color="#76FF03"
              />
            </v-col>
          </v-row>

          <br />

          <!-- video mode -->
          <div class="d-flex text-caption justify-start">
            {{ $t('settings.device.video.modeField') }}
          </div>
          <v-row dense no-gutters class="d-flex justify-start align-center">
            <v-col cols="auto">
              <v-btn-toggle
                :model-value="localVideoMode"
                density="compact"
                rounded="lg"
                v-ripple
                color="#76FF03"
                variant="outlined"
                group
              >
                <v-btn
                  v-if="device.board.type === '4B' || device.board.type === 'CM4'"
                  value="h264"
                  @click="handleVideoModeChange('h264')"
                >
                  h264
                </v-btn>
                <v-tooltip v-else text="Tooltip" content-class="">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" value="h264" @click="handleVideoModeChange('h264')">
                      h264
                    </v-btn>
                  </template>
                  Not supported on this device
                </v-tooltip>
                <v-btn value="mjpeg" @click="handleVideoModeChange('mjpeg')"> MJPEG </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>

          <br /><br />
          <div class="d-flex text-caption justify-start">
            {{ $t('settings.device.video.inputFormat') }}
          </div>
          <v-row dense no-gutters v-if="device.board.type === '4B' || device.board.type === 'CM4'">
            <v-col>
              <v-text-field
                v-model="device.video.resolution"
                readonly
                :label="$t('settings.device.video.inputFormat')"
                density="compact"
                tile
                rounded="lg"
                color="#76FF03"
                variant="plain"
                hide-details
                single-line
              >
                <template v-slot:append>
                  <div
                    style="
                      display: flex;
                      align-items: center;
                      margin-left: 8px;
                      font-size: 0.85rem;
                      color: #76ff03;
                      font-weight: 500;
                    "
                  >
                    {{ device.video.capturedFps }} Hz
                  </div>
                </template>
              </v-text-field>
            </v-col>
          </v-row>
          <v-row dense no-gutters v-else>
            <v-col cols="12">
              <v-select
                v-model="device.video.resolution"
                :items="resolutionOptions"
                item-title="text"
                item-value="value"
                :disabled="!device.video.isActive"
                color="#76FF03"
                density="compact"
                variant="outlined"
                tile
                @update:modelValue="setResolution"
              />
            </v-col>
          </v-row>

          <div class="d-flex text-caption justify-start" v-if="device.video.videoMode === 'h264'">
            {{ $t('settings.device.video.liveFormat') }}
          </div>
          <v-row dense no-gutters v-if="device.video.videoMode === 'h264'">
            <v-col>
              <v-text-field
                :model-value="`${device.video.bitrate} kbps`"
                readonly
                :label="$t('settings.device.video.liveFormat')"
                density="compact"
                tile
                rounded="lg"
                color="#76FF03"
                variant="plain"
                hide-details
                single-line
              >
                <template v-slot:append>
                  <div
                    style="
                      display: flex;
                      align-items: center;
                      margin-left: 8px;
                      font-size: 0.85rem;
                      color: #76ff03;
                      font-weight: 500;
                    "
                  >
                    {{ device.video.fps }} Hz
                  </div>
                </template>
              </v-text-field>
            </v-col>
          </v-row>

          <br /><br />
          <div class="d-flex text-caption justify-start">
            {{ $t('settings.device.video.orientation') }}
          </div>

          <v-row dense no-gutters class="d-flex justify-start align-center">
            <v-col cols="auto">
              <v-btn-toggle
                v-model="device.video.orientation"
                density="compact"
                rounded="lg"
                v-ripple
                color="#76FF03"
                variant="outlined"
                divided
                @click="setOrientation(device.video.orientation)"
              >
                <v-btn value="0"> 0°</v-btn>
                <v-btn value="180"> 180° </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>

          <br /><br />

          <!-- FPS (Frames per Second) -->
          <v-row v-if="device.video.videoMode === 'mjpeg'">
            <div class="text-caption">
              {{ $t('settings.device.video.desiredFpsField') }}
            </div>
            <v-col cols="12">
              <v-slider
                v-model="device.video.desiredFps"
                :max="60"
                :step="10"
                show-ticks="always"
                tick-size="2"
                v-ripple
                color="#76FF03"
                track-fill-color="#76FF03"
                @click:revert="handleRefreshClick('mjpegFps')"
                @end="setStreamFPS"
                :disabled="device.video.isRequesting"
              >
                <template v-slot:append>
                  <v-text-field
                    v-model="device.video.desiredFps"
                    readonly
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    style="width: 94px"
                    type="number"
                    suffix="FPS"
                    variant="outlined"
                    hide-details
                    single-line
                  ></v-text-field>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <!-- quality -->
          <v-row
            v-if="
              device.video.videoMode === 'mjpeg' &&
              (device.board.type === '4B' || device.board.type === 'CM4')
            "
          >
            <div class="text-caption">
              {{ $t('settings.device.video.mjpegQualityField') }}
            </div>
            <v-col cols="12">
              <v-slider
                v-model="device.video.mjpegQuality"
                :min="10"
                :max="100"
                :step="10"
                show-ticks="always"
                tick-size="2"
                v-ripple
                color="#76FF03"
                track-fill-color="#76FF03"
                @click:revert="handleRefreshClick('mjpegQuality')"
                @end="setStreamQuality"
                :disabled="device.video.isRequesting"
              >
                <template v-slot:append>
                  <v-text-field
                    v-model="device.video.mjpegQuality"
                    readonly
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    style="width: 90px"
                    type="number"
                    suffix="%"
                    variant="outlined"
                    hide-details
                    single-line
                  ></v-text-field>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <!-- WebRTC Bitrate -->
          <v-row v-if="device.video.videoMode === 'h264'">
            <div class="text-caption">
              {{ $t('settings.device.video.WebRTCBitrateField') }}
            </div>
            <v-col cols="12">
              <v-slider
                v-model="device.video.WebRTCMbps"
                :min="0.1"
                :max="10"
                :step="0.1"
                show-ticks="always"
                tick-size="2"
                v-ripple
                color="#76FF03"
                track-fill-color="#76FF03"
                @click:revert="handleRefreshClick('WebRTCFps')"
                @end="setStreamBitrate"
                :disabled="device.video.isRequesting"
              >
                <template v-slot:append>
                  <v-text-field
                    v-model="device.video.WebRTCMbps"
                    readonly
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    style="width: 123px"
                    type="number"
                    suffix="Mbps"
                    variant="outlined"
                    hide-details
                    single-line
                  ></v-text-field>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <!-- WebRTC Gop -->
          <v-row v-if="device.video.videoMode === 'h264'">
            <div class="text-caption">
              {{ $t('settings.device.video.WebRTCGopField') }}
            </div>
            <v-col cols="12">
              <v-slider
                v-model="device.video.WebRTCGop"
                :max="60"
                :min="0"
                :step="1"
                show-ticks="always"
                tick-size="2"
                v-ripple
                color="#76FF03"
                track-fill-color="#76FF03"
                @click:revert="handleRefreshClick('WebRTCGop')"
                @end="setStreamGOP"
                :disabled="device.video.isRequesting"
              >
                <template v-slot:append>
                  <v-text-field
                    v-model="device.video.WebRTCGop"
                    readonly
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    style="width: 104px"
                    type="number"
                    variant="outlined"
                    hide-details
                    single-line
                  ></v-text-field>
                </template>
              </v-slider>
            </v-col>
          </v-row>
        </v-form>
      </v-sheet>
    </v-sheet>
  </v-card>
  <!--
    </v-menu>
    -->
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { useDevice } from '@/composables/useDevice';
  import { useVideoResolution } from '@/composables/useVideoResolution';
  import { useOrientation } from '/src/composables/useOrientation.js';
  import { storeToRefs } from 'pinia';
  import { useVideo } from '@/composables/useVideo';

  const { device } = useDevice();
  const store = useAppStore();
  const { isExperimental } = storeToRefs(store);
  const { initVideo, destroyJanusConnection, clearImageSource, initMjpeg } = useVideo();

  // Define the props and use v-model binding
  const props = defineProps({
    label: String,
    index: Number,
    modelValue: Boolean, // Auto-bound for v-model:is-menu-visible
  });

  const emit = defineEmits(['update:modelValue']);
  const {
    getVideoConfig,
    toggleVideo,
    setStreamFPS,
    setStreamBitrate,
    setStreamGOP,
    setStreamQuality,
    setResolution,
  } = useVideoResolution(device);
  const { setOrientation } = useOrientation(device);
  const isRequesting = ref(false);

  // Mapping available resolution options from the store
  const resolutionOptions = ref([
    '1920x1080',
    '1600x1200',
    '1360x768',
    '1280x1024',
    '1280x960',
    '1280x720',
    '800x600',
    '720x480',
    '640x480',
  ]);

  // 本地 videoMode 状态
  const localVideoMode = ref(device.value.video.videoMode);

  // 切换 videoMode 时先清理再赋值
  function handleVideoModeChange(mode) {
    if (mode === device.value.video.videoMode) return;
    if (mode === 'h264') {
      clearImageSource(); // stop MJPEG
      device.value.video.videoMode = mode;
      localVideoMode.value = mode;
      initVideo(); // start Janus WebRTC
    } else if (mode === 'mjpeg') {
      destroyJanusConnection(); // stop Janus WebRTC
      device.value.video.videoMode = mode;
      localVideoMode.value = mode;
      initMjpeg(); // start MJPEG
    }
    localStorage.setItem('videoMode', mode);
  }

  onMounted(() => {
    getVideoConfig();
  });

  // Method to keep the menu open
  const keepMenuOpen = (event) => {
    // You can add additional logic here if needed
    event.stopPropagation(); // Stop the event from bubbling up
  };

  const cancel = async () => {
    try {
    } catch (error) {
      console.error('Error during cancel operation:', error);
    }
  };

  // !! TODO you have to think when you want to process the user's changes. Directly or centrally (with OK button)
  // For me it should be centrally

  const save = async () => {
    try {
    } catch (error) {
      console.error('Error during save operation:', error);
    }
  };
</script>

<style scoped>
  .selected-orientation {
    background-color: #76ff03 !important;
    color: black !important;
  }
</style>
