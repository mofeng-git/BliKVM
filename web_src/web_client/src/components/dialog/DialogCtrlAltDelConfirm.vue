<template>
  <v-dialog v-model="showCtrlAltDelDialog" max-width="500" location="top" :z-index="zIndex.modal">
    <v-card rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="#FFD600" icon="mdi-alert-outline" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block">
              {{ $t('ctrlAltDel.confirmTitle') }}
            </strong>
          </template>

          <div class="text-body-2 mb-4 text-medium-emphasis">
            {{ $t('ctrlAltDel.confirmMessage') }}
          </div>

          <div class="text-body-2 text-medium-emphasis">
            {{ $t('ctrlAltDel.warningMessage') }}
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
          :text="$t('common.cancel')"
          variant="tonal"
          @click="closeDialog"
        />

        <v-btn
          class="text-none"
          color="#FFD600"
          :text="$t('ctrlAltDel.sendButton')"
          variant="tonal"
          @click="confirmSendCtrlAltDel"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
  import { zIndex } from '@/styles/zIndex';

  const store = useAppStore();
  const { showCtrlAltDelDialog } = storeToRefs(store);
  const { sendShortcut } = useKeyboardShortcuts();

  const closeDialog = () => {
    showCtrlAltDelDialog.value = false;
  };

  const confirmSendCtrlAltDel = () => {
    const keyvalue = ['ControlLeft', 'AltLeft', 'Delete'];
    sendShortcut(keyvalue);
    closeDialog();
  };
</script>
