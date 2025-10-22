
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

<!-- Material Design Icons: https://pictogrammers.com/library/mdi/ -->
<template>
    <v-app-bar v-if="showAppBar" height="40" color="#54a4ff" app dark flat>
        <v-toolbar-title id="toolbar-title">BLIKVM v{{webversion}}-alpha {{ LatencyMS }} ms</v-toolbar-title>
        <v-spacer></v-spacer>
        <div id="toolbar-btns">
            <TabHome />
            <TabShortcuts />
            <TabSwitch />
            <TabMSD />
            <TabVideo />
            <TabText />
            <v-btn icon :class="{'active-toolbar-btn': keyboardStatus, 'inactive-toolbar-btn': !keyboardStatus}" size="30" @click="store.switchKeyboardStatus">
                <v-icon class="toolbar-icon">mdi-keyboard</v-icon>
                <v-tooltip activator="parent" location="bottom">{{ $t('tab.keyboard') }}</v-tooltip>
            </v-btn>
            <TabMouse />
            <TabATX />
            <TabLanguage />
            <TabUser/>
            <TabWebTerminal />
            <TabSetting />
            <TabNotification />
            <v-btn icon @click="toggleFullScreen" class="toolbar-btn" size="30">
                <v-icon class="toolbar-icon">{{ isFullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
                <v-tooltip activator="parent" location="bottom">{{ isFullScreen ? $t('tab.full_screen_exit') : $t('tab.full_screen')
                }}</v-tooltip>
            </v-btn>
            
            <v-btn icon @click="hideAppBar()" class="toolbar-btn" size="30">
                <v-icon class="toolbar-icon">mdi-chevron-up</v-icon>
                <v-tooltip activator="parent" location="bottom">{{ $t('tab.hide') }}</v-tooltip>
            </v-btn>
            
        </div>
    </v-app-bar>
    <v-icon id="drop-down-btn" v-if="!showAppBar" @click="expandAppBar()" color="primary">
        mdi-chevron-down
    </v-icon>
</template>

<script setup>
import { ref } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import http from '@/utils/http.js';
import TabSetting from './tab/TabSetting.vue';

const store = useAppStore();
const showAppBar = ref(true);
const isFullScreen = ref(false);
const { keyboardStatus , LatencyMS} = storeToRefs(store);
const { webversion } = storeToRefs(store);

const toggleFullScreen = () => {
    const doc = window.document;
    const docEl = doc.documentElement;

    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
        isFullScreen.value = true;
        store.fullScreen = true;
    } else {
        cancelFullScreen.call(doc);
        isFullScreen.value = false;
        store.fullScreen = false;
    }
};

function hideAppBar() {
    showAppBar.value = false;
}

function expandAppBar() {
    showAppBar.value = true;
}

async function getDeviceVersion() {
  try {
    const response = await http.post('/device');
    
    if (response.status === 200 && response.data.code === 0) {
      store.deviceVersion = response.data.data.device;
      store.deviceType = response.data.data.deviceType;
      store.manufacturer = response.data.data.manufacturer;
      store.hardwareType = response.data.data.hardwareType;
    } else {
      console.log('Response error:', response);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

onMounted(() => {
    getDeviceVersion();
});
</script>

<style>
#toolbar-title {
    font-size: 14px;
    font-weight: bold;
    color: white;
}

#toolbar-btns {
    display: flex;
}

.toolbar-btn {
    color: white;
    border: 2px solid white;
    border-radius: 50%;
    padding: 5px;
    margin-right: 15px;
    transition: color 0.3s ease;
}

.toolbar-btn:hover {
    color: #cccccc;
}

.toolbar-icon {
    font-size: 15px;
}

#drop-down-btn {
    position: fixed;
    top: 0;
    right: 0;
    z-index:100;
}

.active-toolbar-btn {
    color: rgb(52, 231, 8);
    border: 2px solid rgb(52, 231, 8);
    border-radius: 50%;
    padding: 5px;
    margin-right: 15px;
    transition: color 0.3s ease;
    animation: blink-animation 1s infinite; 
}

.inactive-toolbar-btn {
    color:red;
    border: 2px solid red;
    border-radius: 50%;
    padding: 5px;
    margin-right: 15px;
    transition: color 0.3s ease;
}

@keyframes blink-animation {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
    100% {
        opacity: 1;
    }
}
</style>