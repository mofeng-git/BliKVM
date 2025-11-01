<template>
  <!-- Virtual Mouse Section (when needed) -->
  <v-row v-if="showVirtualMouse" dense no-gutters align="center" class="w-100">
    <v-col cols="12" class="d-flex justify-center">
      <VirtualMouse />
    </v-col>
  </v-row>
</template>

<script setup>
import VirtualMouse from "@/components/VirtualMouse.vue";

// Props
defineProps({
  showVirtualMouse: {
    type: Boolean,
    required: true
  }
});
</script>