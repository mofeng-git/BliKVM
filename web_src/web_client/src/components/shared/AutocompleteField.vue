<template>
  <v-field variant="plain" :label="label" active class="d-flex">
    <v-autocomplete
      :value="modelValue"
      :items="items"
      item-text="title"
      item-value="value"
      color="#76FF03"
      variant="plain"
      hide-details
      @update:modelValue="updateValue"
    >
      <!-- Customize dropdown items -->
      <template v-slot:default="{ item, index, props }">
        <v-list-item v-bind="props" :key="index">
          <v-list-item-content>
            <v-list-item-title>
              <!-- Add check icon next to the selected item -->
              <v-icon v-if="String(modelValue) === String(item.value)" class="me-2">
                mdi-check
              </v-icon>
              {{ item.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-autocomplete>

    <template #append-inner>
      <v-tooltip
        v-if="revertLastSaved"
        :text="$t('common.revertLastSaved')"
        location="bottom"
        content-class=""
      >
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props" @click="onRevert" color="#76FF03">mdi-refresh</v-icon>
        </template>
      </v-tooltip>
      <v-tooltip v-if="hint" :text="hint" location="bottom" content-class="">
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props" color="#76FF03">mdi-help</v-icon>
        </template>
      </v-tooltip>
    </template>
  </v-field>
</template>

<script setup>
  const props = defineProps({
    label: String,
    modelValue: [String, Number], // Allow for String or Number values
    items: Array,
    hint: String,
    revertLastSaved: Boolean,
  });

  const emit = defineEmits(['update:modelValue']);

  const updateValue = (value) => {
    console.log('Selected value (modelValue):', value); // Log modelValue
    emit('update:modelValue', value);
  };
</script>
