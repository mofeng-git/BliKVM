<template>
  <v-container>
    <v-btn @click="startStreaming" :disabled="streaming">Start Streaming</v-btn>
    <v-btn @click="stopStreaming" :disabled="!streaming">Stop Streaming</v-btn>
    <div>Status: {{ status }}</div>
  </v-container>
</template>

<script setup>
  import { ref } from 'vue';

  const streaming = ref(false);
  const status = ref('Idle');

  let ws = null;
  let mediaStream = null;
  let audioContext = null;
  let processor = null;
  let sourceNode = null;

  // Opus encoder WASM setup (using libopus.js or similar)
  // For simplicity, here we'll send raw PCM frames in Float32Array (not encoded).
  // Replace with actual Opus encoding for production.

  async function startStreaming() {
    if (streaming.value) return;
    try {
      status.value = 'Requesting microphone access...';
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new AudioContext({ sampleRate: 48000 });
      sourceNode = audioContext.createMediaStreamSource(mediaStream);

      // ScriptProcessorNode is deprecated, but simpler to demo here.
      processor = audioContext.createScriptProcessor(4096, 1, 1);
      sourceNode.connect(processor);
      processor.connect(audioContext.destination);

      ws = new WebSocket('ws://localhost:3000/ws');

      ws.binaryType = 'arraybuffer';
      ws.onopen = () => {
        status.value = 'WebSocket connected. Streaming audio...';
        streaming.value = true;
      };
      ws.onerror = (e) => {
        status.value = 'WebSocket error';
        console.error(e);
      };
      ws.onclose = () => {
        status.value = 'WebSocket closed';
        streaming.value = false;
      };

      processor.onaudioprocess = (event) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const inputBuffer = event.inputBuffer.getChannelData(0);
        // For now, send raw Float32 PCM converted to Int16
        const int16Buffer = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
          let s = Math.max(-1, Math.min(1, inputBuffer[i]));
          int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        ws.send(int16Buffer.buffer);
      };
    } catch (err) {
      status.value = 'Error: ' + err.message;
    }
  }

  function stopStreaming() {
    if (!streaming.value) return;
    processor.disconnect();
    sourceNode.disconnect();
    audioContext.close();
    mediaStream.getTracks().forEach((t) => t.stop());
    ws.close();
    streaming.value = false;
    status.value = 'Stopped';
  }
</script>
