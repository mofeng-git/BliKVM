<template>
  <v-dialog v-model="ocr.showOcrDialog" contained max-width="500">
    <v-card rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="#76FF03" icon="mdi-text-recognition" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block"> Start Text Extraction </strong>
          </template>

          <div class="text-body-2 text-medium-emphasis">
            Do you want to extract text from the selected area? This process runs in the background
            and can be canceled.
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
          @click="handleClick('cancelOcr')"
        />

        <v-btn
          class="text-none"
          color="#76FF03"
          text="Start"
          variant="tonal"
          @click="handleClick('startOcr')"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="ocr.showOcrOutputDialog" contained max-width="500">
    <v-card rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="#76FF03" icon="mdi-text" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block"> Copy Extracted Text </strong>
          </template>

          <div class="text-body-2 text-medium-emphasis">{{ ocrOutput }}<br /></div>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-card-actions class="bg-surface-light">
        <v-spacer />

        <v-btn
          border
          class="text-none"
          color="white"
          text="Close"
          variant="tonal"
          @click="handleClick('close')"
        />

        <v-btn
          class="text-none copy-btn"
          color="#76FF03"
          text="Copy to Clipboard"
          variant="tonal"
          @click="handleClick('copyToClipboard')"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';
  import { useExtractText } from '@/composables/useExtractText';
  import ClipboardJS from 'clipboard';

  const store = useAppStore();
  const { resetOcrState, ocrOutput, ocrRecognition } = useExtractText();
  const { ocr } = storeToRefs(store);

  // TODO standardize
  const handleClick = (value) => {
    const actions = {
      cancelOcr: () => {
        resetOcrState();
      },
      startOcr: () => {
        resetOcrState();
        ocrRecognition();
      },
      copyToClipboard: () => {
        ocr.value.showOcrOutputDialog = false;
      },
      close: () => {
        ocr.value.showOcrOutputDialog = false;
      },
    };

    if (actions[value]) {
      actions[value]();
    }
  };

  onMounted(() => {
    new ClipboardJS('.copy-btn', {
      text: () => ocrOutput.value,
    })
      .on('success', () => {
        console.log('Text copied to clipboard.');
      })
      .on('error', () => {
        console.error('Failed to copy text.');
      });
  });
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
