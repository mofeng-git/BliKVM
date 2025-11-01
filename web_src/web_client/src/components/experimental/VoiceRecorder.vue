<template>
  <v-card class="mx-auto pa-6" max-width="600">
    <v-card-title class="text-center text-h4 mb-4"> Voice Recorder </v-card-title>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <!-- Control Buttons -->
    <div class="d-flex justify-center gap-4 mb-6">
      <v-btn
        :color="isConnected ? 'error' : 'primary'"
        variant="elevated"
        size="large"
        @click="handleConnect"
      >
        <v-icon start>
          {{ isConnected ? 'mdi-wifi-off' : 'mdi-wifi' }}
        </v-icon>
        {{ isConnected ? 'Disconnect' : 'Connect' }}
      </v-btn>

      <v-btn
        :color="isRecording ? 'error' : 'success'"
        variant="elevated"
        size="large"
        :disabled="!isConnected || !audioInitialized"
        @click="isRecording ? stopMic() : startMic()"
      >
        <v-icon start>
          {{ isRecording ? 'mdi-microphone-off' : 'mdi-microphone' }}
        </v-icon>
        {{ isRecording ? 'Stop Recording' : 'Start Recording' }}
      </v-btn>

      <v-btn v-if="isPlaying" color="warning" variant="elevated" size="large" @click="stopPlayback">
        <v-icon start>mdi-volume-off</v-icon>
        Stop Playback
      </v-btn>
    </div>

    <!-- Status Indicators -->
    <v-row class="text-center">
      <v-col cols="4">
        <v-chip :color="isConnected ? 'success' : 'error'" variant="flat" class="ma-1">
          <v-icon start>
            {{ isConnected ? 'mdi-check-circle' : 'mdi-close-circle' }}
          </v-icon>
          {{ isConnected ? 'Connected' : 'Disconnected' }}
        </v-chip>
      </v-col>

      <v-col cols="4">
        <v-chip :color="isRecording ? 'error' : 'grey'" variant="flat" class="ma-1">
          <v-icon start>
            {{ isRecording ? 'mdi-record-rec' : 'mdi-record' }}
          </v-icon>
          {{ isRecording ? 'Recording' : 'Not Recording' }}
        </v-chip>
      </v-col>

      <v-col cols="4">
        <v-chip :color="isPlaying ? 'info' : 'grey'" variant="flat" class="ma-1">
          <v-icon start>mdi-volume-high</v-icon>
          {{ isPlaying ? 'Playing' : 'Silent' }}
        </v-chip>
      </v-col>
    </v-row>

    <!-- Debug Info (Optional) -->
    <v-expansion-panels v-if="showDebug" class="mt-4">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon start>mdi-bug</v-icon>
          Debug Information
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-caption">
            <p><strong>Audio Initialized:</strong> {{ audioInitialized }}</p>
            <p><strong>Libraries Status:</strong> {{ librariesStatus }}</p>
            <p><strong>Decode Errors:</strong> {{ decodeErrorCount }}</p>
            <p><strong>Audio Context State:</strong> {{ audioContextState }}</p>
            <p><strong>WebSocket State:</strong> {{ webSocketState }}</p>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, computed } from 'vue';

  // Dynamic imports
  let OpusRecorder = null;
  let OpusDecoderLib = null;

  // Reactive state
  const isRecording = ref(false);
  const isConnected = ref(false);
  const error = ref(null);
  const isPlaying = ref(false);
  const showDebug = ref(true); // Set to true for debugging
  const audioInitialized = ref(false);
  const librariesLoaded = ref(false);

  // Refs for audio components
  const recorder = ref(null);
  const decoder = ref(null);
  const micSocket = ref(null);
  const audioContext = ref(null);
  const sourceNode = ref(null);
  const playbackBuffer = ref([]);
  const decodeErrorCount = ref(0);
  const maxDecodeErrors = 10;

  // Computed properties for debug info
  const audioContextState = computed(() => {
    return audioContext.value ? audioContext.value.state : 'not initialized';
  });

  const webSocketState = computed(() => {
    if (!micSocket.value) return 'not connected';
    const states = {
      0: 'CONNECTING',
      1: 'OPEN',
      2: 'CLOSING',
      3: 'CLOSED',
    };
    return states[micSocket.value.readyState] || 'unknown';
  });

  const librariesStatus = computed(() => {
    return librariesLoaded.value ? 'Loaded' : 'Loading/Failed';
  });

  // Dynamic import function with proper error handling
  const loadOpusLibraries = async () => {
    try {
      console.log('Loading Opus libraries...');

      // Import opus-recorder
      const recorderModule = await import('opus-recorder');
      OpusRecorder = recorderModule.default || recorderModule;
      console.log('OpusRecorder loaded:', typeof OpusRecorder);

      // Import opus-decoder - this library has a different API
      const decoderModule = await import('opus-decoder');
      OpusDecoderLib = decoderModule.default || decoderModule;
      console.log('OpusDecoder library loaded:', typeof OpusDecoderLib);

      librariesLoaded.value = true;
      console.log('Opus libraries loaded successfully');
    } catch (err) {
      console.error('Failed to load Opus libraries:', err);
      error.value = `Failed to load libraries: ${err.message}`;
      librariesLoaded.value = false;
    }
  };

  // Initialize audio context and decoder
  const initializeAudio = async () => {
    try {
      // Load libraries first
      await loadOpusLibraries();

      if (!librariesLoaded.value) {
        throw new Error('Libraries not loaded');
      }

      // Initialize audio context
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)();

      // Initialize Opus decoder with correct API
      if (OpusDecoderLib) {
        try {
          // The opus-decoder library uses a different API - create decoder instance
          decoder.value = new OpusDecoderLib({
            sampleRate: 48000,
            channels: 1,
            forceStereo: false,
          });
          console.log('Decoder initialized successfully');
        } catch (decoderError) {
          console.error('Failed to initialize decoder with options, trying without:', decoderError);
          try {
            // Try without options
            decoder.value = new OpusDecoderLib();
            console.log('Decoder initialized without options');
          } catch (fallbackError) {
            console.error('Failed to initialize decoder (fallback):', fallbackError);
            throw fallbackError;
          }
        }
      } else {
        throw new Error('OpusDecoder library not available');
      }

      audioInitialized.value = true;
      console.log('Audio system initialized successfully');
    } catch (err) {
      console.error('Failed to initialize audio:', err);
      error.value = `Audio initialization failed: ${err.message}`;
      audioInitialized.value = false;
    }
  };

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      micSocket.value = new WebSocket('wss://192.168.1.217:3000/ws');

      micSocket.value.onopen = () => {
        console.log('WebSocket connected');
        isConnected.value = true;
        error.value = null;

        // Send client identification
        micSocket.value.send(
          JSON.stringify({
            type: 'identify',
            clientId: `client_${Date.now()}`,
          })
        );
      };

      micSocket.value.onmessage = async (event) => {
        try {
          if (event.data instanceof Blob) {
            const arrayBuffer = await event.data.arrayBuffer();
            const opusData = new Uint8Array(arrayBuffer);

            console.log(`Received Opus frame: ${opusData.length} bytes`);

            await decodeAndPlayOpus(opusData);
          }
        } catch (err) {
          console.error('Error processing received audio:', err);
        }
      };

      micSocket.value.onclose = () => {
        console.log('WebSocket disconnected');
        isConnected.value = false;
        if (isRecording.value) {
          stopMic();
        }
      };

      micSocket.value.onerror = (socketError) => {
        console.error('WebSocket error:', socketError);
        error.value = 'WebSocket connection failed';
        isConnected.value = false;
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      error.value = 'Failed to connect to server';
    }
  };

  // Validate Opus frame
  const validateOpusFrame = (data) => {
    if (!data || data.length === 0) {
      console.warn('Empty or null Opus frame');
      return false;
    }

    if (data.length < 2) {
      console.warn(`Opus frame too short: ${data.length} bytes`);
      return false;
    }

    // Basic Opus frame validation
    const firstByte = data[0];
    const config = (firstByte >> 3) & 0x1f;

    if (config > 31) {
      console.warn(`Invalid Opus config: ${config}`);
      return false;
    }

    console.log(`Valid Opus frame: ${data.length} bytes, config: ${config}`);
    return true;
  };

  // Reinitialize decoder
  const reinitializeDecoder = async () => {
    console.log('Reinitializing Opus decoder...');
    try {
      if (decoder.value) {
        decoder.value = null;
      }

      if (OpusDecoderLib) {
        decoder.value = new OpusDecoderLib({
          sampleRate: 48000,
          channels: 1,
          forceStereo: false,
        });

        decodeErrorCount.value = 0;
        console.log('Decoder reinitialized successfully');
      } else {
        console.error('OpusDecoder not available for reinitialization');
      }
    } catch (err) {
      console.error('Failed to reinitialize decoder:', err);
      // Try without options as fallback
      try {
        decoder.value = new OpusDecoderLib();
        decodeErrorCount.value = 0;
        console.log('Decoder reinitialized (fallback)');
      } catch (fallbackErr) {
        console.error('Fallback decoder initialization failed:', fallbackErr);
      }
    }
  };

  // Decode and play Opus audio
  const decodeAndPlayOpus = async (opusData) => {
    if (!decoder.value || !audioContext.value) {
      console.warn('Decoder or audio context not available');
      return;
    }

    if (!validateOpusFrame(opusData)) {
      console.warn('Invalid Opus frame, skipping...');
      return;
    }

    try {
      // The opus-decoder API might be different - try different methods
      let audioData;

      try {
        // Method 1: decode method
        audioData = await decoder.value.decode(opusData);
      } catch (decodeErr) {
        console.warn('decode() method failed, trying decodeFrame():', decodeErr);
        try {
          // Method 2: decodeFrame method
          audioData = await decoder.value.decodeFrame(opusData);
        } catch (frameErr) {
          console.warn('decodeFrame() method failed:', frameErr);
          throw frameErr;
        }
      }

      if (!audioData || audioData.length === 0) {
        console.warn('Decoder returned empty audio data');
        return;
      }

      console.log(`Decoded ${audioData.length} audio samples`);

      // Reset error count on successful decode
      decodeErrorCount.value = 0;

      // Create audio buffer and play
      const audioBuffer = audioContext.value.createBuffer(1, audioData.length, 48000);
      audioBuffer.copyToChannel(audioData, 0);

      const source = audioContext.value.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.value.destination);

      source.onended = () => {
        isPlaying.value = false;
      };

      isPlaying.value = true;
      source.start();
    } catch (decodeError) {
      console.error('Opus decode error:', decodeError);
      decodeErrorCount.value++;

      if (decodeErrorCount.value >= maxDecodeErrors) {
        console.warn(`Too many decode errors (${decodeErrorCount.value}), reinitializing decoder`);
        await reinitializeDecoder();
      }
    }
  };

  // Start microphone recording
  const startMic = async () => {
    try {
      if (!isConnected.value) {
        error.value = 'Not connected to server';
        return;
      }

      if (!audioInitialized.value) {
        error.value = 'Audio system not initialized';
        return;
      }

      // Resume audio context if suspended
      if (audioContext.value.state === 'suspended') {
        await audioContext.value.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      if (!OpusRecorder) {
        error.value = 'Opus recorder library not loaded';
        return;
      }

      // Create recorder with proper paths - try different path configurations
      const recorderOptions = {
        encoderSampleRate: 48000,
        numberOfChannels: 1,
        streamPages: true,
        maxBuffersPerPage: 40,
        encoderApplication: 2049, // VOIP
      };

      // Try to set encoder path - this might not be needed for newer versions
      try {
        // Check if we need to specify worker paths
        recorderOptions.encoderPath = './node_modules/opus-recorder/dist/encoderWorker.min.js';
      } catch (pathErr) {
        console.warn('Could not set encoder path, trying without:', pathErr);
      }

      recorder.value = new OpusRecorder(recorderOptions);

      recorder.value.ondataavailable = (data) => {
        if (micSocket.value && micSocket.value.readyState === WebSocket.OPEN) {
          console.log(`Sending ${data.byteLength || data.length} bytes to server`);
          micSocket.value.send(data);
        } else {
          console.warn('WebSocket not ready, cannot send audio data');
        }
      };

      recorder.value.onerror = (err) => {
        console.error('Recorder error:', err);
        error.value = `Recording error: ${err.message || err}`;
      };

      await recorder.value.start(stream);
      isRecording.value = true;
      error.value = null;
    } catch (err) {
      console.error('Error starting microphone:', err);
      error.value = `Failed to start microphone: ${err.message}`;
    }
  };

  // Stop microphone recording
  const stopMic = () => {
    try {
      if (recorder.value) {
        recorder.value.stop();
        recorder.value = null;
      }

      if (sourceNode.value) {
        sourceNode.value.disconnect();
        sourceNode.value = null;
      }

      isRecording.value = false;
    } catch (err) {
      console.error('Error stopping microphone:', err);
    }
  };

  // Stop playback
  const stopPlayback = () => {
    try {
      isPlaying.value = false;
      playbackBuffer.value = [];
    } catch (err) {
      console.error('Error stopping playback:', err);
    }
  };

  // Handle connect/disconnect
  const handleConnect = () => {
    if (isConnected.value) {
      if (micSocket.value) {
        micSocket.value.close();
      }
    } else {
      connectWebSocket();
    }
  };

  // Lifecycle hooks
  onMounted(() => {
    initializeAudio();
  });

  onUnmounted(() => {
    if (audioContext.value && audioContext.value.state !== 'closed') {
      audioContext.value.close();
    }
    if (decoder.value) {
      decoder.value = null;
    }
    if (micSocket.value) {
      micSocket.value.close();
    }
  });
</script>

<style scoped>
  .gap-4 {
    gap: 1rem;
  }
</style>
