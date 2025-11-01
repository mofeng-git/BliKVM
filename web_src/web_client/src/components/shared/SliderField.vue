<template>
  <v-field variant="plain" :label="label" active class="align-center">
    <v-slider
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      show-ticks="always"
      tick-size="4"
      :thumb-size="25"
      hide-details
      color="#76FF03"
      class="ma-4"
      @update:model-value="updateValue"
    />

    <template #append-inner>
      <v-btn
        v-ripple
        :text="`${modelValue}`"
        class="text-none"
        label
        readonly
        variant="text"
        width="74"
      />

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
    modelValue: Number,
    min: {
      type: Number,
      default: 15,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      type: Number,
      default: 10,
    },
    hint: String,
    revertLastSaved: Boolean,
  });

  const emit = defineEmits(['update:modelValue', 'click:revert']);

  const updateValue = (value) => {
    emit('update:modelValue', value);
  };

  const onRevert = () => {
    emit('click:revert');
  };
</script>
