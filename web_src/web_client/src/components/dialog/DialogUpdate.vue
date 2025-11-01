<template>
  <v-dialog v-model="showUpdateDialog" max-width="500">
    <v-card rounded="lg">
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="#76FF03" icon="mdi-trash-can-outline" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block">
              {{ $t('Software update') }}
            </strong>
          </template>

          <div class="text-body-2 mb-4 text-medium-emphasis">
            An update is available. Are you ready to update?
          </div>

          <div class="text-body-2 text-medium-emphasis">
            {{ pkg.version }}
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
          color="#76FF03"
          text="Update"
          variant="tonal"
          @click="handleClick('update')"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';
  import pkg from 'package';

  const store = useAppStore();
  const { showUpdateDialog } = storeToRefs(store);

  const cancel = async () => {
    try {
      showUpdateDialog.value = false;
    } catch (error) {
      console.error('Error during cancel operation:', error);
    }
  };

  const update = async () => {
    try {
      showUpdateDialog.value = false;
    } catch (error) {
      console.error('Error during save operation:', error);
    }
  };

  const actionHandlers = {
    ok: update,
    cancel: cancel,
  };

  const handleClick = async (actionType) => {
    const action = actionHandlers[actionType];
    if (action) {
      try {
        await action(); // Await the action if it's async
      } catch (error) {
        console.error(`Error handling actionType ${actionType}:`, error);
      }
    } else {
      console.error(`No handler found for actionType: ${actionType}`);
    }
  };
</script>

<style scoped>
  .update-dialog {
    max-height: 90vh;
  }

  .update-card {
    max-height: 90vh;
    overflow: hidden;
  }
</style>
