<template>
  <div class="container">
    <!-- Controls -->
    <div class="controls">
      <button @click="startStreams">Start All PiP Streams</button>
      <button @click="stopStreams" :disabled="!isStreaming">Stop All Streams</button>
    </div>

    <!-- Main video -->
    <video
      ref="mainVideo"
      src="https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4"
      class="main-video"
      width="400px"
      height="400px"
      autoplay
      playsinline
      loop
    ></video>

    <!-- PiP Videos Container -->
    <div class="pip-videos">
      <!-- Display PiP Video Containers -->
      <div v-for="(pipVideo, index) in pipStreams" :key="index" class="pip-video-wrapper">
        <video
          ref="pipVideos"
          :src="pipVideo"
          class="pip-video"
          autoplay
          muted
          playsinline
          loop
          @click="swapMainAndPipVideo(index)"
        ></video>
        <!--
        <img :src="pipVideo" @click="swapMainAndPipVideo(index)" />
-->
        <button @click="enablePiP(index)" :disabled="!isPiPSupported">
          PIP Channel {{ index + 1 }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';

  // URLs for PiP streams (your provided URLs)
  const pipUrls = [
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    'https://192.168.1.238/video/stream',
    'https://www.html5rocks.com/en/tutorials/video/basics/devstories.webm',
    'https://192.168.1.217/video/stream',
    'https://media.w3.org/2010/05/bunny/trailer.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://media.w3.org/2010/05/sintel/trailer.mp4',
  ];

  // Reactive variables
  const mainVideo = ref(null); // Main video reference
  const pipStreams = ref([]); // Array to hold PiP streams (URLs)
  const isPiPSupported = ref(false); // Check if PiP is supported
  const isStreaming = ref(false); // Check if streaming is active

  // On mounted, check if Picture-in-Picture is supported
  onMounted(() => {
    isPiPSupported.value = 'pictureInPictureEnabled' in document;
  });

  // Start WebRTC streams (Main and PiP streams from URLs)
  const startStreams = async () => {
    try {
      // Start the main stream (front camera or video URL)
      const mainStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      // Assign the main stream to the main video element
      if (mainVideo.value) {
        //    mainVideo.value.srcObject = mainStream;
      }

      // Save PiP stream URLs to the pipStreams array
      pipStreams.value = pipUrls;

      // Enable PiP for each video
      isStreaming.value = true;
    } catch (error) {
      console.error('Error starting streams:', error);
      alert('Please ensure you have granted camera permissions for this app to work.');
    }
  };

  // Swap the main video stream with the respective PiP video stream
  const swapMainAndPipVideo = (index) => {
    const pipVideoUrl = pipStreams.value[index];
    console.log(pipVideoUrl);
    const currentMainVideoSrc = mainVideo.value.src;
    console.log(currentMainVideoSrc);
    // Swap the main video with the selected PiP video
    if (mainVideo.value) {
      mainVideo.value.src = pipVideoUrl;
    }

    // Swap the clicked PiP video with the current main video
    pipStreams.value[index] = currentMainVideoSrc;
  };

  // Enable Picture-in-Picture for each PiP video stream
  const enablePiP = async (index) => {
    const pipVideoElement = document.querySelectorAll('.pip-video')[index];
    if (pipVideoElement && isPiPSupported.value) {
      try {
        await pipVideoElement.play(); // Start playback programmatically
        await pipVideoElement.requestPictureInPicture();
      } catch (error) {
        console.error(`Error enabling PiP for stream ${index + 1}:`, error);
      }
    }
  };

  // Stop all streams (main and PiP streams)
  const stopStreams = () => {
    // Stop main stream
    if (mainVideo.value && mainVideo.value.srcObject) {
      mainVideo.value.srcObject.getTracks().forEach((track) => track.stop());
    }

    // Clear PiP stream URLs
    pipStreams.value = [];
    isStreaming.value = false;
  };
</script>

<style scoped>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .main-video {
    width: 100%;
    max-width: 800px;
    background-color: black;
    border: 1px solid #ccc;
  }

  .controls {
    margin-top: 10px;
  }

  button {
    margin: 10px;
    padding: 8px 12px;
    font-size: 16px;
    cursor: pointer;
  }

  .pip-videos {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 20px;
  }

  .pip-video-wrapper {
    position: relative;
    margin: 5px;
    width: 150px;
    height: 150px;
  }

  .pip-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
