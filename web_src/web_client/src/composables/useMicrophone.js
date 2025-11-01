// composables/useMicrophone.js
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { useVideo } from '@/composables/useVideo.js';

const store = useAppStore();
const { audio } = storeToRefs(store);
const { resetJanus } = useVideo();

export function useMicrophone(device) {
  //  const audioStream = ref(null);
  const error = ref(null);

  const turnOn = async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      device.value.video.audioStream = micStream;
      audio.value.isMicrophoneOn = true;
      const [track] = micStream.getAudioTracks();
      audio.value.microphoneName = track?.label || '';
      error.value = null;
      console.log('Microphone is on (via composable). micName:', audio.value.microphoneName);
      resetJanus();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      audio.value.isMicrophoneOn = false;
      audio.value.microphoneName = '';
      device.value.video.audioStream = null;
      error.value = err;
    }
  };

  const turnOff = () => {
    if (device.value.video.audioStream) {
      device.value.video.audioStream.getTracks().forEach((track) => track.stop());
      device.value.video.audioStream = null;
      audio.value.isMicrophoneOn = false;
      console.log('Microphone is off (via composable).');
      resetJanus();
    }
  };

  // Automatically turn off the microphone when the component using this composable is unmounted
  onUnmounted(turnOff);

  return {
    // audioStream,
    error,
    turnOnMic: turnOn,
    turnOffMic: turnOff,
  };
}
