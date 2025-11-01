<template>
  <v-speed-dial location="left center" open-on-hover transition="tab-transition">
    <template v-slot:activator="{ props: activatorProps }">
      <v-tooltip content-class="" location="bottom">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-fab
            v-bind="mergeProps(activatorProps, tooltipProps)"
            size="small"
            icon="mdi-rotate-360"
            color="green"
            selected-class="bg-primary"
          />
        </template>
        <span>{{ $t('video.orientation') }}</span>
      </v-tooltip>
    </template>

    <div style="margin-left: 40px">
      <v-btn
        v-for="target in iconDataList"
        :key="target.icon"
        :text="target.text"
        :color="target.orientation === device.video.currentOrientation ? 'primary' : target.color"
        size="x-small"
        style="margin-left: 5px"
        @click="setOrientation(target.orientation)"
      >
      </v-btn>
    </div>
  </v-speed-dial>
</template>

<script setup>
  import { ref } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useRotate } from '/src/composables/useOrientation.js';
  import { mergeProps } from 'vue';

  const route = useRoute();
  const store = useAppStore();
  const { iconDataList, rotate } = useRotate();

  const device = computed(() => {
    const deviceId = parseInt(route.params.id); // Get the id from the route params
    console.log(deviceId);
    const foundDevice = store.devices.find((d) => d.deviceId === deviceId); // Find the device by id

    return foundDevice; // Return the found device or undefined if not found
  });

  const { streamElementRef, video } = storeToRefs(store);

  // Function to handle orientation
  const setOrientation = (orientation) => {
    const streamElement = streamElementRef.value;
    if (streamElement) {
      rotate(streamElement, orientation); // Apply rotation
      device.value.video.currentOrientation = orientation; // Update the current orientation
    }
  };
</script>
