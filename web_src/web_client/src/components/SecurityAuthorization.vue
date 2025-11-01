<template>
  <div class="text-caption">Access Control List</div>
  <v-row dense no-gutters>
    <v-col>
      <v-select
        v-model="ACLMode"
        :items="aclmodes"
        item-title="title"
        item-value="value"
        variant="outlined"
        rounded="lg"
        density="compact"
        tile
        v-ripple
        color="#76FF03"
        @update:modelValue="apiChangeACLMode"
      >
      </v-select>
    </v-col>
  </v-row>

  <v-tabs v-model="tab" :items="tabs" align-tabs="start" slider-color="#76FF03" fixed-tabs>
    <template v-slot:tab="{ item }">
      <v-tab
        :prepend-icon="item.icon"
        :text="item.text"
        :value="item.value"
        color="#76FF03"
        class="text-none"
      ></v-tab>
    </template>

    <template v-slot:item="{ item }">
      <v-tabs-window-item value="tab-allow" class="pa-4">
        <v-card-subtitle class="d-flex justify-start">
          {{ $t('settings.security.authorization.allowlist') }}
        </v-card-subtitle>
        <br />
        <SecurityAllow />
      </v-tabs-window-item>

      <v-tabs-window-item value="tab-block" class="pa-4">
        <v-card-subtitle class="d-flex justify-start">
          {{ $t('settings.security.authorization.blocklist') }}
        </v-card-subtitle>
        <br />
        <SecurityBlock />
      </v-tabs-window-item>
    </template>
  </v-tabs>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useACL } from '@/composables/useACL';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();

  const tab = ref('tab-allow');
  const tabs = [
    {
      icon: 'mdi-check',
      text: t('settings.security.authorization.subtitle1'),
      value: 'tab-allow',
    },
    {
      icon: 'mdi-cancel',
      text: t('settings.security.authorization.subtitle2'),
      value: 'tab-block',
    },
  ];
  const aclmode = ref('none');
  const aclmodes = [
    { title: 'None', value: 'none' },
    { title: 'Allow List', value: 'allow' },
    { title: 'Block List', value: 'block' },
  ];
  const { ACLMode, getACLState, apiChangeACLMode } = useACL();

  onMounted(async () => {
    await getACLState();
  });
</script>
