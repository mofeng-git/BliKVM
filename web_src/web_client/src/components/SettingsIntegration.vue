<template>
  <v-expansion-panel value="integration">
    <v-expansion-panel-title>
      <template v-slot:default="{ expanded }">
        <v-card class="transparent-card" density="compact" tile width="100%">
          <v-row dense no-gutters>
            <v-col cols="1">
              <v-icon color="#26A69A">mdi-api</v-icon>
            </v-col>
            <v-col class="d-flex 3rt align-center" cols="6">
              {{ $t('settings.integrations.title') }}
            </v-col>
          </v-row>
          <v-row v-if="expanded" dense>
            <v-col cols="*">
              <v-card-subtitle>
                {{ $t('settings.integrations.subtitle') }}
              </v-card-subtitle>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-expansion-panels v-model="innerPanel" multiple>
        <v-expansion-panel value="integration-prometheus" @group:selected="apiPrometheusState">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-export</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.integrations.prometheus.title') }}
                </v-col>
                <v-col
                  class="d-flex justify-end align-center"
                  :style="{
                    color: '#76FF03',
                  }"
                >
                  {{ prometheusActiveValue ? $t('common.active') : $t('common.inactive') }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-switch
                    v-model="prometheusActiveValue"
                    inset
                    @update:modelValue="apiPrometheusActive"
                    :label="$t('settings.integrations.prometheus.isActiveField')"
                    :disabled="!device.api.prometheus.endpoint"
                    v-ripple
                    color="#76FF03"
                  />
                </v-col>
              </v-row>

              <div class="text-caption">
                {{ $t('settings.integrations.prometheus.endpointField') }}
              </div>
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-text-field
                    v-model="device.api.prometheus.endpoint"
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    variant="outlined"
                    hide-details
                    single-line
                    @keydown.stop
                    @keyup.stop
                    readonly
                  >
                    <template #append>
                      <v-btn
                        color="#76FF03"
                        icon="mdi-content-copy"
                        size="small"
                        variant="plain"
                        :disabled="!device.api.prometheus.endpoint"
                        @click="copyClipboard(device.api.prometheus.endpoint)"
                      />
                    </template>
                  </v-text-field>
                </v-col>
              </v-row>
              <br />
              <br />
              <!-- <v-row dense no-gutters>
                      <v-col cols="*">
                        <v-field variant="plain" :label="$t('device.api.prometheus.refreshIntervalField')
                          " active class="align-center">
                          <v-slider v-model="device.api.prometheus.refreshInterval" max="60" min="0" step="5"
                            show-ticks="always" tick-size="2" v-ripple color="#76FF03" track-fill-color="#76FF03">
                            <template v-slot:append>
                              <v-text-field v-model="device.api.prometheus.refreshInterval" density="compact"
                                rounded="lg" v-ripple color="#76FF03" style="width: 96px" type="number" suffix="sec"
                                variant="outlined" hide-details single-line></v-text-field>
                            </template>
                          </v-slider>
                        </v-field>
                      </v-col>
                    </v-row> -->
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="integration-snmp" v-if="isExperimental">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-radar</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.integrations.snmp.title') }}
                </v-col>
                <v-col
                  class="d-flex justify-end align-center"
                  :style="{
                    color: '#76FF03',
                  }"
                >
                  {{ device.api.snmp.isEnabled ? 'enabled' : 'disabled' }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <v-row dense no-gutters>
                <v-col cols="*">
                  <switchField
                    v-model="device.api.snmp.isEnabled"
                    :label="$t('settings.integrations.snmp.isEnabledField')"
                  />
                </v-col>
              </v-row>
              <br />
              <div class="text-caption">
                {{ $t('settings.integrations.snmp.snmpVersionField') }}
              </div>
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-select
                    v-model="device.api.snmp.snmpVersion"
                    :items="['2c', '3']"
                    variant="outlined"
                    rounded="lg"
                    density="compact"
                    tile
                    v-ripple
                    color="#76FF03"
                    :hint="$t('settings.integrations.snmp.snmpVersionHelp')"
                  >
                  </v-select>
                </v-col>
              </v-row>
              <div class="text-caption">
                {{ $t('settings.integrations.snmp.snmpCommunityStringField') }}
              </div>
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-text-field
                    v-model="device.api.snmp.snmpCommunityString"
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    variant="outlined"
                    hide-details
                    single-line
                    clearable
                  ></v-text-field>
                </v-col>
              </v-row>
              <br />
              <div class="text-caption">
                {{ $t('settings.integrations.snmp.snmpHostnameField') }}
              </div>
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-text-field
                    v-model="device.api.snmp.snmpHostname"
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    variant="outlined"
                    hide-details
                    single-line
                    clearable
                  ></v-text-field>
                </v-col>
              </v-row>
              <br />
              <v-row dense no-gutters>
                <v-col cols="*">
                  <div class="text-caption">
                    {{ $t('settings.integrations.snmp.snmpOidField') }}
                  </div>
                  <v-text-field
                    v-model="device.api.snmp.snmpid"
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    variant="outlined"
                    hide-details
                    single-line
                    clearable
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="integration-webhook" v-if="isExperimental">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-triangle-outline</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.integrations.webhook.webhookField') }}
                </v-col>
                <v-col
                  class="d-flex justify-end align-center"
                  :style="{
                    color: '#76FF03',
                  }"
                >
                  {{ webhookList.items.length }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <template v-if="webhookList.items.length > 0 && !isAdding">
                <template v-for="(item, index) in webhookList.items" :key="item.url">
                  <br />
                  <div class="text-caption">
                    {{ $t('settings.integrations.webhook.endpointEventField') }}
                  </div>
                  <!-- Event Selection Dropdown -->
                  <v-row dense no-gutters>
                    <v-col cols="*">
                      <v-select
                        v-model="item.event"
                        :items="webhookList.events"
                        item-title="description"
                        item-value="event"
                        variant="outlined"
                        rounded="lg"
                        density="compact"
                        tile
                        v-ripple
                        color="#76FF03"
                        :hint="$t('settings.integrations.webhook.endpointEventHelp')"
                      >
                      </v-select>
                    </v-col>
                  </v-row>

                  <!-- Name Input Field -->
                  <div class="text-caption">
                    {{ $t('settings.integrations.webhook.endpointNameField') }}
                  </div>
                  <v-row dense no-gutters>
                    <v-col cols="*">
                      <v-text-field
                        v-model="item.name"
                        density="compact"
                        rounded="lg"
                        v-ripple
                        color="#76FF03"
                        variant="outlined"
                        hide-details
                        single-line
                        clearable
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <br v-if="index < webhookList.items.length" />
                  <!-- URL Input Field -->
                  <v-row dense no-gutters>
                    <v-col cols="*">
                      <div class="text-caption">
                        {{ $t('settings.integrations.webhook.endpointURLField') }}
                      </div>
                      <v-text-field
                        v-model="item.url"
                        density="compact"
                        rounded="lg"
                        v-ripple
                        color="#76FF03"
                        variant="outlined"
                        hide-details
                        single-line
                        clearable
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </template>
              </template>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
  import { onMounted } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice.js';
  import { usePrometheus } from '@/composables/usePrometheus.js';
  import { useClipboard } from '@/composables/useClipboard.js';

  const store = useAppStore();
  const { device } = useDevice();
  const innerPanel = ref([]);
  const { isExperimental } = storeToRefs(store);
  const { prometheusActiveValue, apiPrometheusState, apiPrometheusActive } = usePrometheus();
  const { copyClipboard } = useClipboard();

  onMounted(() => {});
</script>
