<template>
  <v-overlay
    :model-value="show"
    :opacity="0"
    contained
    persistent
    no-click-animation
    class="cursor-overlay"
    content-class="d-flex flex-column align-center justify-end w-100 h-100"
  >
    <div
      class="cursor-container"
      :style="{
        left: x + 'px',
        top: y + 'px',
      }"
    >
      <!-- Green dot cursor using base64 -->
      <img :src="greenDotCursor" alt="cursor" class="cursor-dot" />

      <!-- Label -->
      <v-chip variant="elevated" color="yellow">
        {{ label }}
      </v-chip>
    </div>
  </v-overlay>
</template>

<script setup>
  import { computed } from 'vue';

  // Props
  const props = defineProps({
    show: {
      type: Boolean,
      default: true,
    },
    x: {
      type: Number,
      default: 900,
    },
    y: {
      type: Number,
      default: 750,
    },
    label: {
      type: String,
      default: 'Harry',
    },
  });

  // Base64 green dot (12x12px)
  const greenDotCursor = computed(() => {
    // Simple green circle SVG converted to base64
    const svg = `<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="5" fill="yellow" stroke="#004400" stroke-width="1"/>
    </svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  });
</script>

<style scoped>
  .cursor-overlay {
    pointer-events: none;
    z-index: 9999;
  }

  .cursor-container {
    position: absolute;
    pointer-events: none;
    transform: translate(-6px, -6px); /* Center the 12px dot */
  }

  .cursor-dot {
    width: 12px;
    height: 12px;
    display: block;
  }

  .cursor-label {
    position: absolute;
    top: 15px;
    left: -10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    min-width: 40px;
    text-align: center;
  }
</style>
