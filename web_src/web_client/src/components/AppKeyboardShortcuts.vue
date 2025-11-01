<template>
  <div class="d-flex flex-row align-center">
    <!-- OS Selector -->
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-chip v-bind="props" density="compact" class="mr-2" color="#76FF03">
          <v-icon>{{ currentOSIcon }}</v-icon>
        </v-chip>
      </template>
      <v-list density="compact" class="os-menu-list">
        <v-list-item
          v-for="os in osOptions"
          :key="os.value"
          @click="targetOS = os.value"
          class="os-menu-item"
        >
          <div class="os-menu-item-wrapper">
            <div v-if="targetOS === os.value" class="os-menu-border-indicator"></div>
            <div class="os-menu-item-content">
              <v-icon>{{ os.icon }}</v-icon>
            </div>
          </div>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Left arrow chip -->
    <v-chip
      :color="canScrollLeft ? '#76FF03' : undefined"
      density="compact"
      style="margin-left: -20px"
      @click="scrollLeft"
      :disabled="!canScrollLeft"
    >
      <v-icon>mdi-chevron-left</v-icon>
    </v-chip>

    <!-- Scrollable shortcuts container -->
    <div
      ref="scrollContainer"
      class="d-flex flex-row align-center shortcuts-container"
      style="
        overflow-x: auto;
        scroll-behavior: smooth;
        width: 800px;
        max-width: 60vw;
        margin-left: 0px;
      "
      :style="{ 'scrollbar-width': 'none', '-ms-overflow-style': 'none' }"
    >
      <v-chip
        v-for="(item, index) in allShortcuts"
        :key="index"
        class="mr-2 flex-shrink-0 shortcut-chip"
        :color="getChipColor(item, index)"
        @click="handleShortcutClick(item.value)"
        @mousedown="startLongPress(index, item)"
        @mouseup="cancelLongPress"
        @mouseleave="cancelLongPress"
        @touchstart="startLongPress(index, item)"
        @touchend="cancelLongPress"
        @touchcancel="cancelLongPress"
      >
        <v-tooltip v-if="item.warning" location="top">
          <template v-slot:activator="{ props }">
            <span v-bind="props">{{ item.name }}</span>
          </template>
          <span>{{ item.warning }}</span>
        </v-tooltip>
        <span v-else>{{ item.name }}</span>
      </v-chip>
    </div>

    <!-- Right arrow chip -->
    <v-chip
      :color="canScrollRight ? '#76FF03' : undefined"
      density="compact"
      class="ml-2"
      @click="scrollRight"
      :disabled="!canScrollRight"
    >
      <v-icon>mdi-chevron-right</v-icon>
    </v-chip>

    <!-- Record button -->
    <v-chip
      ref="recordButton"
      :color="isRecording ? 'red' : 'grey'"
      class="ml-2"
      @click="handleRecordShortcut"
    >
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props">mdi-record-circle-outline</v-icon>
        </template>
        <span>{{ isRecording ? 'Recording shortcut' : 'Record' }}</span>
      </v-tooltip>
    </v-chip>

    <!-- Search button -->
    <v-chip color="grey" class="ml-2" @click="toggleSearch">
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props">mdi-magnify</v-icon>
        </template>
        <span>Search shortcuts</span>
      </v-tooltip>
    </v-chip>

    <!-- Reset button -->
    <v-chip color="orange-darken-3" class="ml-2" @click="openResetDialog">
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props">mdi-restore</v-icon>
        </template>
        <span>Reset to defaults</span>
      </v-tooltip>
    </v-chip>
  </div>

  <!-- Dialogs -->
  <DialogShortcutSearch ref="searchDialog" @select="selectSearchResult" />

  <DialogShortcutName ref="nameDialog" @save="saveCustomShortcut" @cancel="cancelNaming" />

  <DialogShortcutDelete ref="deleteDialog" @confirm="confirmDelete" />

  <DialogShortcutReset ref="resetDialog" :target-o-s="targetOS" @confirm="confirmReset" />
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useI18n } from 'vue-i18n';
  import { useAlert } from '@/composables/useAlert';
  import { formatKeys } from '@/utils/keyFormatter.js';
  import { validateKeyCombo } from '@/utils/inputValidation.js';
  import { throttleScroll, debounceValidation } from '@/utils/debounce.js';
  import DialogShortcutSearch from '@/components/dialog/DialogShortcutSearch.vue';
  import DialogShortcutName from '@/components/dialog/DialogShortcutName.vue';
  import DialogShortcutDelete from '@/components/dialog/DialogShortcutDelete.vue';
  import DialogShortcutReset from '@/components/dialog/DialogShortcutReset.vue';

  const { t } = useI18n();
  const store = useAppStore();
  const { isProcessing, keyboard, settings } = storeToRefs(store);

  // Target OS constants
  const TargetOS = {
    WINDOWS: 'windows',
    MACOS: 'macos',
    LINUX: 'linux',
    ANDROID: 'android',
    IOS: 'ios',
  };

  // Target OS selection (use store settings)
  const targetOS = computed({
    get: () => settings.value.targetOS || TargetOS.WINDOWS,
    set: (value) => (settings.value.targetOS = value),
  });

  // OS options for the v-list
  const osOptions = computed(() => [
    { value: TargetOS.WINDOWS, icon: 'mdi-microsoft-windows' },
    { value: TargetOS.MACOS, icon: 'mdi-apple' },
    { value: TargetOS.LINUX, icon: 'mdi-linux' },
    { value: TargetOS.ANDROID, icon: 'mdi-android' },
    { value: TargetOS.IOS, icon: 'mdi-apple-ios' },
  ]);

  import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';

  const {
    shortcutList,
    sendShortcut,
    resetShortcuts,
    deleteShortcut,
    createShortcut,
    loadShortcuts,
  } = useKeyboardShortcuts(targetOS);

  // All shortcuts from API
  const allShortcuts = computed(() => {
    // Ensure shortcutList.value is an array
    return Array.isArray(shortcutList.value) ? shortcutList.value : [];
  });

  // Recording state
  const isRecording = ref(false);
  const recordingText = ref('Record shortcut...');
  const capturedKeys = ref([]);
  const nameDialog = ref(null);

  // Get suggested names from ALL existing shortcuts (system + custom)
  const suggestedNames = computed(() => {
    return allShortcuts.value.map((s) => s.name);
  });

  // Long press and delete state
  const longPressTimer = ref(null);
  const shortcutIndexToDelete = ref(-1);

  // Dialog refs
  const resetDialog = ref(null);
  const deleteDialog = ref(null);
  const searchDialog = ref(null);

  // Scroll state
  const scrollContainer = ref(null);
  const canScrollLeft = ref(false);
  const canScrollRight = ref(false);

  // Button refs
  const recordButton = ref(null);

  // Highlighted shortcut state
  const highlightedShortcutIndex = ref(-1);

  // Debounced validation function for captured keys
  const debouncedValidateKeys = debounceValidation((keys) => {
    const validationError = validateKeyCombo(keys);
    if (validationError) {
      // Show error to user
      sendAlert('error', 'Invalid Key Combination', validationError);
      capturedKeys.value = [];
      return;
    }

    // Open naming dialog if validation passes
    nameDialog.value?.open(keys, suggestedNames.value, allShortcuts.value);
  }, 200);

  // Clear highlight when switching OS and check scroll buttons
  watch(targetOS, () => {
    highlightedShortcutIndex.value = -1;
    checkScrollButtons();
  });

  // Check scroll buttons when shortcuts change
  watch(allShortcuts, () => {
    nextTick(() => {
      if (scrollContainer.value) {
        checkScrollButtons();
      }
    });
  });

  // Check scroll position (throttled for performance)
  const checkScrollButtons = throttleScroll(() => {
    if (!scrollContainer.value) return;

    const container = scrollContainer.value;
    canScrollLeft.value = container.scrollLeft > 0;
    canScrollRight.value = container.scrollLeft < container.scrollWidth - container.clientWidth - 1;
  }, 50);

  // Scroll functions - scroll by multiple chips at once
  const scrollLeft = () => {
    if (!scrollContainer.value) return;

    // Scroll by approximately 3-4 chips width
    scrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' });
    checkScrollButtons();
  };

  const scrollRight = () => {
    if (!scrollContainer.value) return;

    // Scroll by approximately 3-4 chips width
    scrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' });
    checkScrollButtons();
  };

  // Handle click outside to cancel recording
  const handleClickOutside = (e) => {
    if (!isRecording.value) return;

    // Check if click is on the record button itself
    if (recordButton.value?.$el && recordButton.value.$el.contains(e.target)) {
      return;
    }

    // Cancel recording mode
    isRecording.value = false;
    recordingText.value = 'Record shortcut...';
    capturedKeys.value = [];
  };

  // Setup event listeners
  onMounted(() => {
    // Add keyboard listener for recording
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleClickOutside);
    // if shortcutList is empty, load shortcuts
    if (shortcutList.value.length === 0) {
      loadShortcuts();
    }
    // Setup scroll listener with delay to ensure shortcuts are loaded
    setTimeout(() => {
      if (scrollContainer.value) {
        scrollContainer.value.addEventListener('scroll', checkScrollButtons);
        checkScrollButtons();
      }
    }, 500);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('click', handleClickOutside);

    if (scrollContainer.value) {
      scrollContainer.value.removeEventListener('scroll', checkScrollButtons);
    }
  });

  // Current OS icon
  const currentOSIcon = computed(() => {
    switch (targetOS.value) {
      case TargetOS.MACOS:
        return 'mdi-apple';
      case TargetOS.LINUX:
        return 'mdi-linux';
      case TargetOS.WINDOWS:
        return 'mdi-microsoft-windows';
      case TargetOS.ANDROID:
        return 'mdi-android';
      case TargetOS.IOS:
        return 'mdi-apple-ios';
      default:
        return 'mdi-microsoft-windows';
    }
  });

  const handleKeyDown = (e) => {
    if (!isRecording.value) return;

    e.preventDefault();
    e.stopPropagation();

    // Only capture when pressing a non-modifier key (the main key)
    if (
      e.code.includes('Control') ||
      e.code.includes('Shift') ||
      e.code.includes('Alt') ||
      e.code.includes('Meta')
    ) {
      return; // Skip modifier-only keydowns
    }

    // Build key combination with consistent modifier order: Ctrl, Shift, Alt, Meta, then main key
    const keys = [];

    // Add modifiers in consistent order
    if (e.ctrlKey) keys.push(e.code.includes('Control') ? e.code : 'ControlLeft');
    if (e.shiftKey) keys.push(e.code.includes('Shift') ? e.code : 'ShiftLeft');
    if (e.altKey) keys.push(e.code.includes('Alt') ? e.code : 'AltLeft');
    if (e.metaKey) keys.push(e.code.includes('Meta') ? e.code : 'MetaLeft');

    // Add the main key
    keys.push(e.code);

    capturedKeys.value = keys;
    recordingText.value = formatKeys(keys);
  };

  const handleKeyUp = (e) => {
    if (!isRecording.value) return;

    e.preventDefault();
    e.stopPropagation();

    // Stop recording and validate captured keys
    if (capturedKeys.value.length > 0) {
      isRecording.value = false;
      recordingText.value = 'Record shortcut...';

      // Use debounced validation to prevent rapid validation calls
      debouncedValidateKeys(capturedKeys.value);
    }
  };

  const handleShortcutClick = (value) => {
    if (isRecording.value) return;

    // Clear any existing highlight when user clicks a shortcut directly
    highlightedShortcutIndex.value = -1;

    isProcessing.value = true;
    console.log(`["${value}"]`);
    keyboard.value.keyPress = value;
    sendShortcut(value);
    isProcessing.value = false;
  };

  const handleRecordShortcut = () => {
    // Remove focus from the button
    if (recordButton.value?.$el) {
      recordButton.value.$el.blur();
    }

    if (isRecording.value) {
      // Cancel recording
      isRecording.value = false;
      recordingText.value = 'Record shortcut...';
      capturedKeys.value = [];
    } else {
      // Start recording
      isRecording.value = true;
      capturedKeys.value = [];
    }
  };

  const saveCustomShortcut = async (name) => {
    if (!name) return;

    // Create shortcut via API
    const success = await createShortcut(name, capturedKeys.value, 'custom');

    if (success) {
      // Reset
      capturedKeys.value = [];
    }
  };

  const cancelNaming = () => {
    capturedKeys.value = [];
  };

  // Long press handling
  const startLongPress = (index, item) => {
    cancelLongPress(); // Clear any existing timer

    longPressTimer.value = setTimeout(() => {
      shortcutIndexToDelete.value = index;
      deleteDialog.value?.open(item, index);
    }, 500); // 500ms for long press
  };

  const cancelLongPress = () => {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
    }
  };

  const { sendAlert } = useAlert();

  const confirmDelete = async (deleteIndex) => {
    const shortcutToDelete = allShortcuts.value[deleteIndex];
    if (!shortcutToDelete) return;

    // Use API to delete any shortcut
    await deleteShortcut(shortcutToDelete.name);

    shortcutIndexToDelete.value = -1;
  };

  // Search functions
  const toggleSearch = () => {
    searchDialog.value?.open(allShortcuts.value);
  };

  const selectSearchResult = (item) => {
    // Execute the shortcut
    handleShortcutClick(item.value);

    // Find and highlight the selected item
    const index = allShortcuts.value.findIndex((s) => s.name === item.name);
    if (index >= 0) {
      highlightedShortcutIndex.value = index;

      // Center the item in the scroll container
      if (scrollContainer.value && allShortcuts.value.length > 0) {
        const container = scrollContainer.value;
        const containerWidth = container.clientWidth;

        // Calculate actual chip width by measuring the container
        const totalWidth = container.scrollWidth;
        const chipCount = allShortcuts.value.length;
        const avgChipWidth = totalWidth / chipCount;

        const targetPosition = index * avgChipWidth - containerWidth / 2 + avgChipWidth / 2;

        container.scrollTo({ left: Math.max(0, targetPosition), behavior: 'smooth' });
        checkScrollButtons();
      }
    }
  };

  // Helper function to determine chip color
  const getChipColor = (item, index) => {
    if (highlightedShortcutIndex.value === index) {
      return '#ffffff'; // White for highlighted item (matches keyboard active state)
    }
    if (item.warning) {
      return 'orange-darken-3';
    }
    return '#473737'; // Same background color as keyboard keys
  };

  // Open reset dialog
  const openResetDialog = () => {
    resetDialog.value?.open(targetOS.value);
  };

  // Reset shortcuts confirmation
  const confirmReset = async () => {
    await resetShortcuts();
  };
