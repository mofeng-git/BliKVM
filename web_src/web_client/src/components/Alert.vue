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
    <div v-if="newAlert" class="alert-container">
        <v-alert v-model="newAlert" type="error" variant="tonal" density="compact" class="mb-4" closable>
            <div>{{ alert }}</div>
            <template v-slot:append>
                <v-btn variant="text" color="error" @click="handleUndo" class="ml-auto"></v-btn>
            </template>
        </v-alert>
    </div>
</template>

<script setup>
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { watch, onMounted, onUnmounted } from 'vue';

const store = useAppStore();
const { alert, newAlert } = storeToRefs(store);
// Timer reference
let timer = null;


// Handle the undo action
const handleUndo = () => {
    store.newAlert = false;
};

// Watch for `newAlert` changes to automatically dismiss the alert after 5 seconds
watch(newAlert, (val) => {
    if (val) {
        // Clear any existing timer
        if (timer) clearTimeout(timer);

        // Set a new timer to hide the alert after 5 seconds
        timer = setTimeout(() => {
            store.newAlert = false;
        }, 5000);
    }
});

// Clean up the timer when the component is unmounted
onUnmounted(() => {
    if (timer) clearTimeout(timer);
});


</script>

<style scoped>
.alert-container {
    position: absolute;
    top: 40px;
    /* Adjust as needed */
    left: 50%;
    transform: translateX(-50%);
    z-index: 3000;
    /* Ensure it's above the video */
}
</style>