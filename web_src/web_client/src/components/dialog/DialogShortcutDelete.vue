<template>
  <v-dialog v-model="showDeleteDialog" max-width="500">
    <v-card v-if="shortcut" rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="#76FF03" icon="mdi-trash-can-outline" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block"> Delete Keyboard Shortcut </strong>
          </template>

          <div class="text-body-2 mb-4 text-medium-emphasis">
            Are you sure you want to delete "{{ shortcut.name }}"?
          </div>

          <div class="text-body-2 text-medium-emphasis">
            You can restore all shortcuts using the Reset button if needed.
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
          @click="showDeleteDialog = false"
        />

        <v-btn class="text-none" color="red" text="Delete" variant="tonal" @click="confirmDelete" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref } from 'vue';

  const emit = defineEmits(['confirm']);

  // Dialog state
  const showDeleteDialog = ref(false);

  // Data passed from parent
  const shortcut = ref(null);
  const deleteIndex = ref(-1);

  // Expose method to open dialog
  const open = (shortcutItem, index) => {
    shortcut.value = shortcutItem;
    deleteIndex.value = index;
    showDeleteDialog.value = true;
  };

  defineExpose({
    open,
  });

  const confirmDelete = () => {
    emit('confirm', deleteIndex.value);
    showDeleteDialog.value = false;
  };
</script>
