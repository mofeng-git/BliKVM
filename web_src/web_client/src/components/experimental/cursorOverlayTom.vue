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

      <v-btn-group
        border
        variant="elevated"
        color="orange"
        density="compact"
        rounded="lg"
        size="x-small"
      >
        <v-btn class="text-none" prepend-icon="mdi-hand-back-right-outline" :text="label" />

        <v-divider color="surface-light" vertical />

        <!-- Menu Button -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn class="px-5" icon="mdi-dots-vertical" v-bind="props" variant="tonal" />
          </template>

          <v-list>
            <v-list-item title="raise hand" />
            <v-list-item title="remove" />
          </v-list>
        </v-menu>
      </v-btn-group>
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
      default: 700,
    },
    y: {
      type: Number,
      default: 550,
    },
    label: {
      type: String,
      default: 'Tom',
    },
  });

  // Base64 green dot (12x12px)
  const greenDotCursor = computed(() => {
    // Simple green circle SVG converted to base64
    const svg = `<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="5" fill="orange" stroke="#004400" stroke-width="1"/>
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
