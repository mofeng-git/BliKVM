<!--   :to="rpath(`/getting-started/release-notes/?version=v${version}`)"-->
<template>
  <AppListLinkListItem
    :label="t('latest-release')"
    :title="`${productVersion}`"
    append-icon="mdi-page-next"
    prepend-icon="mdi-tag-outline"
    @click="onClick"
  />
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const store = useAppStore();
  const { productVersion } = storeToRefs(store);
</script>
