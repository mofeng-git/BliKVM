'use strict';

import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert';
import { useDiagnostics } from '@/composables/useDiagnostics';

const { startDiagnosticsConnecting } = useDiagnostics();

export function useVideoResolution(device) {
  const { sendAlert } = useAlert();

  // Track last-applied values from backend to avoid comparing against v-model (already updated)
  const lastApplied = {
    fps: undefined, // integer FPS
    quality: undefined, // integer 10-100
    mbps10: undefined, // bitrate in Mbps * 10 as integer for stable compare
    gop: undefined, // integer 1-60
  };

  const getVideoConfig = async () => {
    try {
      const response = await http.post('/video/config?action=get');
      if (response.status === 200 && response.data.code === 0) {
        const data = response.data.data;
        device.value.video.desiredFps = data.fps;
        device.value.video.mjpegQuality = data.quality;
        device.value.video.WebRTCMbps = data.kbps / 1000; // Convert to Mbps
        device.value.video.WebRTCGop = data.gop;
        device.value.video.videoPort = data.port;

        // Initialize last-applied values from backend config
        lastApplied.fps = Number(data.fps);
        lastApplied.quality = Number(data.quality);
        lastApplied.mbps10 = Math.round((Number(data.kbps) / 1000) * 10);
        lastApplied.gop = Number(data.gop);
      } else {
        console.log('get video config error');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const setResolution = async (resolution) => {
    try {
      const response = await http.post(`/video/resolution?resolution=${resolution}`);
      if (response.status === 200 && response.data.code === 0) {
        console.log('Resolution changed successfully:', response.data);
      } else {
        const title = 'Video';
        const message = `change resolution error: ${response.data.msg}`;
        sendAlert('error', title, message);
      }
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      const title = 'Video Resolution';
      const message = error.message || 'Error changing resolution';
      sendAlert('error', title, message);
    }
  };

  async function toggleVideo(newValue) {
    try {
      device.value.video.isRequesting = true;
      const actionValue = newValue ? 'start' : 'stop';
      if (newValue === true) {
        startDiagnosticsConnecting();
      }
      const stopResponse = await http.post(`/video?action=${actionValue}`);
      device.value.video.isRequesting = false;
      if (stopResponse.status === 200) {
        console.log('Stream toggled successfully');
      } else {
        const title = 'Video';
        const message = `Stream toggled failed ${stopResponse.data.msg}`;
        sendAlert('error', title, message);
      }
    } catch (error) {
      device.value.video.isRequesting = false;
      const title = 'Video';
      const message = `Error resetting stream: ${error}`;
      sendAlert('error', title, message);
    }
  }

  async function setStreamFPS(newValue) {
    try {
      // Guard: compare against last-applied (not v-model which is already updated)
      const next = Number(newValue);
      if (Number.isFinite(lastApplied.fps) && Number.isFinite(next) && lastApplied.fps === next) {
        return;
      }

      device.value.video.isRequesting = true;
      const response = await http.post('/video/config?action=set', {
        data: {
          port: device.value.video.videoPort,
          fps: newValue,
          quality: device.value.video.mjpegQuality,
          kbps: device.value.video.WebRTCMbps * 1000, // Convert to kbps
          gop: device.value.video.WebRTCGop,
        },
      });
      // Update last-applied immediately after a successful POST
      if (response?.status === 200) {
        lastApplied.fps = next;
      }
      if (device.value.video.isActive === true) {
        const stopResponse = await http.post('/video?action=stop');
        if (stopResponse.data.data.state === 'STOPPED') {
          const startResponse = await http.post('/video?action=start');
          device.value.video.isRequesting = false;
          if (startResponse.data.data.state === 'RUNNING') {
            const title = 'Video';
            const message = `Stream FPS set successfully.`;
            sendAlert('success', title, message);
          } else {
            const title = 'Video';
            const message = `${startResponse.data.msg}`;
            sendAlert('error', title, message);
          }
        } else {
          device.value.video.isRequesting = false;
          const title = 'Video';
          const message = `${stopResponse.data.msg}`;
          sendAlert('error', title, message);
        }
      } else {
        // Stream not active: still reset requesting flag and notify success
        device.value.video.isRequesting = false;
        const title = 'Video';
        const message = `Stream FPS set successfully.`;
        sendAlert('success', title, message);
      }
    } catch (error) {
      device.value.video.isRequesting = false;
      const title = 'Video';
      const message = `Error setting FPS: ${error}`;
      sendAlert('error', title, message);
    }
  }

  async function setStreamBitrate(newValue) {
    try {
      // Guard: compare against last-applied Mbps*10 integer
      const next = Number(newValue);
      const next10 = Math.round(next * 10); // step 0.1
      if (
        Number.isFinite(lastApplied.mbps10) &&
        Number.isFinite(next10) &&
        lastApplied.mbps10 === next10
      ) {
        return;
      }

      device.value.video.isRequesting = true;
      const response = await http.post('/video/config?action=set', {
        data: {
          port: device.value.video.videoPort,
          fps: device.value.video.desiredFps,
          quality: device.value.video.mjpegQuality,
          kbps: newValue * 1000, // Convert to kbps
          gop: device.value.video.WebRTCGop,
        },
      });
      if (response?.status === 200) {
        lastApplied.mbps10 = next10;
      }
      if (device.value.video.isActive === true) {
        const stopResponse = await http.post('/video?action=stop');
        if (stopResponse.data.data.state === 'STOPPED') {
          const startResponse = await http.post('/video?action=start');
          device.value.video.isRequesting = false;
          if (startResponse.data.data.state === 'RUNNING') {
            const title = 'Video';
            const message = `Stream bitrate set successfully.`;
            sendAlert('success', title, message);
          } else {
            const title = 'Video';
            const message = `${startResponse.data.msg}`;
            sendAlert('error', title, message);
          }
        } else {
          device.value.video.isRequesting = false;
          const title = 'Video';
          const message = `${stopResponse.data.msg}`;
          sendAlert('error', title, message);
        }
      } else {
        device.value.video.isRequesting = false;
        const title = 'Video';
        const message = `Stream bitrate set successfully.`;
        sendAlert('success', title, message);
      }
    } catch (error) {
      device.value.video.isRequesting = false;
      const title = 'Video';
      const message = `Error setting bitrate: ${error}`;
      sendAlert('error', title, message);
    }
  }

  async function setStreamGOP(newValue) {
    try {
      // Guard: compare against last-applied GOP
      const next = Number(newValue);
      if (Number.isFinite(lastApplied.gop) && Number.isFinite(next) && lastApplied.gop === next) {
        return;
      }

      device.value.video.isRequesting = true;
      const response = await http.post('/video/config?action=set', {
        data: {
          port: device.value.video.videoPort,
          fps: device.value.video.desiredFps,
          quality: device.value.video.mjpegQuality,
          kbps: device.value.video.WebRTCMbps * 1000, // Convert to kbps
          gop: newValue,
        },
      });
      if (response?.status === 200) {
        lastApplied.gop = next;
      }
      if (device.value.video.isActive === true) {
        const stopResponse = await http.post('/video?action=stop');
        if (stopResponse.data.data.state === 'STOPPED') {
          const startResponse = await http.post('/video?action=start');
          device.value.video.isRequesting = false;
          if (startResponse.data.data.state === 'RUNNING') {
            const title = 'Video';
            const message = `Stream GOP set successfully.`;
            sendAlert('success', title, message);
          } else {
            const title = 'Video';
            const message = `${startResponse.data.msg}`;
            sendAlert('error', title, message);
          }
        } else {
          device.value.video.isRequesting = false;
          const title = 'Video';
          const message = `${stopResponse.data.msg}`;
          sendAlert('error', title, message);
        }
      } else {
        device.value.video.isRequesting = false;
        const title = 'Video';
        const message = `Stream GOP set successfully.`;
        sendAlert('success', title, message);
      }
    } catch (error) {
      device.value.video.isRequesting = false;
      const title = 'Video';
      const message = `Error setting GOP: ${error}`;
      sendAlert('error', title, message);
    }
  }

  async function setStreamQuality(newValue) {
    try {
      // Guard: compare against last-applied quality
      const next = Number(newValue);
      if (
        Number.isFinite(lastApplied.quality) &&
        Number.isFinite(next) &&
        lastApplied.quality === next
      ) {
        return;
      }

      device.value.video.isRequesting = true;
      const response = await http.post('/video/config?action=set', {
        data: {
          port: device.value.video.videoPort,
          fps: device.value.video.desiredFps,
          quality: newValue,
          kbps: device.value.video.WebRTCMbps * 1000, // Convert to kbps
          gop: device.value.video.WebRTCGop,
        },
      });
      if (response?.status === 200) {
        lastApplied.quality = next;
      }
      if (device.value.video.isActive === true) {
        const stopResponse = await http.post('/video?action=stop');
        if (stopResponse.data.data.state === 'STOPPED') {
          const startResponse = await http.post('/video?action=start');
          device.value.video.isRequesting = false;
          if (startResponse.data.data.state === 'RUNNING') {
            const title = 'Video';
            const message = `Stream mjpeg quality set successfully.`;
            sendAlert('success', title, message);
          } else {
            const title = 'Video';
            const message = `${startResponse.data.msg}`;
            sendAlert('error', title, message);
          }
        } else {
          device.value.video.isRequesting = false;
          const title = 'Video';
          const message = `${stopResponse.data.msg}`;
          sendAlert('error', title, message);
        }
      } else {
        device.value.video.isRequesting = false;
        const title = 'Video';
        const message = `Stream mjpeg quality set successfully.`;
        sendAlert('success', title, message);
      }
    } catch (error) {
      device.value.video.isRequesting = false;
      const title = 'Video';
      const message = `Error setting quality: ${error}`;
      sendAlert('error', title, message);
    }
  }

  return {
    getVideoConfig,
    setResolution,
    toggleVideo,
    setStreamFPS,
    setStreamBitrate,
    setStreamGOP,
    setStreamQuality,
  };
}
