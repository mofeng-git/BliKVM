<template>
  <v-sheet rounded class="w-100">
    <!-- <v-card-title class="d-flex justify-start align-center">
      {{ $t('notification.title') }}
    </v-card-title> -->
    <v-card-text>
      <v-data-table-server
        v-model:page="page"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        loading-text="Loading... Please wait"
        :loading="loading"
        :search="search"
        item-value="ts"
        :items-per-page="5"
        hide-default-footer
        @update:options="loadItems"
      >
        <template v-slot:header.ts="{ column }">
          {{ column.title.toUpperCase() }}
        </template>
        <template v-slot:header.messageType="{ column }">
          {{ column.title.toUpperCase() }}
        </template>
        <template v-slot:header.module="{ column }">
          {{ column.title.toUpperCase() }}
        </template>
        <template v-slot:header.message="{ column }">
          {{ column.title.toUpperCase() }}
        </template>

        <template v-slot:item="{ item }">
          <tr class="text-no-wrap">
            <td>{{ item.ts }}</td>
            <td class="text-center">
              <v-chip :color="typeColor(item.messageType)">{{ item.messageType }}</v-chip>
            </td>
            <td class="text-start">{{ item.module }}</td>
            <td class="text-start">{{ item.message }}</td>
          </tr>
        </template>

        <template #bottom>
          <div class="d-flex justify-end pa-2">
            <v-pagination v-model="page" :length="pageCount" total-visible="5" />
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-sheet>
</template>

<script setup>
  import { ref, reactive, computed } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const store = useAppStore();
  const { notification } = storeToRefs(store);

  const notifications = computed(() => notification.value.list || []);

  // Table state
  const page = ref(1);
  const headers = [
    { title: 'timestamp', key: 'ts', align: 'start', sortable: true, width: '180px' },
    { title: 'Message Type', key: 'messageType', align: 'start', sortable: true, width: '120px' },
    { title: 'Source', key: 'module', align: 'start', sortable: true, width: '150px' },
    { title: 'Message', key: 'message', align: 'start', sortable: false },
  ];
  const serverItems = ref([]);
  const loading = ref(false);
  const totalItems = ref(0);
  const search = ref('');
  const pageCount = computed(() => Math.max(1, Math.ceil(totalItems.value / 5)));

  function typeColor(type) {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'primary';
    }
  }

  function formatTime(ts) {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return String(ts);
    }
  }

  function toRows(list) {
    return (list || []).map((n) => ({
      ts: formatTime(n.timestamp),
      tsRaw: n.timestamp || 0,
      messageType: n.type,
      module: n.module,
      message: n.text,
    }));
  }

  function loadItems({ page: p, sortBy, search: s }) {
    loading.value = true;
    const all = toRows(notifications.value);
    let items = all;

    // simple search on message/module
    const q = typeof s === 'string' && s.trim() ? s.trim().toLowerCase() : '';
    if (q) {
      items = items.filter(
        (i) =>
          (i.message || '').toLowerCase().includes(q) || (i.module || '').toLowerCase().includes(q)
      );
    }

    if (Array.isArray(sortBy) && sortBy.length) {
      const { key, order } = sortBy[0];
      const dir = order === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        const av = key === 'ts' ? a.tsRaw : a[key];
        const bv = key === 'ts' ? b.tsRaw : b[key];
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }

    totalItems.value = items.length;
    const currentPage = p || page.value || 1;
    page.value = currentPage;
    const start = (currentPage - 1) * 5;
    const end = start + 5;
    serverItems.value = items.slice(start, end);
    loading.value = false;
  }
</script>

<style scoped>
.v-sheet {
  margin: 0;
  width: 100%;
  max-width: none;
}

:deep(.v-data-table) {
  width: 100% !important;
}

:deep(.v-data-table .v-table__wrapper) {
  width: 100% !important;
}

:deep(.v-data-table table) {
  width: 100% !important;
  table-layout: fixed;
}
</style>
