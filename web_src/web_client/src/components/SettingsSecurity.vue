<template>
  <v-expansion-panel value="security">
    <v-expansion-panel-title>
      <template v-slot:default="{ expanded }">
        <v-card class="transparent-card" density="compact" tile width="100%">
          <v-row dense no-gutters>
            <v-col cols="1">
              <v-icon color="#D32F2F">mdi-security</v-icon>
            </v-col>
            <v-col class="d-flex justify-start align-center" cols="4">
              {{ $t('settings.security.title') }}
            </v-col>
          </v-row>
          <v-row v-if="expanded" dense>
            <v-col cols="*">
              <v-card-subtitle>
                {{ $t('settings.security.subtitle') }}
              </v-card-subtitle>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-expansion-panels v-model="innerPanel" multiple>
        <v-expansion-panel value="security-authorization">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-check-circle-outline</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.security.authorization.title') }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <SecurityAuthorization />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="security-authentication">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-key-variant</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.security.authentication.title') }}
                </v-col>
                <v-col
                  class="d-flex justify-end align-center"
                  :style="{
                    color: '#76FF03',
                  }"
                  ><v-chip>
                    {{ security.authType }}
                  </v-chip>
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <SecurityAuthentication />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="security-session">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-cogs</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="6">
                  {{ $t('settings.security.sessionMgmnt.title') }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <!-- <v-row dense no-gutters>
                                <v-col cols="12">
                                    <label class="text-subtitle-1 font-weight-medium mb-2 d-block">
                                        {{
                                            $t("settings.security.session.isAutoLogoutField")
                                        }}</label>
                                    <switchField v-model="security.session.isAutoLogout" />
                                </v-col>
                            </v-row>
                            <br /> -->
              <Vpn />
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="security-iam" v-if="isExperimental">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-identifier</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="10">
                  Identity and Access Management (IAM)
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-select
                    v-model="security.iam.system"
                    :items="['FreeIPA']"
                    variant="outlined"
                    rounded="lg"
                    tile
                    :label="$t('settings.security.iam.systemField')"
                  >
                  </v-select>
                </v-col>
              </v-row>

              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-checkbox
                    v-for="item in security.iam.authMethods"
                    :key="item"
                    v-model="security.iam.authMethod"
                    :label="item"
                    :value="item"
                    color="#76FF03"
                  ></v-checkbox>
                </v-col>
              </v-row>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="reset">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-card class="transparent-card" density="compact" tile width="100%">
                <v-row no-gutters class="d-flex justify-start align-center">
                  <v-col cols="1">
                    <v-icon>mdi-refresh</v-icon>
                  </v-col>
                  <v-col class="d-flex justify-start align-center" cols="auto">
                    {{ $t('settings.security.reset.title') }}
                  </v-col>
                  <v-col class="d-flex justify-end align-center">
                    <v-btn
                      flat
                      variant="tonal"
                      color="#D32F2F"
                      rounded="lg"
                      v-ripple
                      tile
                      @click.stop="handleResetConfig"
                      >{{ $t('settings.security.reset.resetConfig') }}
                    </v-btn>
                  </v-col>
                  <v-col v-if="expanded" cols="auto">
                    <v-card-subtitle class="subtitle-text">
                      {{ $t('settings.security.reset.subtitle') }}
                    </v-card-subtitle>
                  </v-col>
                </v-row>
              </v-card>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <v-row dense no-gutters class="d-flex justify-start align-center">
                <v-col cols="*">
                  <v-switch
                    v-model="retainCredentialsValue"
                    inset
                    :label="$t('settings.security.reset.retainPasswordField')"
                    v-ripple
                    color="#76FF03"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useConfig } from '@/composables/useConfig';
  import { ref, onMounted } from 'vue';
  import { useAuthentication } from '@/composables/useAuthentication';

  const store = useAppStore();
  const { security, isExperimental } = storeToRefs(store);
  const innerPanel = ref([]);
  const { retainCredentialsValue, apiResetConfig } = useConfig();
  const { apiGetAuthState } = useAuthentication();

  const handleResetConfig = () => {
    apiResetConfig();
  };

  onMounted(() => {
    apiGetAuthState();
  });
</script>

<style scoped></style>
