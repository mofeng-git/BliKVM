<template>
  <!-- Mic Registration -->
  <v-expansion-panels v-model="panelProxy" multiple>
    <v-expansion-panel value="mic" @group:selected="handlePanelOpen">
      <v-expansion-panel-title>
        <template v-slot:default="{ expanded }">
          <v-card class="transparent-card" density="compact" tile width="100%">
            <v-row dense no-gutters class="d-flex justify-end align-center">
              <v-col cols="1">
                <v-icon>mdi-microphone</v-icon>
              </v-col>
              <v-col class="d-flex justify-start align-center" cols="4">
                {{ $t('settings.device.audio.title') }}
              </v-col>
              <v-col class="d-flex justify-end align-center">
                <v-chip :color="micStatus.color">
                  {{ $t(micStatus.labelKey) }}
                </v-chip>
              </v-col>
            </v-row>
            <v-row v-if="expanded" dense>
              <v-col cols="*">
                <v-card-subtitle>
                  {{ $t('settings.device.audio.subtitle') }}
                </v-card-subtitle>
              </v-col>
            </v-row>
          </v-card>
        </template>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-card-text class="text-medium-emphasis pa-6">
          <v-row dense no-gutters class="d-flex align-center">
            <v-col class="d-flex justify-start align-center" cols="6">
              {{ $t('settings.device.audio.registerMic') }}
            </v-col>
            <v-col class="d-flex justify-end align-center">
              <v-switch
                v-model="device.mic.isRegistered"
                color="#76FF03"
                inset
                hide-details
                @update:modelValue="setMicRegistration"
              />
            </v-col>
          </v-row>
          <v-text-field
            v-if="device?.mic?.isRegistered && audio?.isMicrophoneOn"
            :model-value="displayMicrophoneName"
            density="compact"
            rounded="lg"
            variant="outlined"
            hide-details
            readonly
          />
          <!-- Mic input level meter -->

          <div v-if="showMicMeter" class="mt-3">
            <div class="d-flex align-center mb-2">
              <v-icon class="me-2" size="small">mdi-waveform</v-icon>
              <span class="text-caption">Input Level</span>
            </div>
            <v-progress-linear
              :model-value="micLevelPct"
              height="8"
              rounded
              :color="getMicLevelColor(micLevelPct)"
              bg-color="grey-darken-3"
              :striped="micLevelPct > 0"
              :indeterminate="false"
              class="mic-level-indicator"
            />
          </div>
        </v-card-text>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
  import { ref, computed, watch, onUnmounted } from 'vue';
  import { useDevice } from '@/composables/useDevice.js';
  import { useAlert } from '@/composables/useAlert.js';
  import http from '@/utils/http.js';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useMicrophone } from '@/composables/useMicrophone.js';

  const store = useAppStore();
  const { audio } = storeToRefs(store);

  // v-model:innerPanel support
  const props = defineProps({
    innerPanel: { type: Array, default: () => [] },
  });
  const emit = defineEmits(['update:innerPanel']);
  const panelProxy = computed({
    get: () => props.innerPanel,
    set: (val) => emit('update:innerPanel', val),
  });

  const displayMicrophoneName = computed(() => {
    return audio.value.microphoneName?.trim()
      ? audio.value.microphoneName
      : 'No microphone detected';
  });

  const { device } = useDevice();
  const { sendAlert } = useAlert();
  const { turnOffMic } = useMicrophone(device);

  // Panel open state helper
  const isPanelOpen = computed(
    () => Array.isArray(panelProxy.value) && panelProxy.value.includes('mic')
  );

  // Mic level metering using Web Audio API
  const micLevel = ref(0); // 0..1
  const micLevelPct = computed(() => Math.min(100, Math.max(0, Math.round(micLevel.value * 100))));
  const showMicMeter = computed(() => {
    return isPanelOpen.value && !!audio.value.isMicrophoneOn && !!device.value?.video?.audioStream;
  });

  // Chip status for registration/mic state
  const micStatus = computed(() => {
    const registered = !!device.value?.mic?.isRegistered;
    const micOn = !!audio.value?.isMicrophoneOn;
    if (!registered) {
      return { color: '#76FF03', labelKey: 'common.unregister' };
    }
    if (!micOn) {
      return { color: 'orange', labelKey: 'common.blocked' };
    }
    return { color: '#76FF03', labelKey: 'common.allowed' };
  });

  let audioCtx = null;
  let analyser = null;
  let sourceNode = null;
  let rafId = null;

  const stopMeter = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    try {
      if (sourceNode) sourceNode.disconnect();
      if (analyser) analyser.disconnect();
    } catch (e) {}
    sourceNode = null;
    analyser = null;
    if (audioCtx) {
      try {
        audioCtx.close();
      } catch (e) {}
      audioCtx = null;
    }
    micLevel.value = 0;
  };

  const startMeter = async (stream) => {
    stopMeter();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx || !stream) return;
    audioCtx = new Ctx();
    try {
      await audioCtx.resume?.();
    } catch (e) {}
    sourceNode = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    sourceNode.connect(analyser);
    const buffer = new Uint8Array(analyser.fftSize);
    const smooth = 0.2;
    const loop = () => {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buffer.length);
      micLevel.value = (1 - smooth) * micLevel.value + smooth * rms;
      rafId = requestAnimationFrame(loop);
    };
    loop();
  };

  // Load current state on open
  const handlePanelOpen = async (selected) => {
    if (typeof selected === 'object' && selected && 'value' in selected) {
      selected = selected.value;
    }
    if (selected === false) return;
    try {
      const res = await http.get('/mic');
      if (res.status === 200 && res.data?.code === 0) {
        device.value.mic = device.value.mic || {};
        device.value.mic.isRegistered = !!res.data.data?.mic;
        console.log('mic status', device.value.mic.isRegistered, ' res.data.data:', res.data.data);
        // Start meter if conditions already satisfied
        if (audio.value.isMicrophoneOn && device.value?.video?.audioStream) {
          startMeter(device.value.video.audioStream);
        }
      }
    } catch (e) {
      // Ignore; keep current UI state
    }
  };

  // Persist change
  const setMicRegistration = async (val) => {
    const prev = !!device.value.mic?.isRegistered;
    try {
      const res = await http.post('/mic', { enable: !!val });
      if (!(res.status === 200 && res.data?.code === 0)) {
        sendAlert(
          'error',
          'Mic',
          `Set mic registration failed: ${res.data?.msg || 'request failed'}`
        );
      }
      device.value.mic.isRegistered = !!res.data.data?.mic;
      console.log('setMicRegistration val:', val);
      if (val === false) {
        turnOffMic();
      }
    } catch (err) {
      device.value.mic.isRegistered = prev; // revert
      sendAlert('error', 'Mic', `Set mic registration failed: ${err.message}`);
    }
  };

  const getMicLevelColor = (level) => {
    if (level < 60) {
      return 'green'; // Safe zone: -∞ to -18 dB
    } else if (level < 75) {
      return 'lime'; // Good level: -18 to -12 dB
    } else if (level < 85) {
      return 'orange'; // Caution zone: -12 to -6 dB
    } else {
      return 'red'; // Danger zone: -6 to 0 dB (clipping risk)
    }
  };

  // React to changes in conditions (open state, mic on/off, stream attach)
  watch(showMicMeter, (val) => {
    if (val) {
      startMeter(device.value?.video?.audioStream);
    } else {
      stopMeter();
    }
  });

  onUnmounted(() => {
    stopMeter();
  });
</script>

<style scoped></style>
