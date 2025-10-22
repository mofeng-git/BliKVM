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
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom" @open="fetchVideoConfig">
    <template v-slot:activator="{ props }">
      <v-btn icon class="toolbar-btn" size="30" v-bind="props">
        <v-icon class="toolbar-icon">mdi-video</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ $t('tab.video.tip') }}</v-tooltip>
      </v-btn>
    </template>
    <UiParentCard :title="$t('tab.video.title')" @mouseenter.stop @mousemove.stop>
      <div class="d-flex align-center">
        <v-btn key="primary" color="primary" @click="fetchSnapshot">
          {{ $t('tab.video.snapshot') }}
        </v-btn>

        <v-btn v-if="videoMode === 'h264'" key="primary" :color="recordFlag ? 'green' : 'primary'" class="ml-3"
          @click="recordFlag ? stopRecording() : startRecording()">
          {{ recordFlag ? $t('tab.video.stop_record') : $t('tab.video.start_record') }}
        </v-btn>

      </div>



      <div class="d-flex align-center">
        <v-label class="font-weight-medium align-center">{{ $t('tab.video.mode') }}</v-label>
        <v-radio-group v-model="videoMode" inline class="ml-3 align-center">
          <v-radio label="mjpeg" color="primary" value="mjpeg"></v-radio>
          <v-radio label="h264" color="primary" value="h264"></v-radio>
        </v-radio-group>
      </div>

      <div v-if="hardwareType === 'pi'" class="d-flex align-center">
        <v-label class="font-weight-medium align-center">{{ $t('tab.video.resolution') }}: </v-label>
        <v-chip class="ma-2">
          {{ resolutionWidth }} x {{ resolutionHeight }} {{ capturedFps }}Hz
        </v-chip>
      </div>

      <div v-if="hardwareType === 'mangoPi'" class="d-flex align-center">
        <v-label class="font-weight-medium align-center">{{ $t('tab.video.resolution') }}: </v-label>
        <v-autocomplete class="ml-3" v-model="switchResolutionsValue" :items="switchResolutions" color="primary"
          variant="filled" hide-details @update:modelValue="changeResolution"></v-autocomplete>
      </div>

      <div v-if="videoMode === 'h264'" class="d-flex align-center">
        <v-label class="text-subtitlte-1">{{ $t('tab.video.volume') }}</v-label>
        <v-slider class="flex-grow-1 mx-3" v-model="slider_h264_audio" color="secondary" min="0" max="1" step="0.1"
          show-ticks="always" hide-details @update:modelValue="adjustVolume">
          <template v-slot:append>
            <v-text-field variant="plain" v-model="slider_h264_audio"></v-text-field>
          </template>
        </v-slider>
      </div>

      <div class="d-flex ga-4 align-center flex-row">
        <v-label class="text-subtitlte-1">{{ $t('tab.video.fps') }}</v-label>
        <v-slider class="flex-grow-1 mx-3" v-model="slider_fps" min="1" max="60" color="primary" step="1" hide-details>
          <template v-slot:append>
            <v-text-field variant="plain" v-model="slider_fps"></v-text-field>
          </template>
        </v-slider>
      </div>

      <div v-if="videoMode === 'mjpeg' && hardwareType === 'pi'" class="d-flex align-center">
        <v-label class="text-subtitlte-1">{{ $t('tab.video.quality') }}</v-label>
        <v-slider class="flex-grow-1 mx-3" v-model="slider_mjpeg_quality" min="10" max="100" color="primary" step="10"
          show-ticks="always" hide-details>
          <template v-slot:append>
            <v-text-field variant="plain" v-model="slider_mjpeg_quality"></v-text-field>
          </template>
        </v-slider>
      </div>

      <div v-if="videoMode === 'h264'" class="d-flex align-center">
        <v-label class="text-subtitlte-1">{{ $t('tab.video.Mbps') }}</v-label>
        <v-slider class="flex-grow-1 mx-3" v-model="slider_h264_mbps" min="0.1" max="10" color="primary" step="0.1"
          hide-details>
          <template v-slot:append>
            <v-text-field variant="plain" v-model="slider_h264_mbps" style="width: auto;"></v-text-field>
          </template>
        </v-slider>
      </div>

      <div v-if="videoMode === 'h264'" class="d-flex ga-4 align-center flex-row">
        <v-label class="text-subtitlte-1">{{ $t('tab.video.gop') }}</v-label>
        <v-slider class="flex-grow-1 mx-3" v-model="slider_h264_gop" min="1" max="60" color="primary" step="1"
          hide-details>
          <template v-slot:append>
            <v-text-field variant="plain" v-model="slider_h264_gop"></v-text-field>
          </template>
        </v-slider>
      </div>

      <div class="d-flex ga-4 align-center flex-column flex-wrap flex-xl-nowrap flex-sm-row fill-height">

        <v-label class="text-subtitlte-1">{{ $t('tab.video.reset_take_effect') }}</v-label>
        <v-btn key="primary" color="primary" @click="resetStream">
          {{ $t('tab.video.reset_stream') }}
        </v-btn>

        <v-dialog v-model="resetDialog">
          <v-card>
            <v-card-text>
              {{ resetResultText }} {{ $t('tab.video.refresh') }}
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" block @click="refreshPage">{{ $t('button.close') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>

    </UiParentCard>

  </v-menu>
</template>

<script setup>
import { ref } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import http from '@/utils/http.js';

