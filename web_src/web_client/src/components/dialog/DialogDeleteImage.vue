<template>
  <v-dialog v-model="deleteImageDialog" max-width="500">
    <v-card v-if="selectedItem" rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="#76FF03" icon="mdi-trash-can-outline" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block">
              {{ $t('settings.msd.deleteImage') }}
            </strong>
          </template>

          <div class="text-body-2 mb-4 text-medium-emphasis">
            {{ $t('settings.msd.deleteImageConfirm') }} "{{ selectedItem.name }}"?
          </div>

          <div class="text-body-2 text-medium-emphasis">
            {{ $t('settings.msd.irreversable') }}
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
          @click="deleteImageConfirm(selectedItem)"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import http from '@/utils/http.js';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const store = useAppStore();
  const { selectedItem, deleteImageDialog } = storeToRefs(store);
  const emit = defineEmits(['refreshImageList']);

  const closeDialog = () => {
    selectedItem.value = null;
    deleteImageDialog.value = false;
  };
  const handleClick = (value) => {
    const actions = {
      cancel: () => {
        closeDialog();
      },
      ok: () => {
        deleteImageConfirm;
      },
    };

    if (actions[value]) {
      actions[value]();
    }
  };

  const deleteImageConfirm = async (item) => {
    if (item?.path) {
      try {
        //
        const url = `/msd/delete?image=${item.path}`;
        console.log('Deleting image at:', url);

        const response = await http.post(url);

        if (response.data.code === 0) {
          emit('refreshImageList');
        } else {
          console.error('Error deleting image image:', response);
          const title = 'Error deleting image';
          const message = `${response}. Try again.`;
          sendAlert('error', title, message);
        }
      } catch (error) {
        console.error('Error occurred while deleting:', error);
      }
    }

    closeDialog(); // Close dialog after confirming
  };
</script>
