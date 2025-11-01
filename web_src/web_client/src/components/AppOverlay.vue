<template>
  <v-overlay
    :model-value="showOverlay"
    :opacity="0"
    contained
    content-class="d-flex flex-column align-center justify-end w-100 h-100"
    :style="{ zIndex: zIndex.overlay }"
    :scrim="false"
    :persistent="true"
    no-click-animation
  >
    <!--
   <v-hover v-slot="{ isHovering, props }">  
-->

    <!-- top control bar-->
    <div
      class="overlay-control-bar d-flex w-100 ga-3 pa-1 justify-end align-center"
      style="margin-top: 0px; margin-right: 40px"
    >
      <KvmHandRaise v-if="isExperimental" />
      <KvmClipboard v-if="isExperimental" />

      <v-divider class="mx-3" inset vertical></v-divider>

      <v-tooltip location="top" content-class="">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :size="size"
            icon="mdi-camera-outline"
            @click="takeSnapshot"
          />
        </template>
        <span>Take snapshot</span>
      </v-tooltip>

      <v-tooltip v-if="device.video.videoMode === 'h264'" location="top" content-class="">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            class="text-none"
            :color="isRecording ? '#D32F2F' : '#76FF03'"
            :prepend-icon="isRecording ? 'mdi-stop' : 'mdi-radiobox-marked'"
            v-ripple
            :text="isRecording ? formattedRecordingTime : undefined"
            :variant="isRecording ? 'tonal' : 'plain'"
            @click="videoRecord"
          >
          </v-btn>
        </template>
        <span>{{ isRecording ? 'Stop recording' : 'Start recording' }}</span>
      </v-tooltip>
    </div>

    <v-spacer />
    <!-- Center control bar -->
    <v-spacer />

    <div
      class="overlay-control-bar d-flex w-100 ga-3 pa-1 justify-start align-center"
      style="margin-bottom: 10px; margin-left: 40px"
    >
      <!-- bottom control bar-->
      <div
        class="d-flex w-100 ga-3 pa-0 align-center"
        style="margin-bottom: 10px; margin-left: 40px"
      >
        <!-- <v-tooltip location="top" content-class="">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-icon
              v-bind="tooltipProps"
              :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
              :color="isHoveringPlaying ? '#76FF03' : undefined"
              :size="size"
              @click="isPlaying = !isPlaying"
              @mouseenter="isHoveringPlaying = true"
              @mouseleave="isHoveringPlaying = false"
            />
          </template>
          <span>Pause</span>
        </v-tooltip> -->

        <div v-if="device.video.videoMode === 'h264'">
          <v-tooltip location="top" content-class="">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                :color="!canUseMic ? '#9E9E9E' : audio.isMicrophoneOn ? '#76FF03' : undefined"
                :class="{ 'cursor-not-allowed': !canUseMic }"
                :size="size"
                :icon="audio.isMicrophoneOn ? 'mdi-microphone' : 'mdi-microphone-off'"
                @click="onMicClick"
              />
            </template>
            <span>{{
              canUseMic ? (audio.isMicrophoneOn ? 'Mute' : 'Unmute') : 'need to register mic first'
            }}</span>
          </v-tooltip>
        </div>

        <div
          v-if="device.video.videoMode === 'h264'"
          class="d-inline-flex align-center ga-2"
          @mouseenter="isHoveringVolume = true"
          @mouseleave="isHoveringVolume = false"
        >
          <v-tooltip location="top" content-class="">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                :color="isHoveringVolume || device.video.audioVolume > 0 ? '#76FF03' : undefined"
                :size="size"
                :icon="
                  device.video.audioVolume === 0 || undefined
                    ? 'mdi-volume-mute'
                    : device.video.audioVolume < 30
                      ? 'mdi-volume-low'
                      : device.video.audioVolume < 70
                        ? 'mdi-volume-medium'
                        : 'mdi-volume-high'
                "
                @click="device.video.audioVolume = 0"
              />
            </template>
            <span>Mute</span>
          </v-tooltip>

          <!-- Only show slider on hover -->
          <v-slider
            v-if="isHoveringVolume"
            v-model="device.video.audioVolume"
            direction="horizontal"
            hide-details
            color="#76FF03"
            track-color="white"
            track-size="10"
            style="width: 150px"
          />
        </div>

        <v-spacer />

        <!-- switch -->
        <template v-for="channel in filteredChannels" :key="channel.id">
          <v-tooltip v-if="channel.override" location="bottom" content-class="">
            <template #activator="{ props }">
              <div v-bind="props">
                <v-btn
                  size="x-small"
                  rounded
                  :color="channel.name == activeChannel ? 'primary' : 'green'"
                  @click="changeSwitchChannel(channel.name)"
                >
                  {{ channel.name }}
                </v-btn>
              </div>
            </template>
            <p>{{ displayName(channel) }}</p>
          </v-tooltip>

          <v-tooltip v-else location="bottom" content-class="">
            <template #activator="{ props }">
              <div v-bind="props">
                <v-btn
                  size="x-small"
                  rounded
                  :color="channel.name == activeChannel ? 'primary' : 'green'"
                  @click="changeSwitchChannel(channel.name)"
                >
                  {{ channel.name }}
                </v-btn>
              </div>
            </template>
            <p>{{ displayName(channel) }}</p>
          </v-tooltip>
        </template>

        <!-- ATX -->
        <v-menu location="top" v-if="device.isATXActive" :style="{ zIndex: zIndex.overlay }">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="#76FF03"
              prepend-icon="mdi-power-settings"
              size="large"
              rounded
              text="mytarget"
              variant="plain"
            >
            </v-btn>
          </template>

          <v-list select-strategy="leaf">
            <v-list-item
              v-for="(atxItem, atxIndex) in atxItems"
              :key="atxIndex"
              :value="atxIndex"
              active-class="text-green"
              @click="triggerPowerButton(atxItem.action)"
            >
              <v-icon :icon="atxItem.icon" color="#76FF03"></v-icon>
              {{ atxItem.title }}
            </v-list-item>
          </v-list>
        </v-menu>

        <v-divider class="mx-3" inset vertical></v-divider>

        <!-- <v-tooltip location="top" content-class="">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-icon
              v-bind="tooltipProps"
              :color="isMicrophoneOn ? '#76FF03' : undefined"
              :size="size"
              icon="mdi-chat-processing-outline"
              @click="toggleMicrophone"
            />
          </template>
          <span>Chat</span>
        </v-tooltip> -->

        <div v-if="isExperimental">
          <v-tooltip location="top" content-class="">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                :color="isCameraOn ? '#76FF03' : undefined"
                :size="size"
                :icon="isCameraOn ? 'mdi-video' : 'mdi-video-off-outline'"
                @click="toggleCamera(streamElementRef)"
              />
            </template>
            <span>{{ isCameraOn ? 'Turn off' : 'Turn on' }}</span>
          </v-tooltip>

          <v-tooltip location="top" content-class="">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                :color="isShowingPiP ? '#76FF03' : undefined"
                :size="size"
                :icon="
                  isShowingPiP
                    ? 'mdi-picture-in-picture-bottom-right'
                    : 'mdi-picture-in-picture-bottom-right-outline'
                "
                @click="togglePiP"
              />
            </template>
            <span>{{ isShowingPiP ? 'Turn off PIP' : 'Turn on PIP' }}</span>
          </v-tooltip>

          <v-tooltip location="top">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                :color="isCasting ? '#76FF03' : undefined"
                :size="size"
                :icon="isCasting ? 'mdi-cast-connected' : 'mdi-cast'"
                @click="toggleCast"
              />
            </template>
            <span>{{ isCasting ? 'Stop Casting' : 'Start Casting' }}</span>
          </v-tooltip>

          <v-divider class="mx-3" inset vertical></v-divider>
        </div>
      </div>
    </div>
  </v-overlay>

  <div v-if="isExperimental">
    <cursorOverlay :z-index="zIndex.overlay" />
    <cursorOverlayTom :z-index="zIndex.overlay" />
    <cursorOverlayDick :z-index="zIndex.overlay" />
    <cursorOverlayHarry :z-index="zIndex.overlay" />
  </div>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { useMicrophone } from '@/composables/useMicrophone';
  import { useCamera } from '@/composables/useCameraWithSwitch';
  import http from '@/utils/http.js';
  import { zIndex } from '@/styles/zIndex'; // TODO should be constants!
  import { useHdmiSwitch } from '@/composables/useHdmiSwitch';
  import { useI18n } from 'vue-i18n';
  import { useDiagnostics } from '@/composables/useDiagnostics';

  const { startDiagnosticsConnecting } = useDiagnostics();
  const store = useAppStore();
  const { device } = useDevice();
  const { t } = useI18n();
  const { kvmSwitch, changeSwitchChannel } = useHdmiSwitch();
  // Computed property to access hdmiSwitch items
  const kvmSwitchItems = computed(() => kvmSwitch.value.items || []);
  const canUseMic = computed(() => device.value?.mic?.isRegistered === true);

  const onMicClick = () => {
    if (!canUseMic.value) return;
    toggleMicrophone();
  };

  const {
    isProcessing,
    showOverlay,
    isShowingPiP,
    isCasting,
    pipVideoElement,
    isExperimental,
    isCameraOn,
    audio,
    isRecording,
  } = storeToRefs(store);

  defineProps({
    zIndex: {
      type: [String, Number],
      default: 1000,
    },
  });

  const isHoveringVolume = ref(false);
  const size = 25;
  const activeChannel = computed(() => {
    const selectedSwitch = kvmSwitchItems.value.find(
      (item) => item.id === kvmSwitch.value.activeSwitchId
    );
    return selectedSwitch ? selectedSwitch.activeChannel : -1;
  });

  const filteredChannels = computed(() => {
    const selectedSwitch = kvmSwitchItems.value.find(
      (item) => item.id === kvmSwitch.value.activeSwitchId
    );
    return selectedSwitch ? selectedSwitch.channels : [];
  });

  let mediaRecorder;
  let recordedChunks = [];
  let fileHandle;
  let writableStream;
  let recordingTimer = null; // 用于存储计时器
  let recordingSeconds = ref(0); // 用于存储录制的秒数

  // 格式化时间为 12h20m3s 格式
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h${m}m${s}s`;
  };

  // 计算格式化后的时间
  const formattedRecordingTime = computed(() => formatTime(recordingSeconds.value));

  const triggerPowerButton = async (button) => {
    try {
      startDiagnosticsConnecting();
      const response = await http.post(`/atx/click?button=${button}`);
      console.log(response.data);
      // return response.data;
    } catch (error) {
      console.error('Error during atx button trigger:', error);
    }
  };

  const displayName = (channel) => {
    return channel.override && channel.override.length > 0 ? channel.override : channel.name;
  };

  const hasParticipants = (channel) => {
    return false;
  };

  const { turnOnMic, turnOffMic } = useMicrophone(device); // TODO error
  const { startCamera, stopCamera, enterPiP, exitPiP } = useCamera(device); //error

  const atxItems = computed(() => {
    if (!device.value) return [];
    return [
      {
        icon: 'mdi-power',
        color: device.value.health.isPowerLedActive ? 'primary' : 'error',
        title: t('settings.atx.powerOn'),
        action: 'power',
      },
      {
        icon: 'mdi-power-sleep',
        color: device.value.health.isPowerLedActive ? 'primary' : 'error',
        title: t('settings.atx.powerOff'),
        action: 'power',
      },
      {
        icon: 'mdi-power-off',
        color: device.value.health.isPowerLedActive ? 'primary' : 'error',
        title: t('settings.atx.forceOff'),
        action: 'forcepower',
      },
      {
        icon: 'mdi-restart',
        color: device.value.health.isPowerLedActive ? 'primary' : 'error',
        title: t('settings.atx.reset'),
        action: 'reboot',
      },
    ];
  });

  const toggleMicrophone = () => {
    if (audio.value.isMicrophoneOn) {
      turnOffMic();
    } else {
      turnOnMic();
    }
  };

  const toggleCamera = async (videoElement) => {
    if (device.value.video.isCameraOn) {
      await stopCamera(videoElement);
    } else {
      await startCamera();
    }
  };

  const togglePiP = () => {
    if (isShowingPiP.value) {
      exitPiP(document);
      isShowingPiP.value = !isShowingPiP.value;
    } else {
      enterPiP(pipVideoElement.value);
      isShowingPiP.value = !isShowingPiP.value;
    }
  };

  const toggleCast = () => {
    if (isCasting.value) {
      isCasting.value = !isCasting.value;
    } else {
      isCasting.value = !isCasting.value;
    }
  };

  const takeSnapshot = () => {
    device.value.video.isTakeScreenshot = true;
  };

  function videoRecord() {
    if (isRecording.value) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  async function startRecording() {
    try {
      console.log('Start recording...');

      recordedChunks = [];
      const videoId = document.getElementById('webrtc-output');
      if (!videoId) {
        console.error('Video element not found');
        return;
      }
      const stream = videoId.captureStream();
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

      mediaRecorder.onstart = function () {
        isRecording.value = true;
        console.log('MediaRecorder started');

        // 开始计时器，每秒更新一次录制时间
        recordingTimer = setInterval(() => {
          recordingSeconds.value++;
        }, 1000);
      };

      mediaRecorder.ondataavailable = async function (event) {
        console.log('Data available event triggered');
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
          console.log('Writing data chunk, size:', event.data.size);
          await writableStream.write(event.data);
          console.log('Data chunk written.');
        } else {
          console.log('Data chunk empty');
        }
      };

      mediaRecorder.onstop = async function () {
        console.log('Stopping media recorder...');
        await writableStream.close();
        console.log('Writable stream closed.');
        isRecording.value = false;
        // 停止计时器
        clearInterval(recordingTimer);
        recordingTimer = null;
      };

      mediaRecorder.onerror = function (event) {
        console.error('MediaRecorder error:', event.error);
      };

      // Request file access
      console.log('Requesting file handle...');
      fileHandle = await window.showSaveFilePicker({
        suggestedName: 'recording.webm',
        types: [
          {
            description: 'WebM Video',
            accept: { 'video/webm': ['.webm'] },
          },
        ],
      });

      console.log('Creating writable stream...');
      writableStream = await fileHandle.createWritable();
      mediaRecorder.start(1000); // 每秒生成一个数据块
      console.log('Media recorder started.');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  async function stopRecording() {
    try {
      console.log('Stop recording...');
      mediaRecorder.stop();
      console.log('Media recorder stopped.');
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }
</script>

<style scoped>
  .cursor-not-allowed {
    cursor: not-allowed;
    opacity: 0.6;
  }
  .green-text {
    color: #76ff03;
  }

  /* ============================================
   Overlay Mouse Passthrough Architecture
   ============================================ */

  /* Base overlay - allows mouse events to pass through to KVM */
  :deep(.v-overlay__scrim) {
    pointer-events: none !important;
  }

  :deep(.v-overlay__content) {
    pointer-events: none !important;
  }

  /* Interactive control areas - capture mouse events */
  .overlay-control-bar {
    pointer-events: auto !important;
  }

  .overlay-interactive {
    pointer-events: auto !important;
    cursor: pointer;
  }

  /* Menu and dropdown elements - ensure clickability */
  :deep(.v-menu__content) {
    pointer-events: auto !important;
  }

  :deep(.v-overlay--active.v-menu) {
    pointer-events: auto !important;
  }

  :deep(.v-list) {
    pointer-events: auto !important;
  }

  :deep(.v-list-item) {
    pointer-events: auto !important;
    cursor: pointer !important;
  }

  /* Ensure all interactive elements within control bars work */
  .overlay-control-bar * {
    pointer-events: auto !important;
  }
</style>
