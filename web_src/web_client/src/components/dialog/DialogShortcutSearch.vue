<template>
  <v-dialog v-model="showSearchDialog" max-width="700">
    <v-card rounded="lg" @keydown.stop @keyup.stop>
      <v-list class="py-6" :lines="false">
        <v-list-item>
          <template #prepend>
            <v-avatar class="mt-n14" color="#76FF03" icon="mdi-magnify" variant="tonal" />
          </template>

          <template #title>
            <strong class="mb-2 d-inline-block"> Search Shortcuts </strong>
          </template>

          <div class="text-body-2 mb-4 text-medium-emphasis">
            Search through your keyboard shortcuts by name or key combination.
          </div>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-card-text>
        <v-text-field
          v-model="searchQuery"
          label="Search"
          placeholder="Type to search shortcuts..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          autofocus
          @keyup.escape="showSearchDialog = false"
        />

        <div v-if="filteredShortcuts.length > 0" class="mt-4">
          <v-chip
            v-for="(item, index) in filteredShortcuts"
            :key="index"
            class="ma-1 shortcut-result-chip"
            color="#e77c7c"
            @click="selectResult(item)"
            style="border: 1px solid rgb(241, 60, 60)"
          >
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <span v-bind="props">{{ item.name }}</span>
              </template>
              <span>{{ formatKeys(item.value) }}</span>
            </v-tooltip>
          </v-chip>
        </div>

        <div v-else-if="searchQuery" class="text-center py-8 text-medium-emphasis">
          <v-icon size="48" class="mb-2">mdi-magnify-remove-outline</v-icon>
          <div class="text-body-1">No shortcuts found</div>
          <div class="text-caption">Try a different search term</div>
        </div>

        <div v-else class="text-center py-4 text-medium-emphasis">
          <div class="text-body-2">{{ currentShortcuts.length }} shortcuts available</div>
          <div class="text-caption">Start typing to search</div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="bg-surface-light">
        <v-spacer />

        <v-btn
          border
          class="text-none"
          color="#76FF03"
          text="Close"
          variant="tonal"
          @click="showSearchDialog = false"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { formatKeys } from '@/utils/keyFormatter.js';

  const emit = defineEmits(['select']);

  // Dialog state
  const showSearchDialog = ref(false);
  const searchQuery = ref('');

  // Data passed from parent
  const currentShortcuts = ref([]);

  // Expose method to open dialog
  const open = (shortcuts) => {
    currentShortcuts.value = shortcuts || [];
    searchQuery.value = '';
    showSearchDialog.value = true;
  };

  defineExpose({
    open,
  });

  const filteredShortcuts = computed(() => {
    if (!searchQuery.value) return currentShortcuts.value;

    const query = searchQuery.value.toLowerCase();
    return currentShortcuts.value.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.value.some((key) => key.toLowerCase().includes(query))
    );
  });

  const selectResult = (item) => {
    emit('select', item);
    showSearchDialog.value = false;
    searchQuery.value = '';
  };
</script>
