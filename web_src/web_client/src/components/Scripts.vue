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
  <v-sheet
    class="mx-auto wrap-text"
    @mouseenter.stop
    @mousemove.stop
    @keydown.stop
    @keypress.stop
    @keyup.stop
  >
    <v-file-upload
      divider-text="or choose locally"
      icon="mdi-upload"
      title="Drag & Drop or Click Here"
      clearable
      multiple
      show-size
      scrim
      tile
      density="compact"
    ></v-file-upload>
  </v-sheet>
</template>

<script setup>
  import { ref } from 'vue';
  import http from '@/utils/http.js';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useAlert } from '@/composables/useAlert';

  // Define the props and use v-model binding
  const props = defineProps({
    label: String,
    index: Number,
    modelValue: Boolean, // Auto-bound for v-model:is-menu-visible
  });

  const emit = defineEmits(['update:modelValue']);
  const store = useAppStore();
  const { isProcessing, scripts } = storeToRefs(store);

  const { sendAlert } = useAlert();

  const input = ref('');

  const send = async () => {
    isProcessing.value = true;

    const contentTypeTextPlain = `Content-Type': 'text/plain'`;

    try {
      const response = await http.post('/upload', input.value, {
        headers: { contentTypeTextPlain },
      });

      if (response.status === 200) {
        console.log('text: paste to target ok');
      }
    } catch (error) {
      console.error(error);
      const title = 'TODO Paste Status: Failed';
      const message = `An issue occurred during pasting. Please try again later.`;
      sendAlert('error', title, message);
    } finally {
      isProcessing.value = false;
    }
  };

  const cancel = async () => {
    try {
      // Emit the event to the parent
      emit('update:modelValue', false);
      scripts.value.isMenuActive = false;
    } catch (error) {
      console.error('Error during cancel operation:', error);
    }
  };

  const save = async () => {
    try {
      // Emit the event to the parent
      emit('update:modelValue', false);
    } catch (error) {
      console.error('Error during save operation:', error);
    }
  };

  const actionHandlers = {
    //  resetDefaults: handleResetDefaults,
    ok: save,
    cancel: cancel,
  };

  const handleClick = async (actionType) => {
    const action = actionHandlers[actionType];
    if (action) {
      try {
        await action(); // Await the action if it's async
      } catch (error) {
        console.error(`Error handling actionType ${actionType}:`, error);
      }
    } else {
      console.error(`No handler found for actionType: ${actionType}`);
    }
  };
</script>
