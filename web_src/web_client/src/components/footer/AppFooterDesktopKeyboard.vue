<template>
  <!-- Desktop Keyboard Section -->
  <template v-if="showKeyboard">
    <!-- Detach button for experimental mode -->
    <v-row 
      v-if="isExperimental" 
      no-gutters 
      dense 
      align="center" 
      class="w-100" 
      style="height: 35px"
    >
      <v-col cols="auto" class="d-flex justify-end">
        <v-btn
          prepend-icon="mdi-chevron-down"
          density="compact"
          rounded="lg"
          v-ripple
          variant="tonal"
          color="#76FF03"
          style="text-transform: none"
        >
          Detach
        </v-btn>
      </v-col>
      <v-spacer />
    </v-row>

    <!-- Keyboard shortcuts -->
    <v-row no-gutters dense align="center" class="w-100" style="min-height: 25px;">
      <v-col cols="12" class="d-flex justify-center align-center position-relative">
        <KeyboardShortcuts />
      </v-col>
    </v-row>

    <!-- Keyboard component -->
    <v-row dense no-gutters class="mt-1">
      <v-col cols="12" class="d-flex justify-center">
        <myKeyboard
          :input="device.hid.keyboard.inputKey"
          @onKeyPress="handleKeyPress"
          @onKeyReleased="handleKeyReleased"
        />
      </v-col>
    </v-row>
  </template>
</template>

<script setup>
import myKeyboard from "@/components/AppKeyboard.vue";
import KeyboardShortcuts from "@/components/AppKeyboardShortcuts.vue";

// Props
defineProps({
  showKeyboard: {
    type: Boolean,
    required: true
  },
  isExperimental: {
    type: Boolean,
    required: true
  },
  device: {
    type: Object,
    required: true
  },
  handleKeyPress: {
    type: Function,
    required: true
  },
  handleKeyReleased: {
    type: Function,
    required: true
  }
});
</script>

<style scoped>
.keyboard-container.expanded {
  height: auto;
  overflow-y: hidden;
  padding: 0;
}

.keyboard-container.collapsed {
  overflow: hidden;
}

.keyboardContainer {
  display: flex;
  background-color: black;
  justify-content: center;
  width: 1024px;
  margin: 0 auto;
  border-radius: 5px;
}

.selectedClass {
  color: rgb(#76ff03);
  border-top: 1px solid rgb(#76ff03);
  border-bottom: 1px solid rgb(#76ff03);
  border-left: 1px solid rgb(#76ff03);
  border-right: 1px solid rgb(#76ff03);
}
</style>