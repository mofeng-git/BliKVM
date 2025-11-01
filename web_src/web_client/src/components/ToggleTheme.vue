<template>
  <v-btn icon size="30" :ripple="true" @click="handleToggleTheme">
    <v-icon>mdi-theme-light-dark</v-icon>
    <v-tooltip activator="parent" location="bottom" content-class="bg-primary"
      >Toggle Theme</v-tooltip
    >
  </v-btn>
</template>

<script setup>
  import { watch } from 'vue';
  import { useToggleTheme } from '@/composables/useToggleTheme';
  import { useAppStore } from '@/stores/stores';

  const store = useAppStore();
  const { toggleTheme, isProcessing, error } = useToggleTheme();

  const emit = defineEmits(['update:isProcessing', 'update:error']);

  const handleToggleTheme = async () => {
    await toggleTheme(); // Call the toggle function from the composable
    store.toggleTheme(); // Update the state in the store
  };

  // TODO these watch never gets called
  // Watch for processing state and emit to parent
  watch(
    isProcessing,
    (newValue) => {
      console.log('Watcher triggered, isProcessing:', newValue); // Debugging output
      emit('update:isProcessing', newValue);
    },
    { immediate: true }
  );

  // Watch for errors and emit to parent
  watch(
    error,
    (newValue) => {
      console.log('Error watcher triggered, error:', newValue); // Debugging output
      emit('update:error', newValue);
    },
    { immediate: true }
  );
</script>
