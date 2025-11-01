<template>
  <v-container class="d-flex flex-column fill-height pa-0 pa-md-4">
    <v-row dense no-gutters class="flex-grow-1" align="center" justify="center">
      <v-col cols="12" class="d-flex flex-column align-center">
        <v-sheet class="d-flex flex-column align-center bg-transparent" min-width="420">
          <v-img src="/bg-2.jpg" min-width="420" max-height="115" cover>
            <div class="text-h4 text-center mb-0 font-weight-medium" style="color: #76ff03">
              BliKVM Matrix
              <v-btn
                slim
                variant="tonal"
                color="#76FF03"
                rounded="lg"
                class="text-h6 text-start mb-4 font-weight-medium text-none version-btn"
              >
                {{ productVersion }}
              </v-btn>
            </div>

            <div class="text-h6 text-center mb-4 font-weight-medium subtitle-spacing">
              {{ $t('app.subtitle') }}
            </div>
          </v-img>

          <v-divider class="mb-6" />

          <div class="text-h5 text-center mb-4 font-weight-medium">
            {{ $t('login.loginAccount') }}
          </div>

          <!-- Security Notice - Only show when Code of Conduct is enabled and URL is set -->
          <v-alert
            v-if="misc.showCoc && misc.cocUrl"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-6"
            color="warning"
            max-width="420"
            width="100%"
          >
            <div class="text-subtitle-2 font-weight-bold mb-2">
              {{ $t('login.secureNotice1') }}
            </div>
            <div class="text-body-2">
              {{ $t('login.secureNotice2') }}
              <br />
              {{ $t('login.adhere') }}
              <a
                :href="misc.cocUrl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Digital Work Environment Code of Conduct (opens in new tab)"
                class="coc-link"
              >
                {{ $t('login.eCOC') }}
                <v-icon size="small" icon="mdi-open-in-new"></v-icon>
              </a>
              <br />
              <strong class="font-weight-bold"> {{ $t('login.forbidden') }} </strong>
            </div>
          </v-alert>
        </v-sheet>

        <v-form
          ref="loginForm"
          id="loginForm"
          autocomplete="on"
          method="post"
          @submit.prevent="handleLoginClick"
        >
          <v-sheet min-width="420" rounded="lg" class="pa-0">
          <v-text-field
            v-model="user"
            name="username"
            id="username"
            density="compact"
            flat
            :placeholder="$t('login.username')"
            type="text"
            rounded="lg"
            variant="solo"
            hide-details
            class="ma-0"
            :rules="[rules.required]"
            aria-label="Username"
            autocomplete="username"
            @keyup.enter="handleLoginClick"
          >
            <template #prepend-inner>
              <v-icon color="#76FF03" icon="mdi-account" />
            </template>
          </v-text-field>

          <v-text-field
            v-model="password"
            name="password"
            id="password"
            :append-inner-icon="visiblePassword ? 'mdi-eye-off' : 'mdi-eye'"
            density="compact"
            flat
            :placeholder="$t('login.password')"
            :type="visiblePassword ? 'text' : 'password'"
            rounded="lg"
            variant="solo"
            hide-details
            class="ma-0"
            :rules="[rules.password]"
            aria-label="Password"
            autocomplete="current-password"
            @click:append-inner="
              visiblePassword = !visiblePassword;
              if (visiblePassword) visibleUsername = false;
            "
            @keyup.enter="handleLoginClick"
          >
            <template #prepend-inner>
              <v-icon color="#76FF03" icon="mdi-lock" />
            </template>
          </v-text-field>

          <v-text-field
            density="compact"
            flat
            variant="solo"
            readonly
            :placeholder="$t('login.otp')"
            hide-details
            class="ma-0"
            tabindex="-1"
          >
            <template #prepend-inner>
              <v-icon color="#76FF03" icon="mdi-shield-lock" />
            </template>
          </v-text-field>

          <div class="pa-3 pt-1">
            <v-otp-input
              v-model="twoFaCode"
              :disabled="validating"
              density="compact"
              rounded="lg"
              variant="outlined"
              :color="isFocused ? '#76FF03' : undefined"
              @focus="isFocused = true"
              @blur="isFocused = false"
              @finish="handleLoginClick"
            >
            </v-otp-input>
          </div>
          <div class="px-3 pb-3">
            <v-btn
              block
              variant="tonal"
              class="text-none mt-2"
              color="#76FF03"
              rounded="lg"
              :loading="validating"
              type="submit"
            >{{ $t('login.login') }}</v-btn>
          </div>
          </v-sheet>
        </v-form>

        <v-sheet class="d-flex flex-column align-start bg-transparent" min-width="420">
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-2 mb-2"
            width="100%"
            max-width="420"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>

          
        </v-sheet>
      </v-col>
    </v-row>

    <v-footer class="bg-transparent py-2">
      <v-row justify="center" no-gutters>
        <v-col cols="auto">
          <p class="text-caption text-center ma-0 footer-text">
            &copy; 2019-{{ new Date().getFullYear() }} BliCube. All rights reserved worldwide.
          </p>
        </v-col>
      </v-row>
    </v-footer>
  </v-container>
</template>

<script setup>
  import http from '@/utils/http.js';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';

  const { proxy } = getCurrentInstance();
  const router = useRouter();
  const { t } = useI18n();

  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';
  import pkg from 'package';

  import Config from '@/config.js';

  const store = useAppStore();
  const { devices, loginDialog, misc, account, productVersion } = storeToRefs(store);

  const user = ref('');
  const password = ref('');
  const errorMessage = ref('');
  const validating = ref(false);
  const twoFaCode = ref(null);
  const visibleUsername = ref(false);
  const visiblePassword = ref(false);
  const isFocused = ref(false);

  // Validation rules
  const rules = {
    required: (value) => !!value || 'Username is required',
    password: (value) => !!value || 'Password is required',
  };

  const handleLoginClick = async () => {
    // Clear previous errors
    errorMessage.value = '';

    validating.value = true;

    try {
      const requestBody = {
        username: user.value,
        password: password.value,
        twoFaCode: twoFaCode.value,
      };
      const response = await http.post('/login', requestBody);

      if (response.data.code === 0) {
        // On successful login, initialize the app
        const token = response.data.data.token;
        account.value.user = response.data.data.username;
        account.value.userRole = response.data.data.role; // 用户角色

        localStorage.setItem('token', token);

        await store.initializeApp();

        // Redirect to the matrix
        console.log('Redirecting to /matrix...');

        router.push({ name: 'Matrix' }).catch((error) => console.log(error));

        loginDialog.value = false;
      } else {
        // Handle failed authentication
        console.log('Login failed. Please check your credentials:', response.data);
        errorMessage.value = proxy.$t('login.loginFailed');
      }
    } catch (error) {
      // Handle any errors that occurred during authentication

      console.error('An error occurred during authentication:', error);
      validating.value = false; // Reset the loading state
    } finally {
      validating.value = false;
    }
  };
</script>

<style scoped>
  .version-btn {
    margin-top: 25px;
    margin-left: -15px;
  }

  .subtitle-spacing {
    margin-top: -15px;
  }

  .coc-link {
    color: #76ff03;
    text-decoration: none;
  }

  .footer-text {
    color: #76ff03;
  }
</style>
