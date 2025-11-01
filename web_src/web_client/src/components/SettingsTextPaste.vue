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
  <v-row dense no-gutters>
    <v-hover>
      <template #default="{ props: hoverProps, isHovering }">
        <v-card
          v-bind="hoverProps"
          :border="`thin ${isHovering || isFocused ? 'success opacity-75' : ''}`"
          class="mx-auto mb-4"
          flat
          min-width="100%"
        >
          <v-textarea
            v-model="input"
            v-model:focused="isFocused"
            :disabled="isProcessing"
            rows="4"
            flat
            filled
            auto-grow
            bg-color="transparent"
            variant="solo"
            density="compact"
            rounded="lg"
            hide-details
            :placeholder="$t('settings.text.paste.inputHelp')"
            :value="toggleMultiple.includes(0) ? maskedText : input"
            @keydown="captureKey"
            @paste="onPaste"
            @keydown.stop
            @keyup.stop
          />

          <v-row dense no-gutters>
            <v-col cols="auto" class="d-flex align-center">
              <div class="d-flex align-center pa-1 ga-1">
                <span class="text-no-wrap">{{ $t('settings.text.paste.keymap') }}:</span>
                <v-select
                  v-model="paste.selectedKeymap"
                  :items="keymapOptions"
                  item-value="value"
                  item-title="label"
                  variant="outlined"
                  rounded="lg"
                  density="compact"
                  tile
                  hide-details
                  class="ma-0"
                  style="min-height: auto"
                  color="#76FF03"
                  @click.stop
                />
                <span class="text-no-wrap ml-3">{{ $t('settings.text.paste.delay') }}:</span>
                <v-text-field
                  v-model.number="paste.characterDelay"
                  type="number"
                  min="5"
                  max="100"
                  step="5"
                  variant="outlined"
                  rounded="lg"
                  density="compact"
                  hide-details
                  class="ma-0 ml-2"
                  style="min-height: auto; width: 130px"
                  suffix="ms"
                  color="#76FF03"
                  @click.stop
                />
              </div>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </v-hover>
  </v-row>

  <v-row dense no-gutters>
    <v-col cols="12" class="d-flex justify-end">
      <v-btn-toggle v-model="toggleMultiple" multiple>
        <!-- -->
        <v-btn
          :style="{
            color: '#76FF03',
          }"
          :prepend-icon="toggleMultiple.includes(0) ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          :text="$t('settings.text.paste.obfuscate')"
          rounded="lg"
        />
        &nbsp; &nbsp;
        <v-btn
          :style="{
            color: '#76FF03',
          }"
          prepend-icon="mdi-checkbox-marked-circle-outline"
          :text="$t('settings.text.paste.confirmOnSend')"
          rounded="lg"
        />
      </v-btn-toggle>
    </v-col>
  </v-row>

  <v-row dense no-gutters>
    <v-col cols="*" class="d-flex justify-end align-center">
      <v-btn
        color="#76FF03"
        variant="tonal"
        :loading="isProcessing"
        :disabled="isProcessing"
        @click="send"
      >
        {{ $t('settings.text.paste.send') }}
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup>
  import { ref, shallowRef } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useKeymap } from '@/composables/useKeymap';
  import { useAlert } from '@/composables/useAlert';
  import { useSendText } from '@/composables/useSendText';

  const store = useAppStore();
  const { isProcessing, paste } = storeToRefs(store);

  // TODO composable
  const { keymapOptions } = useKeymap();

  const input = ref('');
  const maskedText = ref('');
  const isFocused = shallowRef(false);
  const toggleMultiple = ref([]);

  // Create composable instance with clear callback
  const { sendText, setClearInputCallback } = useSendText();

  // Set up the clear input callback
  setClearInputCallback(() => {
    input.value = '';
    maskedText.value = '';
  });

  // Capture each keypress

  const captureKey = (event) => {
    const obfuscate = toggleMultiple.value.includes(0);

    // Allow keyboard shortcuts: Ctrl / Cmd / Alt pass through
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    // Enter: default behavior (can preventDefault here for custom send)
    if (event.key === 'Enter') return;

    if (!obfuscate) {
      // Non-obfuscate mode: don't intercept
      return;
    }

    // Handle in obfuscate mode
    if (event.key === 'Backspace') {
      event.preventDefault();
      input.value = input.value.slice(0, -1);
      maskedText.value = maskedText.value.slice(0, -1);
      return;
    }

    // Regular printable characters
    if (event.key.length === 1) {
      event.preventDefault();
      input.value += event.key;
      const randomBulletsCount = Math.floor(Math.random() * 5) + 1;
      maskedText.value += '•'.repeat(randomBulletsCount);
    }
  };

  // Handle paste events
  const onPaste = (event) => {
    const obfuscate = toggleMultiple.value.includes(0);
    if (!obfuscate) {
      // Non-obfuscate mode: let browser handle default paste
      return;
    }
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    if (!text) return;
    input.value += text;
    // Generate mask for pasted text (random or 1:1)
    maskedText.value += text
      .split('')
      .map(() => '•'.repeat(Math.floor(Math.random() * 5) + 1))
      .join('');
  };

  const send = async () => {
    // Check if "confirm on send" is enabled
    //  (assuming index 1 represents this option)
    const requireConfirmation = toggleMultiple.value.includes(1);

    if (requireConfirmation) {
      // For confirmation flow, just trigger the dialog
      await sendText(input.value, paste.value.selectedKeymap, requireConfirmation);
    } else {
      // For direct send, check the result
      const success = await sendText(input.value, paste.value.selectedKeymap, requireConfirmation);
      if (success) {
        // Clear input only on success
        input.value = '';
        maskedText.value = '';
      }
    }
  };
</script>
