import { ref, onUnmounted } from 'vue';
import Config from '@/config.js';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const { isCameraOn, isShowingPiP } = storeToRefs(store);

export function useCamera(device) {
  const error = ref(null);
  const devices = ref([]);
  const currentDeviceId = ref(null);

  const isPiPSupported = 'pictureInPictureEnabled' in document;

  const getVideoDevices = async () => {
    // Request permission first
    await navigator.mediaDevices.getUserMedia({ video: true });

    const allDevices = await navigator.mediaDevices.enumerateDevices();
    devices.value = allDevices.filter((d) => d.kind === 'videoinput');

    if (!devices.value.find((d) => d.deviceId === currentDeviceId.value)) {
      currentDeviceId.value = devices.value[0]?.deviceId || null;
    }
  };

  const startCamera = async () => {
    try {
      await getVideoDevices();
      const constraints = {
        video: { deviceId: { exact: currentDeviceId.value } },
      };

      const videoStream = await navigator.mediaDevices.getUserMedia(constraints);

      device.value.video.videoStream = videoStream;
      isCameraOn.value = true;
      error.value = null;
      console.log('Camera is on (via composable).');
    } catch (error) {
      console.error('Error accessing camera:', error);
      isCameraOn.value = false;
      device.value.video.videoStream = null;
      error.value = error;
    }
  };

  const stopCamera = async (videoElement) => {
    if (device.value.video.videoStream) {
      // Stop all video tracks
      device.value.video.videoStream.getVideoTracks().forEach((track) => track.stop());

      // Clear video element
      if (videoElement && videoElement.srcObject === device.value.video.videoStream) {
        videoElement.srcObject = null;
        videoElement.load(); // Force refresh the video element
      }

      // Clear state
      device.value.video.videoStream = null;
      isCameraOn.value = false;
      console.log('Camera is off (via composable).');

      // If PiP is active, exit it
      if (document.pictureInPictureElement) {
        try {
          await document.exitPictureInPicture();
          console.log('Exited PiP as part of camera turnOff()');
        } catch (error) {
          console.error('Failed to exit PiP:', error);
        }
      }
    }
    logActiveMediaTracks();
  };

  //
  function logActiveMediaTracks() {
    const videos = document.querySelectorAll('video');
    console.log(`Found ${videos.length} video element(s)`);

    videos.forEach((video, index) => {
      const stream = video.srcObject;
      if (stream) {
        console.log(
          `Video element [${index}] has stream with ${stream.getVideoTracks().length} video track(s)`
        );
        stream.getVideoTracks().forEach((track, tIndex) => {
          console.log(
            ` - Track[${tIndex}]: label="${track.label}", readyState="${track.readyState}"`
          );
        });
      } else {
        console.log(`Video element [${index}] has no stream`);
      }
    });

    // Also log global mediaDevices active streams if you store them
    console.log('Check device.value.video.videoStream:');
    console.log(device.value.video.videoStream);
    if (device.value.video.videoStream) {
      device.value.video.videoStream.getVideoTracks().forEach((track, tIndex) => {
        console.log(
          ` - device stream Track[${tIndex}]: label="${track.label}", readyState="${track.readyState}"`
        );
      });
    }
  }

  // Enter PiP mode for camera feed
  const enterPiP = async (element) => {
    if (element) {
      if (element.readyState < 1) {
        console.log('Waiting for video metadata to load...');
        await new Promise((resolve) => {
          element.addEventListener('loadedmetadata', resolve, { once: true });
        });
      }

      try {
        await element.requestPictureInPicture();
        isShowingPiP.value = true;
        console.log('Camera feed in PiP');
      } catch (error) {
        console.error('Failed to enter PiP:', error);
      }
    }
  };

  // Exit Picture-in-Picture
  const exitPiP = async (document) => {
    if (!document.pictureInPictureElement) {
      console.log('No element is in Picture-in-Picture mode');
      return;
    }

    try {
      await document.exitPictureInPicture();
      isShowingPiP.value = false;
      console.log('Exited Picture-in-Picture mode');
    } catch (error) {
      console.error('Failed to exit PiP:', error);
    }
  };

  // TODO
  const switchCamera = async () => {
    if (devices.value.length < 2) {
      console.warn('No alternative camera to switch.');
      return;
    }

    const currentIndex = devices.value.findIndex((d) => d.deviceId === currentDeviceId.value);
    const nextIndex = (currentIndex + 1) % devices.value.length;
    currentDeviceId.value = devices.value[nextIndex].deviceId;

    console.log('Switching camera to', currentDeviceId.value);
    await stopCamera();
    await turnOn();
  };

  // onUnmounted(stopCamera);

  return {
    error,
    isPiPSupported,
    devices,
    currentDeviceId,
    startCamera,
    stopCamera,
    enterPiP,
    exitPiP,
    switchCamera,
  };
}
