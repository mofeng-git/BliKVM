<template>
  <!-- Notifications Section -->
  <v-row v-if="showNotifications" dense no-gutters class="w-100" style="margin: 0; width: 100%;">
    <v-col cols="12" class="pa-0" style="max-width: none;">
      <AppNotifications />
    </v-col>
  </v-row>
</template>

<script setup>
import AppNotifications from "@/components/AppNotifications.vue";

// Props
defineProps({
  showNotifications: {
    type: Boolean,
    required: true
  }
});
</script>