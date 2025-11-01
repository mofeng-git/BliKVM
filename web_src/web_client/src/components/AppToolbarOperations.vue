<template>
  <!--  <template v-if="$vuetify.display.smAndUp">
    <v-divider
      class="mx-3 align-self-center"
      :length="24"
      :thickness="2"
      vertical
    ></v-divider>
  </template>

  {{ device.deviceVersion }}


  <template v-if="$vuetify.display.smAndUp">
    <v-divider
      class="mx-0 align-self-center"
      :length="length"
      :thickness="thickness"
      vertical
    ></v-divider>
  </template>
  {{ video.videoMode }}

  <template v-if="$vuetify.display.smAndUp">
    <v-divider
      class="mx-0 align-self-center"
      :length="length"
      :thickness="thickness"
      vertical
    ></v-divider>
  </template>
  {{ video.resolutionWidth }}x{{ video.resolutionHeight }}@{{
    video.capturedFps
  }}fps
  <template v-if="$vuetify.display.smAndUp">
    <v-divider
      class="mx-0 align-self-center"
      :length="length"
      :thickness="thickness"
      vertical
    ></v-divider>
  </template>
  {{ device.networkLatency }}ms
  
  <template v-if="$vuetify.display.smAndUp">
    <v-divider
      class="mx-0 align-self-center"
      :length="length"
      :thickness="thickness"
      vertical
    ></v-divider>
  </template>
  {{ device.uptime }}
      -->
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const store = useAppStore();

  const { video, device } = storeToRefs(store);

  const thickness = ref(1);
  const length = ref(12);
</script>
