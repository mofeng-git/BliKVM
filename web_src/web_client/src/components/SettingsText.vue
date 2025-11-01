<template>
  <v-expansion-panel value="text">
    <v-expansion-panel-title>
      <template v-slot:default="{ expanded }">
        <v-card class="transparent-card" density="compact" tile width="100%">
          <v-row dense no-gutters>
            <v-col cols="1">
              <v-icon color="#B388FF">mdi-text</v-icon>
            </v-col>
            <v-col class="d-flex justify-start align-center" cols="6">
              {{ $t('settings.text.title') }}
            </v-col>
          </v-row>
          <v-row v-if="expanded" dense>
            <v-col cols="*">
              <v-card-subtitle>
                {{ $t('settings.text.subtitle') }}
              </v-card-subtitle>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-expansion-panels v-model="innerPanel" multiple>
        <v-expansion-panel value="paste" @keydown.stop @keyup.stop>
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-content-paste</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.text.paste.title') }}
                </v-col>
                <v-col
                  class="d-flex justify-end align-center"
                  :style="{
                    color: '#76FF03',
                  }"
                  ><v-chip>
                    {{ paste.selectedKeymap }}
                  </v-chip>
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <SettingsTextPaste />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="extract">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-text-recognition</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.text.extract.title') }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <SettingsTextExtract />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
  import { ref } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';
  import SettingsTextPaste from './SettingsTextPaste.vue';
  import SettingsTextExtract from './SettingsTextExtract.vue';

  const innerPanel = ref([]);
  const store = useAppStore();
  const { paste } = storeToRefs(store);
</script>

<style scoped></style>
