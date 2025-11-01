<template>
  <v-dialog v-model="showNameDialog" max-width="400">
    <v-card @keydown.stop @keyup.stop rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar
              class="mt-n14"
              color="#76FF03"
              icon="mdi-content-save-outline"
              variant="tonal"
            />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block"> Save Recorded Shortcut </strong>
          </template>

          <div class="text-body-2 mb-4 text-medium-emphasis">
            Recorded keys: <strong>{{ capturedKeysDisplay }}</strong>
          </div>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-card-text>
        <v-combobox
          v-model="shortcutName"
          :items="currentSuggestedNames"
          label="Shortcut Name"
          placeholder="e.g., Copy, Paste, Select All"
          :error="!!nameErrorMessage || !!keyComboErrorMessage"
          :error-messages="nameErrorMessage || keyComboErrorMessage"
          :disabled="!!duplicateKeys"
          variant="outlined"
          density="compact"
          autofocus
          clearable
          @update:model-value="validateInput"
          @keyup.enter="handleSave"
        />

        <!-- Warning for duplicate key combination -->
        <v-alert v-if="duplicateKeys" type="error" density="compact" variant="tonal" class="mt-2">
          <div class="text-body-2">
            These keys are already assigned to "{{ duplicateKeys.name }}".
          </div>
          <div class="text-caption mt-1">Use the existing shortcut instead.</div>
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="bg-surface-light">
        <v-spacer />

        <v-btn
          border
          class="text-none"
          :color="duplicateKeys ? '#76FF03' : 'white'"
          :text="duplicateKeys ? 'Close' : 'Cancel'"
          variant="tonal"
          @click="handleCancel"
          :disabled="isSaving"
        />

        <v-btn
          v-if="!duplicateKeys"
          class="text-none"
          color="#76FF03"
          text="Save"
          variant="tonal"
          @click="handleSave"
          :loading="isSaving"
          :disabled="!shortcutName || !!nameErrorMessage || !!keyComboErrorMessage"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { formatKeys } from '@/utils/keyFormatter.js';
  import {
    validateShortcutName,
    validateKeyCombo,
    validateUniqueShortcut,
  } from '@/utils/inputValidation.js';
  import { debounceValidation } from '@/utils/debounce.js';

  const emit = defineEmits(['save', 'cancel']);

  // Dialog state
  const showNameDialog = ref(false);
  const isSaving = ref(false);

  // Data passed from parent
  const currentCapturedKeys = ref([]);
  const currentSuggestedNames = ref([]);
  const existingShortcuts = ref([]);

  // Form data
  const shortcutName = ref('');
  const nameErrorMessage = ref('');
  const keyComboErrorMessage = ref('');
  const duplicateKeys = ref(null);

  // Expose method to open dialog
  const open = (capturedKeys, suggestedNames, allShortcuts) => {
    currentCapturedKeys.value = capturedKeys || [];
    currentSuggestedNames.value = suggestedNames || [];
    existingShortcuts.value = allShortcuts || [];

    // Pre-fill the name with the formatted keys (e.g., "Ctrl + C")
    if (capturedKeys && capturedKeys.length > 0) {
      shortcutName.value = formatKeys(capturedKeys);
    } else {
      shortcutName.value = '';
    }

    // Validate the captured keys and check for duplicates
    validateCapturedKeys();

    // Clear any previous errors
    nameErrorMessage.value = '';
    keyComboErrorMessage.value = '';

    showNameDialog.value = true;
  };

  defineExpose({
    open,
  });

  const capturedKeysDisplay = computed(() => {
    if (!currentCapturedKeys.value.length) return '';
    return formatKeys(currentCapturedKeys.value);
  });

  const validateCapturedKeys = () => {
    // Validate key combination
    const keyValidationError = validateKeyCombo(currentCapturedKeys.value);
    if (keyValidationError) {
      keyComboErrorMessage.value = keyValidationError;
      duplicateKeys.value = null;
      return;
    }

    // Check for duplicate key combination
    const keysString = JSON.stringify(currentCapturedKeys.value.sort());
    const existing = existingShortcuts.value.find(
      (s) => s.value && JSON.stringify(s.value.sort()) === keysString
    );
    duplicateKeys.value = existing || null;
    keyComboErrorMessage.value = '';
  };

  // Debounced validation to prevent excessive validation calls during typing
  const debouncedValidateInput = debounceValidation((value) => {
    if (!value || value.trim() === '') {
      nameErrorMessage.value = '';
      return;
    }

    // Validate shortcut name
    const nameValidationError = validateShortcutName(value);
    if (nameValidationError) {
      nameErrorMessage.value = nameValidationError;
      return;
    }

    // Check for uniqueness
    const uniqueValidationError = validateUniqueShortcut(
      value,
      currentCapturedKeys.value,
      existingShortcuts.value
    );
    if (uniqueValidationError) {
      nameErrorMessage.value = uniqueValidationError;
      return;
    }

    nameErrorMessage.value = '';
  }, 300);

  const validateInput = (value) => {
    debouncedValidateInput(value);
  };

  // Centralized cleanup function
  const resetDialog = () => {
    showNameDialog.value = false;
    shortcutName.value = '';
    nameErrorMessage.value = '';
    keyComboErrorMessage.value = '';
    duplicateKeys.value = null;
  };

  const handleCancel = () => {
    emit('cancel');
    resetDialog();
  };

  const handleSave = async () => {
    if (
      !shortcutName.value.trim() ||
      nameErrorMessage.value ||
      keyComboErrorMessage.value ||
      duplicateKeys.value
    )
      return;

    isSaving.value = true;

    try {
      // Emit save event with the name
      emit('save', shortcutName.value.trim());

      // Close dialog on success
      resetDialog();
    } catch (error) {
      console.error('Error saving shortcut:', error);
    } finally {
      // Reset loading state
      setTimeout(() => {
        isSaving.value = false;
      }, 500);
    }
  };
</script>
