'use strict';

import { ref, onMounted } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

export function useTab() {
  const store = useAppStore();
  const { selectedTab } = storeToRefs(store);

  const tabs = ref([]);

  const selectTab = (tabIndex) => {
    selectedTab.value = tabIndex;
  };

  onMounted(async () => {
    try {
      const response = await fetch('/data/tabs.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch tabs: ${response.statusText}`);
      }

      const tabsData = await response.json();

      if (!tabsData || !Array.isArray(tabsData)) {
        throw new Error('Invalid tabs data structure');
      }

      tabs.value = tabsData;

      for (const tab of tabsData) {
        let componentModule;

        if (tab && tab.component) {
          try {
            if (tab.type === 'tab') {
              //           console.log(`Loading tab component: ${tab.component}`);
              componentModule = await import(`@/components/tab/${tab.component}.vue`);
            } else if (tab.type === 'menu') {
              //      console.log(`Loading menu component: ${tab.component}`);
              componentModule = await import(`@/components/menu/${tab.component}.vue`);
            }

            if (componentModule && componentModule.default) {
              tab.component = componentModule.default;
            } else {
              throw new Error(`Failed to load component: ${tab.component}`);
            }
          } catch (error) {
            console.error(`Error loading component ${tab.component}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  return {
    tabs,
    selectedTab,
    selectTab,
  };
}
