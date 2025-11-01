<!--
TODO is this still used?
-->

<template>
  <span class="ms-1">
    <template v-if="$vuetify.display.smAndUp">
      <v-divider
        class="mx-0 align-self-center"
        :length="length"
        :thickness="thickness"
        vertical
      ></v-divider>
    </template>

    <!--
    {{ $t("diagnostics.noSignal") }}
     -->
  </span>

  <v-icon
    class="ms-2"
    v-for="iconData in iconDataList"
    :key="iconData.icon"
    :color="iconData.color"
    :title="iconData.title"
    @click="iconData.onClick"
  >
    {{ iconData.icon }}
  </v-icon>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';
  import { useI18n } from 'vue-i18n';
  import { useTemperature } from '@/composables/useTemperature.js';
  // TODO don't know why the toggleFullScreen doesn't work, other translations are OK

  const { t } = useI18n();

  const store = useAppStore();
  const { device, keyboard, video, mouse } = storeToRefs(store);

  const { temperatureConverted } = useTemperature();

  const iconDataList = ref([]);

  const generateIconDataList = () => {
    return [
      /*
    {
      // TODO here we can use the pong result??
      icon: device.value.isConnected
        ? "mdi-lan-disconnect"
        : "mdi-lan-connect",
      color: device.value.isConnected ? "error" : "success",
      title: `LAN ${
        device.value.isConnected ? "disconnected" : "connected"
      }`,
    },
    // Conditionally add the audio entry
    ...(video.value.videoMode === "webrtc"
      ? [
          {
            icon: video.audioMuted ? "mdi-volume-mute" : "mdi-volume-source",
            color: "success",
            title: `Audio ${
              video.audioMuted ? "muted" : `volume ${video.audioVolume}`
            }`,
          },
        ]
      : []),
*/
      {
        icon: device.hasUndervoltage ? 'mdi-flash-alert' : 'mdi-flash',
        color: !device.isConnected && device.hasUndervoltage ? 'error' : 'success',
        title: device.hasUndervoltage ? 'Low voltage' : 'No under voltage',
      },
      {
        icon:
          device.temperature < device.temperatureThreshold
            ? 'mdi-thermometer-chevron-down'
            : 'mdi-thermometer-chevron-up',
        color:
          !device.isConnected && device.temperature < device.temperatureThreshold
            ? 'success'
            : 'error',
        title: temperatureConverted,
      },
      {
        icon: 'mdi-server',
        color: !device.isConnectedvalue && device.isHDDActive ? 'success' : 'error',
        title: `Storage ${device.isHDDActive ? 'active' : 'inactive'}`,
      },
      {
        icon: device.isPowerLedActive ? 'mdi-led-variant-on' : 'mdi-led-variant-off',
        color: !device.isConnected && device.isPowerLedActive ? 'success' : 'error',
        title: `Power LED ${device.isPowerLedActive ? 'active' : 'inactive'}`,
      },
      {
        icon: 'fa fa-pencil-square',
        color: !device.isConnected && device.isFSReadOnly ? 'success' : 'error',
        title: device.isFSReadOnly ? 'Readonly' : 'Read/Writable',
      },
    ];
  };

  const thickness = ref(1);
  const length = ref(12);

  // Watch all relevant properties and update the iconDataList when any of them change
  watch(
    [device, keyboard, video, mouse],
    () => {
      iconDataList.value = generateIconDataList();
    },
    { deep: true }
  );

  // Initialize iconDataList
  iconDataList.value = generateIconDataList();
</script>
