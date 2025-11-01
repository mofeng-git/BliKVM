<template>
  <v-dialog v-model="dialogDeleteItem" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">Are you sure you want to delete this item?</v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" variant="text" @click="closeDelete">Cancel</v-btn>
        <v-btn color="blue-darken-1" variant="text" @click="deleteItemConfirm">OK</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, onMounted, nextTick } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const route = useRoute();
  const store = useAppStore();

  const { dialogDeleteItem } = storeToRefs(store);

  const close = () => {
    this.dialog = false;
    this.$nextTick(() => {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    });
  };

  const deleteItem = (item) => {
    editedIndex.value = allowList.value.indexOf(item);
    editedItem.value = { ...item };
    dialogDeleteItem.value = true;
  };

  const deleteItemConfirm = () => {
    allowList.value.splice(editedIndex.value, 1);
    closeDelete();
  };

  const closeDelete = () => {
    dialogDeleteItem.value = false;
    nextTick(() => {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    });
  };
</script>
