<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn class="scale-button" v-bind="props">
        <div class="scale-container">
          <v-text-field
            v-model="scale"
            variant="plain"
            active
            type="number"
            hide-spin-buttons
            :min="scalingItems[scalingItems.length - 1].value"
            :max="scalingItems[0].value"
          >
            <template #append-inner>
              <span class="scale-suffix">%</span>
              <v-icon class="scale-icon" size="18">mdi-chevron-down</v-icon>
            </template>
          </v-text-field>
        </div>
      </v-btn>
    </template>

    <v-list>
      <v-list-item
        v-for="(item, index) in scalingItems"
        :key="index"
        @click="handleScaleChange(item.value)"
      >
        <div class="item-wrapper">
          <div v-if="scale === item.value" class="border-indicator"></div>
          <div :class="{ 'selected-item-inner': scale !== item.value }" class="item-content">
            <v-list-item-title>{{ item.title }}%</v-list-item-title>
          </div>
        </div>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useScale } from '@/composables/useScale';

  const store = useAppStore();
  const { scale } = storeToRefs(store);

  const { scalingItems, handleScaleChange } = useScale();
</script>

<style scoped>
  .pa-4 {
    padding: 16px;
  }

  .scale-button {
    top: -14px;
    align-items: center; /* Aligns all children elements (text, icons) vertically */
  }

  .scale-icon {
    top: 4px;
    align-items: center; /* Aligns all children elements (text, icons) vertically */
  }

  .scale-input {
    margin-right: 0; /* Ensure no extra margin is added */
    padding-right: 0; /* Reduce padding to tighten the space */
  }

  .scale-suffix {
    font-size: 1rem;
    display: inline-block;
    margin-left: -24px; /* Reduce the gap between the number and the percentage sign */
    vertical-align: middle; /* Aligns with the input text */
  }

  .border-indicator {
    width: 4px;
    height: 75%;
    background-color: #2196f3;
    position: absolute;
    left: 0;
    top: 15%;
  }

  .item-content {
    flex: 1;
    display: flex;
    align-items: center;
    padding-left: 8px;
    /* Prevents overlap with the border */
    position: relative;
  }

  .selected-item-inner {
    width: 100%;
    display: flex;
    justify-content: start;
    background-color: transparent;
  }
</style>
