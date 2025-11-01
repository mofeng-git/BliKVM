<template>
  <v-field variant="plain" :label="label" active class="d-flex">
    <component
      :is="fieldType"
      :value="modelValue"
      v-bind="fieldProps"
      @update:modelValue="updateValue"
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
    modelValue: [String, Number, Boolean, Array],
    fieldType: {
      type: String,
      required: true,
    },
    fieldProps: Object,
    hint: String,
    revertLastSaved: Boolean,
  });

  const emit = defineEmits(['update:modelValue']);

  const updateValue = (value) => {
    emit('update:modelValue', value);
  };
</script>
