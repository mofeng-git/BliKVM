<template>
  <!-- Terminal Section -->
  <div v-if="hasActiveTerminals" class="terminal-full-width" :class="{ 'with-drawer': settings.isVisible }">
    <!-- Vertical Resize Handle (above terminals) -->
    <div 
      class="vertical-resize-handle"
      :style="verticalHandleStyle"
      @mousedown="startVerticalResize"
      @touchstart="startVerticalResize"
      @dblclick="handleVerticalResizeDoubleClick"
    >
      <div class="vertical-resize-handle-line" />
    </div>
    
    <!-- Terminal Container with dynamic height -->
    <div 
      :style="{ 
        height: `${terminalHeight}px`,
        minHeight: '200px',
        maxHeight: '600px'
      }"
    >
      <!-- Single SSH Terminal -->
      <div v-if="showSSHTerminal && !showSerial">
        <AppConsole />
      </div>
      <!-- Single Serial Terminal -->
      <div v-if="showSerial && !showSSHTerminal">
        <AppSerial />
      </div>
      <!-- Dual Terminals with Resizer -->
      <div 
        v-if="showSSHTerminal && showSerial"
        class="d-flex terminal-container-flex"
        style="height: 100%;"
      >
        <div :style="terminalStyle.ssh" class="terminal-column">
          <AppConsole />
        </div>
        <div 
          class="resize-handle"
          @mousedown="startResize"
          @touchstart="startResize"
          @dblclick="handleResizeDoubleClick"
        >
          <div class="resize-handle-line" />
        </div>
        <div :style="terminalStyle.serial" class="terminal-column">
          <AppSerial />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTerminalResize } from "@/composables/useTerminalResize";
import { useTerminalVerticalResize } from "@/composables/useTerminalVerticalResize";
import AppConsole from "@/components/AppConsole.vue";
import AppSerial from "@/components/AppSerial.vue";

// Props
const props = defineProps({
  showSSHTerminal: {
    type: Boolean,
    required: true
  },
  showSerial: {
    type: Boolean,
    required: true
  },
  settings: {
    type: Object,
    required: true
  }
});

// Terminal resize functionality
const { terminalWidth: sshTerminalWidth, isResizing, startResize, handleResizeDoubleClick } = useTerminalResize(50);
const { terminalHeight, isVerticalResizing, startVerticalResize } = useTerminalVerticalResize(300);

// Computed properties
const hasActiveTerminals = computed(() => 
  props.showSSHTerminal || props.showSerial
);

const terminalStyle = computed(() => ({
  ssh: {
    flexBasis: props.showSerial ? `${sshTerminalWidth.value}%` : '100%',
    flexGrow: 0,
    flexShrink: 0,
    minWidth: props.showSerial ? '20%' : '100%',
    maxWidth: props.showSerial ? '80%' : '100%'
  },
  serial: {
    flexBasis: props.showSSHTerminal ? `${100 - sshTerminalWidth.value}%` : '100%',
    flexGrow: 0,
    flexShrink: 0,
    minWidth: props.showSSHTerminal ? '20%' : '100%',
    maxWidth: props.showSSHTerminal ? '80%' : '100%'
  }
}));

// Position vertical handle above the horizontal splitter when both terminals are active
const verticalHandleStyle = computed(() => {
  if (props.showSSHTerminal && props.showSerial) {
    // When both terminals are shown, position handle above the horizontal splitter
    const sshWidth = sshTerminalWidth.value;
    return {
      position: 'relative',
      left: `${sshWidth}%`,
      transform: 'translateX(-50%)', // Center the handle on the splitter
      width: 'auto',
      maxWidth: '60px' // Limit handle width when positioned over splitter
    };
  } else {
    // Single terminal - center the handle across full width
    return {
      position: 'relative',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'auto'
    };
  }
});

// Vertical resize double-click handler - reset to default height
const handleVerticalResizeDoubleClick = () => {
  // Reset terminal height to default (300px) - industry standard behavior
  terminalHeight.value = 300;
};
</script>

<style scoped>
.terminal-container {
  min-height: 300px;
}

.terminal-container-flex {
  position: relative;
  display: flex;
  flex-direction: row;
  min-width: 0;
  overflow: hidden;
  width: 100% !important;
  max-width: none !important;
  margin: 0;
}

.terminal-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  margin: 0;
}

.terminal-column > * {
  flex: 1;
  min-width: 0;
}

.terminal-column :deep(.console-container) {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  width: 100% !important;
  max-width: none !important;
  margin: 0;
}

.terminal-column :deep(.terminal-tabs) {
  flex-shrink: 0;
}

.terminal-column :deep(.terminal-sheet-outer) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding: 4px !important;
}

.terminal-column :deep(.terminal-sheet-inner) {
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.resize-handle {
  width: 2px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background-color 0.2s ease;
  user-select: none;
  z-index: 10;
  flex-shrink: 0;
}

.resize-handle:hover {
  background: rgba(255, 255, 255, 0.05);
}

.resize-handle-line {
  width: 2px;
  height: 30px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
  pointer-events: none;
}

.terminal-section {
  width: 100% !important;
  max-width: none !important;
  display: flex;
  flex-direction: column;
  margin: 0;
}

.vertical-resize-handle {
  height: 8px;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background-color 0.2s ease;
  user-select: none;
  position: relative;
}

.vertical-resize-handle:hover {
  background: rgba(255, 255, 255, 0.05);
}

.vertical-resize-handle-line {
  height: 2px;
  width: 30px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
  pointer-events: none;
  position: absolute;
}

.terminal-full-width {
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  width: 100vw;
  max-width: 100vw;
}

.terminal-full-width.with-drawer {
  margin-left: calc(-50vw + 250px);
  width: calc(100vw - 500px);
  max-width: calc(100vw - 500px);
}
</style>