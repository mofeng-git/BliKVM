<template>
  <v-navigation-drawer v-if="settings.isVisible" permanent width="500">
    <!-- HEADER SECTION background-image: url('/bg-2.jpg'); background-size: cover; -->
    <template #prepend>
      <v-img src="/bg-2.jpg">
        <div class="text-h4 text-center mb-0 font-weight-medium" style="color: #76ff03">
          BliKVM Matrix
          <v-btn
            slim
            variant="tonal"
            color="#76FF03"
            rounded="lg"
            class="text-h6 text-start mb-4 font-weight-medium text-none"
            style="margin-top: 25px; margin-left: -15px"
          >
            {{ productVersion }}
          </v-btn>
        </div>

        <div class="text-h6 text-center mb-4 font-weight-medium" style="margin-top: -15px">
          {{ $t('app.subtitle') }}
        </div>

        <div class="d-flex ga-0 align-end" style="height: 100px">
          <v-tabs v-model="tab" density="compact" hide-slider class="align-self-end">
            <v-tab value="configuration" color="#76FF03">
              <v-icon icon="mdi-cog-outline" />&nbsp;
              {{ $t('settings.title') }}
            </v-tab>
          </v-tabs>
        </div>
      </v-img>
    </template>

    <!-- SCROLLABLE SECTION -->
    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="configuration">
        <Settings />
      </v-tabs-window-item>
    </v-tabs-window>

    <template #append>
      <v-divider />

      <div class="d-flex pa-4 ga-2 justify-start align-center justify-space-around">
        <v-tooltip v-for="(item, i) in appendItems" :key="i" location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              height="32"
              :icon="item.icon"
              rounded="lg"
              size="small"
              variant="text"
              width="32"
              @click="item.onClick"
            >
              <v-icon color="#76FF03" />
            </v-btn>
          </template>
          <span class="custom-tooltip">{{ item.tooltip }}</span>
        </v-tooltip>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { useSessionUtils } from '@/composables/useSessionUtils';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import pkg from 'package';

  const store = useAppStore();
  const { device } = useDevice();
  const { inactivateDevice } = useSessionUtils(device);
  const router = useRouter();
  const { t } = useI18n();

  const { settings, showManageAccountDialog, showAboutPageDialog, productVersion } =
    storeToRefs(store);

  const tab = ref('');
  const handleAccountClick = () => {
    showManageAccountDialog.value = true;
  };

  const handleAboutClick = () => {
    showAboutPageDialog.value = true;
  };

  const handleLogoutClick = () => {
    inactivateDevice();
    router.push('/');
  };

  const appendItems = [
    {
      icon: 'mdi-account',
      tooltip: t('account.title'),
      onClick: handleAccountClick,
    },
    {
      icon: 'mdi-information-outline',
      tooltip: t('appFooter.about'),
      onClick: handleAboutClick,
    },
    {
      icon: 'mdi-logout',
      tooltip: t('login.logout'),
      onClick: handleLogoutClick,
    },
  ];
</script>
