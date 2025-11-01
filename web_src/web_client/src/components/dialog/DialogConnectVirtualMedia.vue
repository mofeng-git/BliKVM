<template>
  <v-dialog v-model="myConnectMsdDialog">
    <v-card>
      <v-card-text>
        {{ imageConnectResultText }}
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" block @click="myConnectMsdDialog = false">Close</v-btn>
        <v-btn color="primary" block @click="connectMsd">Ok</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import http from '@/utils/http.js';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const store = useAppStore();
  const { myConnectMsdDialog } = storeToRefs(store);
  // TODO const emit = defineEmits(["refreshImageList"]);

  const connectMsd = () => {
    myConnectMsdDialog.value = false;
  };
</script>
