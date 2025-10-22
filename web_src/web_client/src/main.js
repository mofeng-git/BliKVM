
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
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import router from '@/router'
import http from '@/utils/http.js';

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

import { useAppStore } from '@/stores/stores';

const app = createApp(App);
registerPlugins(app);
const store = useAppStore();

async function initializeApp() {
  try {
    const response = await http.get('/auth/state');
    if (response.data.version !== null) {
      store.version = response.data.version;
    }
    if (response.data.data.auth === false) {
      router.push('/main');
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }

  app.mount('#app');
}

initializeApp();
