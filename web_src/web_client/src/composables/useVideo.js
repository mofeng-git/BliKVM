'use strict';

import Config from '@/config.js';
import { Janus } from '@/utils/janus.js';
import adapter from 'webrtc-adapter';
import { useDevice } from '@/composables/useDevice';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const { device } = useDevice();
const { audio } = storeToRefs(store);


// 单例实例
let videoSingleton = null;

export function useVideo() {
  if (videoSingleton) {
    return videoSingleton;
  }

  const __janus = ref(null);
  const wsProtocol = Config.http_protocol === 'https:' ? 'wss' : 'ws';
  const token = localStorage.getItem('token');
  const urlJanus = `${wsProtocol}://${Config.host_ip}${Config.host_port}/janus?token=${token}`;
  let __handle = null;
  let infoInterval = null;
  let frames = 0;
  let __orient = 0;
  let __allow_audio = true;
  let __allow_mic = false;
  let __ice = null;

  const initMjpeg = () => {
    device.value.mjpegUrl = `${Config.http_protocol}//${Config.host_ip}${Config.host_port}/video/stream`;
  };

  const initVideo = () => {
    const desp = { adapter };
    Janus.init({
      debug: false,
      dependencies: Janus.useDefaultDependencies(desp),
    });
    __janus.value = new Janus({
      server: urlJanus,
      destroyOnUnload: false,
      success: __attachJanus,
      error: console.error,
    });
  };

  const __sendStart = (jsep) => {
    if (__handle) {
      console.log("Sending START ...");
      __handle.send({ "message": { "request": "start" }, "jsep": jsep });
    }
  };

  const destroyJanusConnection = () => {
    __destroyJanus();
  };

  const __destroyJanus = () => {
    if (__janus.value !== null) {
      __janus.value.destroy();
    }
    __stopInfoInterval();
    if (__handle) {
      console.log("uStreamer detaching ...:", __handle.getPlugin(), __handle.getId());
      __handle.detach();
      __handle = null;
    }
    __janus.value = null;

    const videoEl = document.getElementById('webrtc-output');
    if (videoEl && videoEl.srcObject) {
      for (let track of videoEl.srcObject.getTracks()) {
        __removeTrack(track);
      }
    }
  };

  const __sendWatch = () => {
    if (__handle) {
      console.log(`Sending WATCH(orient=${__orient}, audio=${__allow_audio}, mic=${audio.value.isMicrophoneOn}) ...`);
      __handle.send({
        "message": {
          "request": "watch", "params": {
            "orientation": __orient,
            "audio": __allow_audio,
            "mic": audio.value.isMicrophoneOn,
          }
        }
      });
    }
  };


  const resetJanus = () => {
    __destroyJanus();
    initVideo();
  };

  const __removeTrack = (track) => {
    let el = document.getElementById('webrtc-output');
    if (!el.srcObject) {
      return;
    }
    track.stop();
    el.srcObject.removeTrack(track);
    if (el.srcObject.getTracks().length === 0) {
      // MediaStream should be destroyed to prevent old picture freezing
      // on Janus reconnecting.
      el.srcObject = null;
    }
  }

  const __addTrack = (track) => {
    let el = document.getElementById('webrtc-output');
    if (el.srcObject) {
      for (let tr of el.srcObject.getTracks()) {
        if (tr.kind === track.kind && tr.id !== track.id) {
          removeTrack(tr);
        }
      }
    }
    if (!el.srcObject) {
      el.srcObject = new MediaStream();
    }
    el.srcObject.addTrack(track);
  };

  const __attachJanus = () => {
    if (__janus.value === null) {
      return;
    }
    console.log('attach ustreamer plugin');
    __janus.value.attach({
      plugin: 'janus.plugin.ustreamer',
      opaqueId: "oid-" + Janus.randomString(12),

      success: (handle) => {
        __handle = handle;
        console.log("uStreamer attached:", handle.getPlugin(), handle.getId());
        console.log("Sending FEATURES ...");
        __handle.send({ "message": { "request": "features" } });
      },

      error: (error) => {
        console.error('Can\'t attach uStreamer:', error);
        __destroyJanus();
      },

      connectionState: (state) => {
        console.log("Peer connection state changed to", state);
        if (state === "failed") {
          __destroyJanus();
        }
      },

      iceState: (state) => {
        console.log("ICE state changed to", state);
      },

      webrtcState: function (up) {
        console.log("Janus says our WebRTC PeerConnection is", (up ? "up" : "down"), "now");
      },

      onmessage: (msg, jsep) => {

        if (msg.result) {
          console.log("Got uStreamer result message:", msg.result); // starting, started, stopped
          if (msg.result.status === "started") {

          } else if (msg.result.status === "stopped") {

          } else if (msg.result.status === "features") {
            console.log("audio:", msg.result.features.audio, "mic:", msg.result.features.mic);
            __ice = msg.result.features.ice;
            __sendWatch();
          }
        } else if (msg.error_code || msg.error) {
          console.error("Got uStreamer error message:", msg.error_code, "-", msg.error);
          return;
        } else {
          console.log("Got uStreamer other message:", msg);
        }

        if (jsep) {
          console.log("Handling SDP:", jsep);
          let tracks = [{ "type": "video", "capture": false, "recv": true, "add": true }];
          if (__allow_audio) {
            tracks.push({ "type": "audio", "capture": audio.value.isMicrophoneOn, "recv": true, "add": true });
          }
          console.log("Creating answer with tracks:", tracks);
          __handle.createAnswer({
            jsep: jsep,

            tracks: tracks,



            // Chrome is playing OPUS as mono without this hack
            //   - https://issues.webrtc.org/issues/41481053 - IT'S NOT FIXED!
            //   - https://github.com/ossrs/srs/pull/2683/files
            customizeSdp: (jsep) => {
              jsep.sdp = jsep.sdp.replace("useinbandfec=1", "useinbandfec=1;stereo=1");
            },


            success: (jsep) => {
              console.log('Got SDP:', jsep);
              __sendStart(jsep);
            },


            error: (error) => {
              console.error("Error on SDP handling:", error);
            }
          });
        }
      },
      onremotetrack: (track, id, added, meta) => {
				// Chrome sends `muted` notifiation for tracks in `disconnected` ICE state
				// and Janus.js just removes muted track from list of available tracks.
				// But track still exists actually so it's safe to just ignore
				// reason === "mute" and "unmute".
        let reason = (meta || {}).reason;
        console.log('Got onRemoteTrack:', id, added, reason, track, meta);
        if (added && reason === "created") {
					__addTrack(track);
					if (track.kind === "video") {
						__startInfoInterval();
					}
				} else if (!added && reason === "ended") {
					__removeTrack(track);
				}
      },


      oncleanup: () => {
				console.log("Got a cleanup notification");
				__stopInfoInterval();
			},
    });
  };

  const clearImageSource = () => {
    console.log('Clearing MJPEG image source');
    device.value.mjpegUrl = '';
    const videoEl = document.getElementById('mjpeg-output');
    if (videoEl && videoEl.src) {
      videoEl.src = '';
    }
  };



  const adjustVolume = (value) => {
    const videoElement = document.getElementById('webrtc-output');
    if (videoElement) {
      videoElement.muted = false;
      const volume = Number(value);
      if (!isNaN(volume) && isFinite(volume)) {
        videoElement.volume = Math.min(Math.max(volume, 0), 1);
      } else {
        console.warn('Invalid volume value:', value);
      }
    }
  };

  const onVideoLoaded = () => {
    console.log('onVideoLoaded');
  };

  const __startInfoInterval = () => {
    __stopInfoInterval();
    updateInfo();
    infoInterval = setInterval(updateInfo, 1000);
  };

  const __stopInfoInterval = () => {
    if (infoInterval !== null) {
      clearInterval(infoInterval);
    }
    infoInterval = null;
  };

  const updateInfo = () => {
    if (__handle !== null) {
      let info = '';
      const el = document.getElementById('webrtc-output');
      let currentFrames = null;
      if (el && el.webkitDecodedFrameCount !== undefined) {
        currentFrames = el.webkitDecodedFrameCount;
      } else if (el && el.mozPaintedFrames !== undefined) {
        currentFrames = el.mozPaintedFrames;
      }
      
      let bitrateKbps = null;
      if (typeof __handle.getBitrate === 'function') {
        const br = `${__handle.getBitrate()}`; // e.g. "1234 kbits/sec"
        const m = br.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (m) {
          bitrateKbps = Number(m[1]);
        }
      }
      if (bitrateKbps !== null && !Number.isNaN(bitrateKbps)) {
        try {
          device.value.video.bitrate = Math.round(bitrateKbps);
        } catch (e) {
          // ignore assignment error, but keep UI info string updated
        }
      }
      if (currentFrames !== null) {
        const fpsDynamic = Math.max(0, currentFrames - frames);
        try {
          device.value.video.fps = fpsDynamic;
        } catch (e) {
          // ignore assignment error
        }
        frames = currentFrames;
      }
      // to do, how to show this info @ronan
      // console.log(info);
    }
  };

  async function captureAndDownloadImage(filename = 'screenshot.png') {
    const element = document.getElementById('webrtc-output');
    if (!element) {
      console.error('Element is null');
      return;
    }
    const canvas = document.createElement('canvas');
    let width, height;
    if (element instanceof HTMLVideoElement) {
      width = element.videoWidth;
      height = element.videoHeight;
    } else if (element instanceof HTMLImageElement) {
      if (!element.complete) {
        console.error('Image not fully loaded');
        return;
      }
      element.crossOrigin = 'anonymous';
      console.log('captureAndDownloadImage', element.naturalWidth, element.naturalHeight);
      width = element.naturalWidth;
      height = element.naturalHeight;
    } else {
      console.error('Unsupported element type:', element);
      return;
    }
    if (width === 0 || height === 0) {
      console.error('Element has no dimensions');
      return;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(element, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  videoSingleton = {
    initMjpeg,
    initVideo,
    destroyJanusConnection,
    clearImageSource,
    adjustVolume,
    onVideoLoaded,
    captureAndDownloadImage,
    resetJanus,
  };

  return videoSingleton;
}
