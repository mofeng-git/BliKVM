<template>
  <span class="mr-2">HID?</span>
  <v-tooltip text="Human Interface Devices" content-class="bg-primary">
    <template #activator="{ props }">
      <v-switch
        v-bind="props"
        v-model="isHidActive"
        hide-details
        color="primary"
        :ripple="true"
        @change="handleToggleHid"
      />
    </template>
  </v-tooltip>
</template>

<script setup>
  import { watch } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useToggleHid } from '@/composables/useToggleHid';

  // Initialize store
  const store = useAppStore();
  const { isHidActive } = storeToRefs(store);

  // Define the emit function to pass data to parent
  const emit = defineEmits(['update:isProcessing', 'update:error']);

  // Import useToggleHid composable
  // TODO pass these variable to parent
  const { isProcessing, error, toggleHid } = useToggleHid();

  // Watch for processing state and emit to parent
  watch(isProcessing, (newValue) => {
    emit('update:isProcessing', newValue); // Emit the new processing state to parent
    console.log('update:isProcessing', newValue);
  });

  // Watch for errors and emit to parent
  watch(error, (newValue) => {
    emit('update:error', newValue); // Emit the error to parent
  });

  // Function to handle toggle
  const handleToggleHid = async () => {
    await toggleHid(); // Call the toggleHid function when the switch is toggled
  };
</script>
