<template>
  <v-field variant="plain" :label="label" :variant="plain" active class="d-flex align-center">
    <v-radio-group
      :model-value="modelValue"
      :mandatory="mandatory"
      column
      class="ml-3 align-center"
      @update:model-value="updateValue"
    >
      <!--
            v-if="option.tooltip"
            -->
      <v-tooltip
        v-for="option in options"
        :key="option.value"
        :text="option.tooltip"
        location="bottom"
        content-class=""
      >
        <template v-slot:activator="{ props }">
          <v-radio
            v-bind="props"
            :label="option.label"
            :value="option.value"
            :disabled="option.disabled"
            color="#76FF03"
          >
            <template #label>
              <div>
                {{ option.label }}
                <div class="text-caption">
                  {{ option?.tooltip }}
                  <!-- Safely access tooltip -->
                </div>
              </div> </template
            >not
          </v-radio>
        </template>
      </v-tooltip>
    </v-radio-group>

    <template #append-inner>
      <!-- Tooltip for revertLastSaved -->
      <v-tooltip
        v-if="revertLastSaved"
        :text="$t('common.revertLastSaved')"
        location="bottom"
        content-class=""
      >
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props" @click="onRevert" color="#76FF03"> mdi-refresh </v-icon>
        </template>
      </v-tooltip>

      <!-- Tooltip for hint -->
      <v-tooltip v-if="hint" :text="hint" location="bottom" content-class="">
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props" color="#76FF03"> mdi-help </v-icon>
        </template>
      </v-tooltip>
    </template>
  </v-field>
</template>

<script setup>
  // TODO import { stringifyQuery } from "vue-router";

  const props = defineProps({
    label: String,
    modelValue: String,
    options: { type: Array, default: () => [] }, // Ensures `options` is never undefined
    hint: String,
    variant: String,
    revertLastSaved: Boolean,
  });

  const emit = defineEmits(['update:modelValue']);

  const updateValue = (value) => {
    emit('update:modelValue', value);
  };

  const onRevert = () => {
    // Handle revert logic here
  };
</script>
