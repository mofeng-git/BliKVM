<template>
  <AppListLinkListItem
    :href="`https://github.com/blikvm/blikvm/commit/${commitLatestSha}`"
    :label="t('latest-commit')"
    :title="commitLatestSha.slice(0, 7)"
    append-icon="mdi-open-in-new"
    min-width="90"
    prepend-icon="mdi-source-commit"
    rel="noopener noreferrer"
    target="_blank"
  />
</template>

<script setup>
  import { useI18n } from 'vue-i18n';
  //   const commits = useCommitsStore()
  const { t } = useI18n();

  const commitLatestSha = ref('sdfdsf');

  onBeforeMount(() => {
    //     if (!commits.latest) commits.fetch()
  });
</script>
