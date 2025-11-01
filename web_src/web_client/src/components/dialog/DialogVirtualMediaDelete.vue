<template>
  <v-dialog v-model="deleteVirtualMediaDialog" max-width="500">
    <v-card v-if="selectedItem" rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="#76FF03" icon="mdi-trash-can-outline" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block">
              {{ $t('msd.virtualMediaDelete') }}
            </strong>
          </template>

          <div class="text-body-2 mb-4 text-medium-emphasis">
            {{ $t('msd.deleteMsdConfirm') }}
          </div>

          <div class="text-body-2 text-medium-emphasis">
            {{ $t('msd.irreversable') }}
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
          @click="handleClick('cancel')"
        />

        <v-btn
          class="text-none"
          color="red"
          text="Delete"
          variant="tonal"
          @click="deleteVMConfirm(selectedItem)"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import http from '@/utils/http.js';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useAlert } from '@/composables/useAlert';

  const store = useAppStore();
  const { deleteVirtualMediaDialog, msd } = storeToRefs(store);

  const { sendAlert } = useAlert();

  const emit = defineEmits(['refreshImageList']);

  // Local state
  const isProcessing = ref(false);

  const closeDialog = () => {
    deleteVirtualMediaDialog.value = false;
  };

  const deleteVMConfirm = async () => {
    isProcessing.value = true;
    try {
      const response = await http.post('/msd/remove');
      if (response && response.data) {
        const { msg, data } = response.data;
        if (data.msd_img_created === 'not_created') {
          // MSD deleted successfully
          msd.value.isMsdCreated = false;
          sendAlert('success', 'MSD Deletion Status', msg);

          // Emit an event to notify parent of success
          emit('msdDeleted');
        } else {
          sendAlert('error', 'MSD Deletion Status', msg);
        }

        // Fetch updated MSD state
        // TODO    await getMSDState();
      }
    } catch (error) {
      console.error('MSD Deletion Error:', error);
      sendAlert(
        'error',
        'MSD Deletion Status',
        `There was an issue deleting the MSD. ${error}. Please try again.`
      );
    }
    isProcessing.value = false;
    closeDialog();
  };
</script>
