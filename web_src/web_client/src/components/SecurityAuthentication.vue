<template>
  <v-card-text class="text-medium-emphasis pa-6">
    <v-row dense no-gutters>
      <v-col cols="12">
        <label class="text-subtitle-1 font-weight-medium mb-2 d-block">
          {{ $t('settings.security.authentication.subtitle') }}
        </label>
        <v-btn-toggle
          v-model="security.authType"
          density="compact"
          rounded="lg"
          v-ripple
          color="#76FF03"
          variant="outlined"
          group
          mandatory
        >
          <v-btn value="disabled" @click.stop="apiAuthEnabled('disabled')"
            >{{ $t('common.disabled') }}
          </v-btn>
          <v-btn value="basic" @click.stop="apiAuthEnabled('basic')">{{
            $t('common.basic')
          }}</v-btn>
          <v-btn value="2FA">2FA</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-row v-if="security.authType === '2FA'" dense no-gutters>
      <v-col cols="12" class="d-flex justify-start align-center">
        <v-card>
          <br />
          <h3 class="text-h6">{{ $t('settings.security.authentication.2faTitle') }}</h3>
          <br />
          <v-stepper v-model="stepper" alt-labels minWidth="200">
            <template v-slot:default="{ prev, next }">
              <v-stepper-header>
                <v-stepper-item color="#76FF03" icon="mdi-qrcode-scan" :title="items[0]" :value="1">
                </v-stepper-item>
                <v-divider />

                <v-stepper-item
                  color="#76FF03"
                  icon="mdi-check-decagram-outline"
                  :title="items[1]"
                  :value="2"
                ></v-stepper-item>
                <v-divider />

                <v-stepper-item
                  color="#76FF03"
                  icon="mdi-shield-check-outline"
                  :title="items[2]"
                  :value="3"
                ></v-stepper-item>
                <v-divider />

                <v-stepper-item
                  color="#76FF03"
                  icon="mdi-close-circle-outline"
                  :title="items[3]"
                  :value="4"
                ></v-stepper-item>
                <v-divider />
              </v-stepper-header>

              <v-stepper-window>
                <v-stepper-window-item :value="1">
                  <v-card class="pa-4" min-width="100%">
                    <h3 class="text-h7 mb-3">
                      {{ $t('settings.security.authentication.2faScan') }}
                    </h3>
                    {{ $t('settings.security.authentication.2faScanHelp') }}
                    <div class="mb-3">
                      <v-img :src="twoFaAuthQrCode" alt="QR Code">
                        <!-- placeholder while loading -->
                        <template v-slot:placeholder>
                          <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular color="grey-lighten-4" indeterminate>
                              <template v-slot:default>
                                {{ $t('settings.security.authentication.2faLoading') }}
                              </template>
                            </v-progress-circular>
                          </div>
                        </template>

                        <!-- if an error occurs while loading image. -->
                        <template v-slot:error> </template>
                      </v-img>
                    </div>

                    <div class="text-caption mb-2">
                      {{ $t('settings.security.authentication.2faScanKeyHelp') }}
                      <br />
                      <code class="text-primary">{{ twoFaSecret }}</code>
                      <v-icon
                        size="small"
                        color="#76FF03"
                        @click="copyClipboard(twoFaSecret)"
                        class="ml-1"
                      >
                        mdi-content-copy
                      </v-icon>
                    </div>

                    <div class="text-caption">
                      <a
                        href="https://docs.github.com/articles/configuring-two-factor-authentication"
                        target="_blank"
                        rel="noreferrer"
                        class="text-decoration-underline"
                      >
                        {{ $t('settings.security.authentication.learnMore') }}
                      </a>
                    </div>
                  </v-card>
                </v-stepper-window-item>

                <v-stepper-window-item :value="2">
                  <v-card class="pa-4" max-height="200">
                    <h3 class="text-h7 mb-3">
                      {{ $t('settings.security.authentication.2faEnterCode') }}
                    </h3>

                    <v-otp-input
                      @keydown.stop
                      @keyup.stop
                      v-model="twoFaCode"
                      :disabled="validating"
                      density="compact"
                      rounded="lg"
                      variant="outlined"
                      :color="isFocused ? '#76FF03' : undefined"
                      clearable
                      focus-all
                      focused
                      @finish="validateInput"
                    >
                    </v-otp-input>
                  </v-card>
                </v-stepper-window-item>

                <v-stepper-window-item :value="3">
                  <v-card class="pa-4" max-height="100%">
                    <div class="text-center">
                      <v-icon color="#76FF03" size="48" class="mb-3"> mdi-shield-check </v-icon>
                      <h3 class="text-h6 mb-2">2FA is now active</h3>
                      <div class="text-body-2 text-medium-emphasis">
                        {{ $t('settings.security.authentication.2faFinishInfo') }}
                      </div>
                    </div>
                  </v-card>
                </v-stepper-window-item>

                <v-stepper-window-item :value="4">
                  <v-card class="pa-4" max-height="200">
                    <h3 class="text-h7 mb-3">
                      {{ $t('settings.security.authentication.2faDisabledInfo') }}
                    </h3>

                    <v-otp-input
                      @keydown.stop
                      @keyup.stop
                      v-model="twoFaCode"
                      :disabled="validating"
                      density="compact"
                      rounded="lg"
                      variant="outlined"
                      :color="isFocused ? '#76FF03' : undefined"
                      clearable
                      focus-all
                      focused
                      @finish="validateInput"
                    >
                    </v-otp-input>
                  </v-card>
                </v-stepper-window-item>
              </v-stepper-window>

              <v-stepper-actions
                :disabled="disabled"
                color="#76FF03"
                @click:next="next"
                @click:prev="prev"
              ></v-stepper-actions>
            </template>
          </v-stepper>
        </v-card>
      </v-col>
    </v-row>

    <v-row dense no-gutter v-if="isExperimental">
      <v-col cols="12">
        <v-field
          variant="plain"
          :label="$t('settings.security.authentication.ssh.publicKeyfield')"
          active
          class="align-center"
        >
          <v-textarea
            :model-value="sshPublicKey"
            rows="3"
            variant="outlined"
            v-ripple
            color="#76FF03"
          ></v-textarea>
        </v-field>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script setup>
  import { onMounted } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useClipboard } from '@/composables/useClipboard.js';
  import { useAuthentication } from '@/composables/useAuthentication';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  const store = useAppStore();
  const { copyClipboard } = useClipboard();
  const { security, isExperimental } = storeToRefs(store);
  const {
    stepper,
    getTwoFaInfo,
    apiAuthEnabled,
    twoFaSecret,
    twoFaAuthQrCode,
    enableTwoFactorAuth,
    disableTwoFactorAuth,
  } = useAuthentication();

  const items = [
    t('settings.security.authentication.setup'),
    t('settings.security.authentication.verify'),
    t('settings.security.authentication.complete'),
    t('settings.security.authentication.disable'),
  ];
  const steps = ref(3);
  const twoFaCode = ref('');
  const validating = ref(false);
  const isFocused = ref(false);

  const disabled = computed(() => {
    if (stepper.value === 1) return 'prev';
    if (stepper.value === 2 && !security.value.is2FaEnabled) return 'next'; // Block next if OTP invalid
    if (stepper.value === steps.value) return 'prev';
    return undefined;
  });

  const sshPublicKey = '';

  // OTP validation function
  const validateInput = async (value) => {
    // Check if OTP is 6 digits
    if (!value || value.length !== 6) {
      return;
    }

    // Check if all characters are numbers
    if (!/^\d{6}$/.test(value)) {
      return;
    }

    try {
      validating.value = true;

      // Replace this with your actual API call to validate the OTP
      if (stepper.value === 2) {
        await enableTwoFactorAuth(value);
      } else if (stepper.value === 4) {
        await disableTwoFactorAuth(value);
      }
    } catch (error) {
      console.error('Error validating OTP:', error);
      // Handle error (e.g., show an error message)
    } finally {
      validating.value = false;
    }
  };

  const computedAuthType = computed(() => {
    if (!security.value.isAuthEnabled) return 'disabled';
    if (security.value.isAuthEnabled && !security.value.is2FaEnabled) return 'basic';
    return '2FA';
  });

  watch(
    computedAuthType,
    (val) => {
      security.value.authType = val;
    },
    { immediate: true }
  );

  onMounted(async () => {
    await getTwoFaInfo();
  });
</script>
