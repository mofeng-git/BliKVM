<template>
  <v-field variant="plain" :label="label" active class="d-flex align-center">
    <v-switch
      v-bind="switchProps"
      :disabled
      :label="modelValue ? $t('label.yes') : $t('label.no')"
      hide-details
      color="#76FF03"
      inset
    />
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
    modelValue: Boolean,
    disabled: Boolean,
    hint: String,
    revertLastSaved: Boolean,
  });

  const emit = defineEmits(['update:modelValue']);

  const switchProps = computed(() => ({
    modelValue: props.modelValue,
    'onUpdate:modelValue': (value) => emit('update:modelValue', value),
  }));
</script>
