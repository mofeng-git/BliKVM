<template>
  <v-btn-group density="compact" rounded="lg" v-ripple variant="tonal">
    <v-btn
      class="flex-grow-1 text-none"
      prepend-icon="mdi-refresh"
      color="#76FF03"
      v-ripple
      tile
      @click.stop="getACLState"
      >{{ $t('common.refresh') }}</v-btn
    >
  </v-btn-group>
  <div style="max-height: 265px; overflow-y: auto; overflow-x: hidden">
    <v-data-table
      :loading="loading"
      :headers="headers"
      :items="ACLAllowList"
      item-value="ip"
      fixed-header
      :multi-sort="true"
      hide-default-footer
      :no-data-text="$t('dataIterator.noDataText')"
      :rows-per-page-text="$t('dataIterator.rowsPerPageText')"
      :page-text="$t('dataIterator.pageText')"
      :return-object="true"
    >
      <template v-slot:loading>
        <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
      </template>

      <template v-slot:item.ip="{ item }">
        {{ item.ip }}
      </template>

      <template v-slot:item.added="{ item }">
        <span style="white-space: nowrap">{{ item.addedAt }}</span>
      </template>

      <template v-slot:item.remove="{ item }">
        <v-tooltip text="Tooltip" content-class="">
          <template v-slot:activator="{ props }">
            <v-icon
              v-bind="props"
              color="#76FF03"
              v-ripple
              class="justify-center"
              @click="handleRemove(item.ip)"
              >mdi-trash-can
            </v-icon>
          </template>
          {{ $t('common.delete') }}
        </v-tooltip>
      </template>
    </v-data-table>
  </div>

  <v-row dense class="d-flex justify-start align-center">
    <v-col cols="12">
      <v-text-field
        v-model="deviceName"
        minlength="1"
        :rules="deviceNameRules"
        density="compact"
        tile
        rounded="lg"
        v-ripple
        color="#76FF03"
        variant="outlined"
        :placeholder="$t('settings.security.authorization.newIPAdress')"
        hide-details
        single-line
        @keydown.stop
        @keyup.stop
      >
      </v-text-field>
    </v-col>
  </v-row>

  <v-row dense class="d-flex justify-end align-center">
    <v-col cols="auto">
      <v-btn
        class="flex-grow-1 text-none"
        prepend-icon="mdi-plus"
        color="#76FF03"
        v-ripple
        tile
        rounded="lg"
        flat
        variant="tonal"
        @click.stop="handleAddClick"
        >{{ $t('common.add') }}
        <template #prepend>
          <v-icon color="#76FF03" />
        </template>
      </v-btn>
    </v-col>
  </v-row>

  <deleteList />
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useACL } from '@/composables/useACL';
  import { useWOL } from '@/composables/useWOL';
  import { useAlert } from '@/composables/useAlert.js';

  const { deviceNameRules } = useWOL();

  const store = useAppStore();
  const { sendAlert } = useAlert(alert);
  const { dialogDeleteItem } = storeToRefs(store);
  const loading = ref(false);
  const deviceName = ref('');

  const headers = ref([
    {
      title: 'IP address',
      align: 'start',
      sortable: true,
      key: 'ip',
    },
    {
      title: 'Added',
      align: 'start',
      sortable: true,
      key: 'ts',
    },
    {
      title: 'Action',
      align: 'start',
      key: 'remove',
    },
  ]);

  const allowList = ref([]); // Initialize hdmiSwitch as an object with items array
  const { ACLAllowList, getACLState, apiRemove, apiAdd } = useACL();

  const handleRemove = (ip) => {
    apiRemove('allow', ip);
  };

  const handleAddClick = () => {
    if (deviceName.value.trim() === '') {
      const title = 'Allow List Error';
      const message = 'IP address cannot be empty';
      sendAlert('error', title, message);
      return;
    }
    apiAdd('allow', deviceName.value);
    deviceName.value = ''; // Clear the input field after adding
  };

  onMounted(() => {
    console.log('SecurityAllow component mounted ACLAllowList:', ACLAllowList.value);
  });
</script>
