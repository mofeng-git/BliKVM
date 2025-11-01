'use strict';

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();

export function useJiggler(device) {
  const { t } = useI18n();

  const jigglerIntervalList = computed(() => [
    {
      interval: 15,
      text: 'Every 15 sec',
      color: '#76FF03',
      tooltip: t('Every 15 seconds'),
    },
    {
      interval: 120,
      text: 'Every 2 minutes',
      color: '#76FF03',
      tooltip: t('Every 2 minutes'),
    },
    {
      interval: -1,
      text: 'Off',
      color: '#76FF03',
      tooltip: t('Off'),
    },
  ]);

  const setInterval = (interval) => {
    device.value.hid.mouse.jigglerInterval = interval;
  };

  return {
    jigglerIntervalList,
    setInterval,
  };
}
