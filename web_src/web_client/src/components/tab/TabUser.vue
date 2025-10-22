<!--
****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
****************************************************************************
-->
<template>
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom">

    <template v-slot:activator="{ props }">
      <v-btn icon class="toolbar-btn" size="30" v-bind="props">
        <v-icon class="toolbar-icon">mdi-account-key</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ $t('tab.user.tip') }} </v-tooltip>
      </v-btn>
    </template>

    <UiParentCard :title="`${$t('tab.user.version')} ${webversion}`" @mouseenter.stop @mousemove.stop @keydown.stop
      @keypress.stop @keyup.stop>

      <v-list-item @click="openSettingsDialog" color="secondary" rounded="md">
        <template v-slot:prepend>
          <SettingsIcon size="20" class="mr-2" />
        </template>
        <v-list-item-title class="text-subtitle-2"> {{ $t('tab.user.account_settings') }} </v-list-item-title>
      </v-list-item>

      <v-list-item @click="openTwoFaAuthDialog" color="secondary" rounded="md">
        <template v-slot:prepend>
          <TwoFactorAuthIcon size="20" class="mr-2" />
        </template>
        <v-list-item-title class="text-subtitle-2"> {{ $t('tab.user.two_factor_auth') }} </v-list-item-title>
      </v-list-item>


      <v-list-item @click="logout" color="secondary" rounded="md">
        <template v-slot:prepend>
          <LogoutIcon size="20" class="mr-2" />
        </template>
        <v-list-item-title class="text-subtitle-2"> {{ $t('tab.user.logout') }} </v-list-item-title>
      </v-list-item>

      <v-list-item @click="openDocs" color="secondary" rounded="md">
        <template v-slot:prepend>
          <BrandWikipediaIcon size="20" class="mr-2" />
        </template>
        <v-list-item-title class="text-subtitle-2"> {{ $t('tab.user.docs') }} </v-list-item-title>
      </v-list-item>

      <v-list-item @click="openDiscord" color="secondary" rounded="md">
        <template v-slot:prepend>
          <BrandDiscordIcon size="20" class="mr-2" />
        </template>
        <v-list-item-title class="text-subtitle-2"> {{ $t('tab.user.dsicord') }} </v-list-item-title>
      </v-list-item>

      <v-list-item @click="openIssue" color="secondary" rounded="md">
        <template v-slot:prepend>
          <BellQuestionIcon size="20" class="mr-2" />
        </template>
        <v-list-item-title class="text-subtitle-2"> {{ $t('tab.user.issue') }} </v-list-item-title>
      </v-list-item>

    </UiParentCard>
  </v-menu>

  <v-dialog v-model="isSettingsDialogOpen" persistent @keydown.stop @keyup.stop max-width="500px">
    <v-card>
      <v-card-title>{{ $t('tab.user.account_settings') }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" lg="6">
            <v-text-field color="primary" :label="$t('tab.user.new_username')" variant="outlined"
              v-model="nusername"></v-text-field>
          </v-col>
          <v-col cols="12" lg="6">
            <v-text-field color="primary" :label="$t('tab.user.current_password')" variant="outlined" type="password"
              v-model="cpassword"></v-text-field>
          </v-col>
          <v-col cols="12" lg="6">
            <v-text-field color="primary" :label="$t('tab.user.new_password')" variant="outlined" type="password"
              v-model="npassword"></v-text-field>
          </v-col>
          <v-col cols="12" lg="6">
            <v-text-field color="primary" :label="$t('tab.user.confirm_password')" variant="outlined" type="password"
              v-model="conpassword"></v-text-field>
          </v-col>
        </v-row>
        <div class="text-right mt-4">
          <v-btn color="primary" @click="changePassword">{{ $t('tab.user.change_password') }}</v-btn>
          <v-btn color="error" variant="text" class="ml-2" @click="clearFields">{{ $t('button.cancel') }}</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="changePasswordD" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">{{ $t('tab.user.user_setting') }}</v-card-title>
      <v-card-text>
        {{ changeMessage }}
      </v-card-text>

      <v-spacer></v-spacer>
      <v-btn color="blue-darken-1" variant="text" @click="close">{{ $t('button.cancel') }}</v-btn>
      <v-spacer></v-spacer>
    </v-card>
  </v-dialog>

  <v-dialog v-model="twoFaAuthDialog" persistent @keydown.stop @keyup.stop max-width="500px">
    <v-card>
      <v-row align="center">
        <v-col>
          <v-card-title>{{ $t('tab.user.two_factor_auth') }}</v-card-title>
        </v-col>
        <v-col class="d-flex justify-end">
          <v-chip :color="twoFAStateColor" class="ma-2">
            {{ twoFaState ? $t('label.enable') : $t('label.disable') }}
          </v-chip>
        </v-col>
      </v-row>
      <v-card-text>
        <h5 class="h5 mt-3">Scan the QR code</h5>
        <div class="color-fg-muted">
          Use an authenticator app or browser extension to scan.
          <a class="Link--secondary text-underline"
            href="https://docs.github.com/articles/configuring-two-factor-authentication" target="_blank"
            rel="noreferrer">Learn more about enabling 2FA</a>.
        </div>
        <img :src="twoFaAuthQrCode" alt="QR Code">

        <div class="color-fg-muted mb-4">
          Unable to scan? You can use the setup key({{ twoFaSecret }}) to manually configure your authenticator app.
        </div>

        <v-row>
          <v-col cols="12" lg="6">
            <v-text-field color="primary" :label="$t('tab.user.two_factor_code')" variant="outlined" v-model="twoFaCode"
              @input="validateInput"></v-text-field>
          </v-col>
        </v-row>

        <div class="button-container text-right mt-4">
          <v-btn class="mr-2" color="primary" @click="enableTwoFactorAuth" :disabled="twoFaState">{{ $t('tab.user.enable_two_factor')
            }}</v-btn>
          <v-btn class="mr-2" color="secondary" @click="disableTwoFactorAuth" :disabled="!twoFaState">{{ $t('tab.user.disable_two_factor')
            }}</v-btn>
          <v-btn color="error" @click="closeTwoFaAuthDialog">{{ $t('button.close') }}</v-btn>
        </div>

      </v-card-text>
    </v-card>
  </v-dialog>

</template>

<script setup>
import { ref,nextTick } from 'vue';
import { SettingsIcon, LogoutIcon, BrandDiscordIcon, BrandWikipediaIcon, BellQuestionIcon, TwoFactorAuthIcon } from 'vue-tabler-icons';
import http from '@/utils/http.js';
import { useAppStore } from '@/stores/stores';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const menu = ref(false);
const isSettingsDialogOpen = ref(false);
const store = useAppStore();
const { webversion } = storeToRefs(store);
const nusername = ref(store.username);
const cpassword = ref('');
const npassword = ref('');
const conpassword = ref('');
const changePasswordD = ref(false);
const changeMessage = ref('1');
let changeSuccessFlag = false;
const router = useRouter();
const twoFaAuthDialog = ref(false);
const twoFaSecret = ref('');
const twoFaState = ref(false);
const twoFaAuthQrCode = ref('');
const twoFaCode = ref('');

const openDiscord = () => {
  window.open('https://discord.com/invite/9Y374gUF6C', '_blank');
};

const openDocs = () => {
  window.open('https://wiki.blicube.com/blikvm/', '_blank');
};

const openIssue = () => {
  window.open('https://github.com/ThomasVon2021/blikvm/issues', '_blank');
};

const openSettingsDialog = () => {
  isSettingsDialogOpen.value = true;
};

const twoFAStateColor = computed(() => {
  return twoFaState.value === true ? 'success' : 'error';
});

const getTwoFaInfo = async () => {
  const requestBody = {
    username: nusername.value,
  };
  const response = await http.post('/2fa/info', requestBody);
  if (response.status === 200) {
    twoFaState.value = response.data.data.enable;
    twoFaSecret.value = response.data.data.secret;
    twoFaAuthQrCode.value = response.data.data.qrCode;
  }
};

const openTwoFaAuthDialog = async () => {
  twoFaAuthDialog.value = true;
  await getTwoFaInfo();
};

const closeTwoFaAuthDialog = () => {
  twoFaAuthDialog.value = false;
};

const validateInput = (event) => {
  const value = event.target.value;
  twoFaCode.value = value.replace(/[^0-9]/g, '');
};

const enableTwoFactorAuth = async () => {
  if (!twoFaCode.value) {
    return;
  }
  const requestBody = {
    username: store.username,
    code: twoFaCode.value,
  };
  const response = await http.post('/2fa?action=enable', requestBody);
  if (response.status === 200 && response.data.code === 0) {
    getTwoFaInfo();
  }
};

const disableTwoFactorAuth = async () => {
  const requestBody = {
    username: store.username,
    code: twoFaCode.value,
  };
  const response = await http.post('/2fa?action=disable', requestBody);
  if (response.status === 200 && response.data.code === 0) {
    getTwoFaInfo();
  }
};

const changePassword = async () => {
  if (!nusername.value || !cpassword.value || !npassword.value || !conpassword.value) {
    changeMessage.value = "Each parameter cannot be empty";
    changePasswordD.value = true;
    return;
  } else if (npassword.value !== conpassword.value) {
    changeMessage.value = "Two passwords do not match";
    changePasswordD.value = true;
    return;
  }
  const requestBody = {
    newUsername: nusername.value,
    newPassword: npassword.value
  };
  const response = await http.post('/account/update', requestBody);
  if (response.status === 200) {
    changeMessage.value = "change success!";
    changeSuccessFlag = true;
    changePasswordD.value = true;

  }
  isSettingsDialogOpen.value = false;
};

const clearFields = () => {
  isSettingsDialogOpen.value = false;
  cpassword.value = '';
  npassword.value = '';
  conpassword.value = '';
};

const close = () => {
  if (changeSuccessFlag === true) {
    changeSuccessFlag = false;
    router.push('/');
  }
  changePassword.value = false;
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  router.push('/');
};

</script>

<style scoped>
/* Add your custom styles here */
.button-container {
  display: flex;
  justify-content: space-between;
}

.button-container .v-btn {
  margin-right: 8px;
}

.button-container .v-btn:last-child {
  margin-right: 0;
}
</style>