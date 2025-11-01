<template>
  <v-tooltip location="top" content-class="">
    <template v-slot:activator="{ props: tooltipProps }">
      <v-icon v-bind="tooltipProps" :size="size" icon="mdi-clipboard-multiple-outline" />
    </template>
    <span>Clipboard</span>
  </v-tooltip>
</template>

<script setup>
  import { ref, inject, onMounted, onUnmounted } from 'vue';

  // Props
  const props = defineProps({
    size: {
      type: [String, Number],
      default: 'default',
    },
    userId: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
  });
</script>
