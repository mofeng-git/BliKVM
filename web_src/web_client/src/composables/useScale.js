'use strict';

import { ref } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

export function useScale() {
  const store = useAppStore();
  const { scale } = storeToRefs(store);

  let lastValidScale = ref(scale); // To keep track of the last valid scale value

  const scalingItems = ref([
    { title: '100', value: 100 },
    { title: '125', value: 125 },
    { title: '150', value: 150 },
    { title: '175', value: 175 },
    { title: '200', value: 200 },
    { title: '250', value: 250 },
    { title: '300', value: 300 },
    { title: '500', value: 500 },
  ]);

  const handleScaleChange = (value) => {
    scale.value = value;
    lastValidScale.value = value; // Update the last valid scale when selecting from the list
  };

  return {
    scalingItems,
    handleScaleChange,
  };
}
