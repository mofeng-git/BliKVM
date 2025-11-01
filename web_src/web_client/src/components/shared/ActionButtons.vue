<template>
  <v-card-actions class="floating-buttons">
    <!-- <v-btn @click="onResetClick" color="red">
      <template #prepend>
        <v-icon>mdi-information</v-icon>
      </template>
      {{ $t("button.resetDefaults") }}
    </v-btn> -->
    <v-btn color="#76FF03" @click="onCancelClick">{{ $t('common.close') }}</v-btn>
    <v-btn color="#76FF03" @click="onOkClick">{{ $t('common.ok') }}</v-btn>
  </v-card-actions>
</template>

<script setup>
  const emit = defineEmits(['onReset', 'onOk', 'onCancel']); // Define the event that you want to emit

  const onResetClick = () => {
    emit('onReset');
  };

  const onOkClick = () => {
    emit('onOk');
  };

  const onCancelClick = () => {
    emit('onCancel');
  };
</script>