const store = useAppStore();
const menu = ref(false);
const { videoMode, videoServerPort, resolutionWidth, resolutionHeight, capturedFps, hardwareType } = storeToRefs(store);
const slider_mjpeg_quality = ref(80);
const slider_fps = ref(25);
const slider_h264_mbps = ref(5);
const slider_h264_gop = ref(30);
const slider_h264_audio = ref(0);
const resetDialog = ref(false);
const resetResultText = ref('');
const switchResolutionsValue = ref('640x480');
const switchResolutions = ref(['1920x1080', '1600x1200', '1360x768', '1280x1024', '1280x960', '1280x720', '800x600', '720x480', '640x480']);

let mediaRecorder;
let recordedChunks = [];
let fileHandle;
let writableStream;
let recordFlag = ref(false);

function refreshPage() {
  resetDialog.value = false;
  setTimeout(() => {
    window.location.reload();
  }, 3000); // 3 seconds delay
}

function adjustVolume() {
  const videoElement = document.getElementById('webrtc-output');
  console.log('Volume:', slider_h264_audio.value);
  if (videoElement) {
    videoElement.muted = false;
    videoElement.volume = slider_h264_audio.value;
  }
};

watch(videoMode, (newMode) => {
  localStorage.setItem('videoMode', newMode);
});

async function fetchVideoConfig() {
  try {
    const response = await http.post('/video/config?action=get')
    if (response.status === 200 && response.data.code === 0) {
      const data = response.data.data;
      slider_fps.value = data.fps;
      slider_mjpeg_quality.value = data.quality;
      slider_h264_mbps.value = data.kbps / 1000; // Convert to Mbps
      slider_h264_gop.value = data.gop;
      videoServerPort.value = data.port;
      switchResolutionsValue.value = data.resolution;
      switchResolutions.value = data.support_resolution;
    } else {
      console.log("get video config error");
    }
  }
  catch (error) {
    console.log(error);
  }
}

async function changeResolution() {
  try {

    const response = await http.post(`/video/resolution?resolution=${switchResolutionsValue.value}`);
    if (response.status === 200 && response.data.code === 0) {
      console.log('Resolution changed successfully:', response.data);
    } else {
      console.log('Resolution change failed:', response.data);
    }
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    console.error('Error changing resolution:', error);
  }
}

async function resetStream() {
  try {
    const response = await http.post('/video/config?action=set', {
      data: {
        port: videoServerPort.value,
        fps: slider_fps.value,
        quality: slider_mjpeg_quality.value,
        kbps: slider_h264_mbps.value * 1000, // Convert to kbps
        gop: slider_h264_gop.value
      }
    });
    console.log('Stream reset successful:', response.data);
    const stopResponse = await http.post('/video?action=stop');
    if (stopResponse.data.data.state === "STOPPED") {
      const startResponse = await http.post('/video?action=start');
      if (startResponse.data.data.state === "RUNNING") {
        resetResultText.value = "Stream has been successfully resetted.";
        resetDialog.value = true;
      } else {
        resetResultText.value = startResponse.data.msg;
        resetDialog.value = true;
      }
    } else {
      resetResultText.value = stopResponse.data.msg;
      resetDialog.value = true;
    }
  } catch (error) {
    console.error('Error resetting stream:', error);
  }
}

const fetchSnapshot = async () => {
  try {
    const response = await http.get('/video/screenshot', { responseType: 'blob' });

    if (response.status === 200) {
      const imageUrl = URL.createObjectURL(response.data);
      openImageInNewWindow(imageUrl);
    } else {
      console.error('Failed to fetch snapshot image');
    }
  } catch (error) {
    console.error('Error fetching snapshot image:', error);
  }
};

const openImageInNewWindow = (imageUrl) => {
  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(`<img src="${imageUrl}" alt="Snapshot" style="max-width: 100%; height: auto;" />`);
    newWindow.document.close();
  } else {
    console.error('Failed to open new window');
  }
};

async function startRecording() {
  try {
    const videoId = document.getElementById("webrtc-output");
    console.log("Start recording...");
    recordedChunks = [];
    const stream = videoId.captureStream();
    mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });

    mediaRecorder.onstart = function () {
      recordFlag.value = true;
      console.log("MediaRecorder started");
    };

    mediaRecorder.ondataavailable = async function (event) {
      console.log("Data available event triggered");
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log("Writing data chunk, size:", event.data.size);
        await writableStream.write(event.data);
        console.log("Data chunk written.");
      } else {
        console.log("Data chunk empty");
      }
    };

    mediaRecorder.onstop = async function () {
      console.log("Stopping media recorder...");
      await writableStream.close();
      console.log("Writable stream closed.");
      recordFlag.value = false;
    };

    mediaRecorder.onerror = function (event) {
      console.error("MediaRecorder error:", event.error);
    };

    // Request file access
    console.log("Requesting file handle...");
    fileHandle = await window.showSaveFilePicker({
      suggestedName: 'recording.webm',
      types: [
        {
          description: 'WebM Video',
          accept: { 'video/webm': ['.webm'] }
        },
      ],
    });

    console.log("Creating writable stream...");
    writableStream = await fileHandle.createWritable();
    mediaRecorder.start(1000); // 每秒生成一个数据块
    console.log("Media recorder started.");
  } catch (error) {
    console.error("Error starting recording:", error);
  }
}

async function stopRecording() {
  try {
    console.log("Stop recording...");
    mediaRecorder.stop();
    console.log("Media recorder stopped.");
  } catch (error) {
    console.error("Error stopping recording:", error);
  }
}

onMounted(() => {
  const savedVideoMode = localStorage.getItem('videoMode');
  if (savedVideoMode) {
    videoMode.value = savedVideoMode;
  }
  fetchVideoConfig();
});

</script>

<style scoped>
.align-center {
  display: flex;
  align-items: center;
}
</style>
