
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
    <div class="login">
        <div class="blue-background text-center">
            <div class="content">
                <h2>BliKVM Matrix</h2>
                <h5>v{{ store.version }} Alpha release</h5>
                <h5>Powered by BliCube 2019-present</h5>
                <h5>All rights reserved worldwide</h5>
            </div>
            <v-dialog v-model="openWindowLogin" persistent>
                <v-container>
                    <v-row justify="center">
                        <v-col cols="12" sm="8" md="6" lg="4">
                            <v-card class="pa-12 pb-8" elevation="8" rounded="lg">
                                <div class="text-subtitle-1 text-medium-emphasis">{{ $t('login.username') }}</div>
    
                                <v-text-field v-model="user" density="compact" :placeholder="$t('login.username_placeholder')"
                                    prepend-inner-icon="mdi-email-outline" variant="outlined" @keyup.enter="handleLoginClick"
                                    @input="clearErrorMessage"></v-text-field>
    
                                <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between">
                                    {{ $t('login.password') }}
                                </div>
    
                                <v-text-field v-model="password" :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                                    :type="visible ? 'text' : 'password'" density="compact" :placeholder="$t('login.password_placeholder')"
                                    prepend-inner-icon="mdi-lock-outline" variant="outlined"
                                    @click:append-inner="visible = !visible" @keyup.enter="handleLoginClick"
                                    @input="clearErrorMessage"></v-text-field>
    
                                <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between">
                                    {{ $t('login.two_fa_code') }}
                                </div>

                                <v-text-field v-model="twoFaCode" :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                                    :type="visible ? 'text' : 'password'" density="compact" :placeholder="$t('login.two_fa_code_placeholder')"
                                    prepend-inner-icon="mdi-lock-outline" variant="outlined"
                                    @click:append-inner="visible = !visible" @keyup.enter="handleLoginClick"
                                    @input="clearErrorMessage"></v-text-field>

                                <v-card v-if="errorMessage" class="mb-12" color="surface-variant" variant="tonal">
                                    <v-card-text class="text-medium-emphasis text-caption">
                                        {{ $t('label.warning') }}:<div class="warning">{{ errorMessage }}</div>
                                    </v-card-text>
                                </v-card>
    
                                <v-btn :loading="validating" block class="mb-8" color="blue" size="large" variant="tonal"
                                    @click="handleLoginClick">
                                    {{ $t('login.login') }}
                                </v-btn>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-container>
            </v-dialog>
        </div>
    </div>
</template>
  
<script setup>
import { ref, shallowRef, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import http from '../utils/http.js'; 
import { useAppStore } from '@/stores/stores';

const router = useRouter();
const openWindowLogin = ref(true);
const visible = ref(false);
const validating = shallowRef(false);
const errorMessage = ref('');
const user = ref(null);
const password = ref(null);
const { proxy } = getCurrentInstance();
const store = useAppStore();
const twoFaCode = ref(null);

const handleLoginClick = async () => {
    // TODO v-btn :loading
    validating.value = true;

    try {

        const requestBody = {
            username: user.value,
            password: password.value,
            twoFaCode: twoFaCode.value
        };
        const response = await http.post('/login', requestBody);
        if (response.data.code === 0) {

            // Redirect to the main page
            console.log('Redirecting to the main page...');
            router.push('/main');
            const token = response.data.data.token;
            store.username = response.data.data.username;
            localStorage.setItem('token', token);
            localStorage.setItem('username', store.username);
            // Update the value of openWindowLogin
            openWindowLogin.value = false;
        } else {
            // Handle failed authentication
            console.log('Login failed. Please check your credentials:',response.data);
            // Optionally, set an error message for the user
            errorMessage.value = proxy.$t(response.data.msg);
        }
    } catch (error) {
        // Handle any errors that occurred during authentication
        console.error('An error occurred during authentication:', error);
        validating.value = false; // Reset the loading state
    } finally {
        validating.value = false;
    }
};

const clearErrorMessage = () => {
  errorMessage.value = '';
};

// Lifecycle hook: onMounted
onMounted(() => {
    console.log('LoginPage mounted');
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
        proxy.$i18n.locale = savedLanguage;
    }
});
</script>
  
<style scoped>
html,
body,
#app {
    height: 100%;
    margin: 0;
}

.login {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
}

.content {
    text-align: left;
    color: white;
    margin-left: 80px;
    /* Adjust the margin-left value as desired */
}

.blue-background {
    flex: 1;
    background-color: rgb(0, 162, 255);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
}

.text-medium-emphasis {
    color: #333;
    /* Adjust the color as needed for better visibility */
}

.warning {
    color: red;
}
</style>