</script>

<style scoped>
  /* Hide scrollbar for Chrome, Safari and Opera */
  div::-webkit-scrollbar {
    display: none;
  }

  /* Style shortcut chips to match keyboard keys */
  .v-chip.shortcut-chip {
    background: #473737 !important;
    background-color: #473737 !important;
    color: rgb(231, 124, 124) !important;
    border-top: 1px solid rgb(241, 60, 60) !important;
    border-bottom: 1px solid rgb(241, 60, 60) !important;
    border-left: 1px solid rgb(241, 60, 60) !important;
    border-right: 1px solid rgb(241, 60, 60) !important;
    border-radius: 5px !important;
    height: 25px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }

  /* Force background on all possible Vuetify elements */
  .v-chip.shortcut-chip,
  .v-chip.shortcut-chip::before,
  .v-chip.shortcut-chip::after {
    background: #473737 !important;
    background-color: #473737 !important;
  }

  /* Override any Vuetify chip background/overlay */
  .v-chip.shortcut-chip .v-chip__underlay,
  .v-chip.shortcut-chip .v-chip__overlay {
    display: none !important;
  }

  .v-chip.shortcut-chip .v-chip__content {
    background: transparent !important;
  }

  /* Active state for shortcut chips - match keyboard exactly */
  .v-chip.shortcut-chip:active {
    background-color: #473737 !important;
    color: rgb(255, 255, 255) !important;
    border-top: 1px solid black !important;
    border-bottom: 1px solid black !important;
    border-left: 1px solid black !important;
    border-right: 1px solid black !important;
  }

  /* OS menu styling */
  .os-menu-list {
    width: 60px;
    min-width: 60px;
  }

  .os-menu-item {
    position: relative;
    overflow: visible !important;
    padding: 4px 8px;
    min-height: 40px;
  }

  .os-menu-item-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    padding-left: 12px;
  }

  .os-menu-border-indicator {
    position: absolute;
    left: 0;
    top: -8px;
    bottom: -8px;
    width: 4px;
    background-color: #76ff03;
    border-radius: 0 2px 2px 0;
    box-shadow: 0 0 8px rgba(118, 255, 3, 0.4);
  }

  .os-menu-item-content {
    width: 100%;
    display: flex;
    justify-content: center;
  }
</style>
