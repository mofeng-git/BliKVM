/*****************************************************************************
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
*****************************************************************************/
/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App
 */

// Plugins
import { createApp } from 'vue';
import App from './App.vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { registerPlugins } from '@/plugins';
import { updateAbilityForRole } from '@/plugins';
import http from '@/utils/http.js';
import router from '@/router';

const app = createApp(App);
registerPlugins(app);

(async () => {
  // Ensure the store is initialized before subscribing to changes
  const store = useAppStore();

  // const { account, security } = storeToRefs(store);
  // console.log(account.value.userRole);

  // if (account.value.userRole) {
  //   updateAbilityForRole(account.value.userRole); // Only call this if the role is valid
  // } else {
  //   console.error("User role is undefined or invalid");
  // }

  try {
    const response = await http.get('/auth/state');
    if (response.data.version !== null) {
      store.productVersion = response.data.data.productVersion;
      store.serverVersion = response.data.data.serverVersion;
    }
    if (response.data.data.boardType) {
      store.devices.board.type = response.data.data.boardType;
    }
    if (response.data.data.codeOfConductIsActive) {
      store.misc.showCoc = response.data.data.codeOfConductIsActive;
      store.misc.cocUrl = response.data.data.codeOfConductUrl;
    }
    if (response.data.data.auth === false) {
      store.security.isAuthEnabled = false;
      await store.initializeApp();
      router.push({ name: 'Matrix' }).catch((error) => console.log(error));
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }

  function setVh() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }
  window.addEventListener('resize', setVh);
  setVh();
  app.mount('#app');
})();
