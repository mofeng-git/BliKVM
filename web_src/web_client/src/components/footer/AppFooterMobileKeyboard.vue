<template>
  <!-- Mobile Keyboard Section -->
  <template v-if="showMobileKeyboard">
    <!-- Mobile keyboard shortcuts -->
    <v-row no-gutters dense align="center" class="w-100" style="min-height: 25px;">
      <v-col cols="12" class="d-flex justify-center align-center position-relative">
        <KeyboardShortcuts />
      </v-col>
      <v-col cols="auto" class="d-flex justify-end align-center position-absolute" style="right: 0; top: 0; bottom: 0; z-index: 1;">
        <v-btn
          prepend-icon="mdi-chevron-down"
          density="compact"
          rounded="lg"
          v-ripple
          variant="tonal"
          color="#76FF03"
          style="text-transform: none"
          @click="toggleComponent('keyboard')"
        >
          {{ $t("common.hide") }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Mobile keyboard interface -->
    <v-row dense no-gutters class="mt-1">
      <v-col cols="12" class="d-flex justify-center">
        <div class="mobile-keyboard-container">
          <!-- Text input area -->
          <v-card class="mobile-keyboard-input mb-2" color="rgba(118, 255, 3, 0.1)" variant="outlined">
            <v-card-text class="pa-2">
              <v-textarea
                v-model="mobileKeyboardText"
                :placeholder="$t('settings.text.paste.input')"
                auto-grow
                rows="2"
                max-rows="4"
                hide-details
                class="mobile-input"
                clear-icon="mdi-close-circle"
                @keydown.enter.prevent="sendMobileText"
              />
            </v-card-text>
          </v-card>
          
          <!-- Quick action buttons -->
          <v-row dense no-gutters class="mb-2">
            <v-col cols="4" class="px-1">
              <v-btn
                block
                size="small"
                color="#76FF03"
                variant="outlined"
                @click="sendMobileText"
              >
                {{ $t("common.send") }}
              </v-btn>
            </v-col>
            <v-col cols="4" class="px-1">
              <v-btn
                block
                size="small"
                color="#76FF03"
                variant="outlined"
                @click="sendSpecialKey('Enter')"
              >
                Enter
              </v-btn>
            </v-col>
            <v-col cols="4" class="px-1">
              <v-btn
                block
                size="small"
                color="#76FF03"
                variant="outlined"
                @click="sendSpecialKey('Tab')"
              >
                Tab
              </v-btn>
            </v-col>
          </v-row>
          
          <!-- Common key shortcuts -->
          <v-row dense no-gutters>
            <v-col cols="3" class="px-1">
              <v-btn
                block
                size="small"
                color="#76FF03"
                variant="outlined"
                @click="sendSpecialKey('Escape')"
              >
                Esc
              </v-btn>
            </v-col>
            <v-col cols="3" class="px-1">
              <v-btn
                block
                size="small"
                color="#76FF03"
                variant="outlined"
                @click="sendSpecialKey('Backspace')"
              >
                ⌫
              </v-btn>
            </v-col>
            <v-col cols="3" class="px-1">
              <v-btn
                block
                size="small"
                color="#76FF03"
                variant="outlined"
                @click="sendSpecialKey('ArrowUp')"
              >
                ↑
              </v-btn>
            </v-col>
            <v-col cols="3" class="px-1">
              <v-btn
                block
                size="small"
                color="#76FF03"
                variant="outlined"
                @click="sendSpecialKey('ArrowDown')"
              >
                ↓
              </v-btn>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
  </template>
</template>

<script setup>
import { useMobileKeyboard } from "@/composables/useMobileKeyboard";
import KeyboardShortcuts from "@/components/AppKeyboardShortcuts.vue";
import { useI18n } from "vue-i18n";

// Props
const props = defineProps({
  showMobileKeyboard: {
    type: Boolean,
    required: true
  },
  handleKeyPress: {
    type: Function,
    required: true
  },
  handleKeyReleased: {
    type: Function,
    required: true
  },
  toggleComponent: {
    type: Function,
    required: true
  }
});

// Composables
const { t } = useI18n();
const { mobileKeyboardText, sendMobileText, sendSpecialKey } = useMobileKeyboard(
  props.handleKeyPress,
  props.handleKeyReleased
);
</script>

<style scoped>
.mobile-keyboard-container {
  width: 100%;
  max-width: 600px;
  padding: 8px;
}

.mobile-keyboard-input {
  border: 1px solid rgba(118, 255, 3, 0.3);
}

.mobile-input :deep(.v-field) {
  background: rgba(0, 0, 0, 0.8);
}

.mobile-input :deep(.v-field__input) {
  color: #76FF03;
  font-family: 'Courier New', monospace;
}

.mobile-input :deep(.v-field__outline) {
  border-color: rgba(118, 255, 3, 0.3);
}

.mobile-input :deep(.v-field--focused .v-field__outline) {
  border-color: #76FF03;
}
</style>