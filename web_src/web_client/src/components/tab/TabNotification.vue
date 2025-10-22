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
            <v-btn icon :class="{ 'active-toolbar-btn': newNotification, 'inactive-toolbar-btn': !newNotification }"
                size="30" v-bind="props" @click="markAsRead">
                <v-icon class="toolbar-icon">mdi-bell</v-icon>
                <v-tooltip activator="parent" location="bottom">{{ $t('tab.notification.tip') }}</v-tooltip>
            </v-btn>
        </template>

        <v-card max-width="100%" class="mx-auto" color="grey-lighten-3" @mouseenter.stop @mousemove.stop>

            <v-card-title>{{ $t('tab.notification.tip') }}</v-card-title>

            <v-expansion-panels variant="accordion" v-model="expandedPanels">
                <v-expansion-panel class="bli-font-bold" v-for="(panel, index) in notification" :key="index"
                    :title="`${panel.title}(${panel.contents.length})`">
                    <v-expansion-panel-text v-for="(content, index) in panel.contents" :key="index">
                        <v-card>
                            <v-card-subtitle>{{ content.subtitle }}</v-card-subtitle>
                            <v-card-text>{{ content.text }}</v-card-text>
                        </v-card>
                    </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Logs Section -->
                <v-expansion-panel>
                    <v-expansion-panel-title>
                        {{ $t('tab.notification.log') }}
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-card>
                            <v-card-text>
                                <div v-if="logs.length === 0"></div>
                                <div v-else>
                                    <pre>{{ logs }}</pre>
                                </div>
                            </v-card-text>
                            <template v-slot:actions>
                                <v-btn append-icon="mdi-refresh" color="red-lighten-2" :text="$t('common.refresh')"
                                    variant="outlined" block @click="fetchLogs"></v-btn>
                            </template>
                        </v-card>

                    </v-expansion-panel-text>

                </v-expansion-panel>


            </v-expansion-panels>
        </v-card>
    </v-menu>
</template>

<script setup>
import { ref } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import http from '@/utils/http.js';

const store = useAppStore();
const { newNotification, notification } = storeToRefs(store);

const menu = ref(false);
const expandedPanels = ref([]);
const logs = ref(''); // Logs content

function markAsRead() {
    newNotification.value = false;
}

async function fetchLogs() {
    try {
        const response = await http.post('/logs');
        if (response.status === 200 && response.data.code === 0){
            logs.value = response.data.data;
        }else{
            console.log('Failed to fetch logs');
        }
    } catch (error) {
        console.error('Error during atx button trigger:', error);
    }
}

</script>

<style scoped>
.active-toolbar-btn {
    color: #e7c608;
    border: 2px solid #e7c608;
    border-radius: 50%;
    padding: 5px;
    margin-right: 15px;
    transition: color 0.3s ease;
    animation: blink-animation 1s infinite;
}

.inactive-toolbar-btn {
    color: white;
    border: 2px solid white;
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