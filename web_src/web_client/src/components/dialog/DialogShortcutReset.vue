<template>
  <v-dialog v-model="showResetDialog" max-width="500">
    <v-card rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="orange-darken-3" icon="mdi-restore" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block"> Reset Keyboard Shortcuts </strong>
          </template>

          <div class="text-body-2 mb-4 text-medium-emphasis">
            Are you sure you want to reset all keyboard shortcuts to their default values for
            <strong>{{ currentOS }}</strong
            >?
          </div>

          <div class="text-body-2 text-medium-emphasis">
            This will remove all custom shortcuts and restore the original system shortcuts.
          </div>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-card-actions class="bg-surface-light">
        <v-spacer />

        <v-btn
          border
          class="text-none"
          color="white"
          text="Cancel"
          variant="tonal"
          @click="showResetDialog = false"
          :disabled="isResetting"
        />

        <v-btn
          class="text-none"
          color="orange-darken-3"
          text="Reset to Defaults"
          variant="tonal"
          @click="handleReset"
          :loading="isResetting"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref } from 'vue';

  const props = defineProps({
    targetOS: String,
  });

  const emit = defineEmits(['confirm']);

  // Reset dialog state
  const showResetDialog = ref(false);
  const isResetting = ref(false);
  const currentOS = ref('');

  // Expose method to open dialog
  const open = (os) => {
    currentOS.value = os || props.targetOS || 'windows';
    showResetDialog.value = true;
  };

  defineExpose({
    open,
  });

  const handleReset = async () => {
    isResetting.value = true;

    try {
      // Emit confirm event for parent to handle
      await emit('confirm');

      // Close dialog on success
      showResetDialog.value = false;
    } catch (error) {
      console.error('Error resetting shortcuts:', error);
    } finally {
      // Reset loading state after a delay
      setTimeout(() => {
        isResetting.value = false;
      }, 1000);
    }
  };
</script>
