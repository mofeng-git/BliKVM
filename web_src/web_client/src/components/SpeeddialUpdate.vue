<template>
  <v-speed-dial location="left center" transition="tab-transition">
    <template v-slot:activator="{ props: activatorProps }">
      <v-fab
        v-if="isUpdateAvailable"
        v-bind="activatorProps"
        v-tooltip:bottom="'BliKVM Update'"
        size="small"
        icon="mdi-download"
        color="success"
        @click="handleClick"
      />
    </template>
    {{ $t('device.update') }}
  </v-speed-dial>
</template>

<script setup>
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';

  const store = useAppStore();
  const { isUpdateAvailable, showUpdateDialog } = storeToRefs(store);

  const handleClick = () => {
    showUpdateDialog.value = !showUpdateDialog.value;
  };
</script>
