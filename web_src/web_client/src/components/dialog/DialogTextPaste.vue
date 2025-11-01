<template>
  <v-dialog v-model="textPasteDialog" contained max-width="500">
    <v-card rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="#76FF03" icon="mdi-content-paste" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block"> Paste Text on Target </strong>
          </template>

          <div class="text-body-2 text-medium-emphasis">
            Are you sure you want to send and paste this text to the connected system? This action
            cannot be undone.
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
          :disabled="isProcessing"
          @click="handleClick('cancel')"
        />

        <v-btn
          class="text-none"
          color="#76FF03"
          text="Send"
          variant="tonal"
          :loading="isProcessing"
          :disabled="isProcessing"
          @click="handleClick('ok')"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';
  import { useSendText } from '@/composables/useSendText';

  const store = useAppStore();
  const { textPasteDialog, isProcessing } = storeToRefs(store);
  const { confirmSend, cancelSend, pendingText } = useSendText();

  // TODO standardize
  const handleClick = (value) => {
    const actions = {
      cancel: cancelSend,
      ok: confirmSend,
    };

    if (actions[value]) {
      actions[value]();
    }
  };

  onMounted(() => {});
</script>

<style scoped>
  .ocr-dialog {
    max-height: 90vh;
  }

  .ocr-card {
    max-height: 90vh;
    overflow: hidden;
  }
</style>
