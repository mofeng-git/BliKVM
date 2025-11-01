<template>
  <v-field variant="outlined" :label="label" active rounded="lg" color="#76FF03" class="d-flex">
    <v-text-field
      :value="modelValue"
      density="compact"
      rounded="lg"
      ripple="true"
      color="#76FF03"
      :type="type"
      :readonly
      :placeholder="placeholder"
      variant="z"
      hide-details
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
    modelValue: String,
    type: String,
    readonly,
    placeholder: String,
    hint: String,
    revertLastSaved: Boolean,
  });

  const emit = defineEmits(['update:modelValue']);

  const updateValue = (value) => {
    emit('update:modelValue', value);
  };
</script>
