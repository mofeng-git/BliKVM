'use strict';

import { ref, readonly } from 'vue';
import http from '@/utils/http.js';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { useAlert } from '@/composables/useAlert';

// Store singleton instance
let sharedState = null;

export function useSendText() {
  const store = useAppStore();
  const { isProcessing, paste, textPasteDialog } = storeToRefs(store);
  const { sendAlert } = useAlert();

  // Create shared state only once
  if (!sharedState) {
    sharedState = {
      pendingText: ref(''),
      pendingLang: ref(''),
      clearInputCallback: ref(null),
    };
  }

  const { pendingText, pendingLang, clearInputCallback } = sharedState;

  // Send text directly without confirmation
  const sendTextDirect = async (text, lang) => {
    console.log(`send ${text}`, ' lang:', lang);
    isProcessing.value = true;

    const requestBody = {
      text: text,
      lang: lang || paste.value.selectedKeymap,
      delay: paste.value.characterDelay || 0,
    };

    try {
      const response = await http.post('/hid/paste', requestBody);

      if (response.status === 200) {
        console.log('text: paste to target ok');
        return true;
      } else {
        const title = 'Paste Status: Failed';
        const message = 'An issue occurred during pasting. Please try again later.';
        sendAlert('error', title, message);
        return false;
      }
    } catch (error) {
      console.error(error);
      const title = 'Paste Status: Failed';
      const message = 'An issue occurred during pasting. Please try again later.';
      sendAlert('error', title, message);
      return false;
    } finally {
      isProcessing.value = false;
    }
  };

  // Send text with optional confirmation
  const sendText = async (text, lang, requireConfirmation = false) => {
    if (requireConfirmation) {
      // Store pending text and show dialog
      pendingText.value = text;
      pendingLang.value = lang || paste.value.selectedKeymap;
      textPasteDialog.value = true;
      return;
    }

    // Send directly
    return await sendTextDirect(text, lang);
  };

  // Set callback for clearing input
  const setClearInputCallback = (callback) => {
    clearInputCallback.value = callback;
  };

  // Confirm pending text send (called from dialog)
  const confirmSend = async () => {
    textPasteDialog.value = false;
    if (pendingText.value) {
      const result = await sendTextDirect(pendingText.value, pendingLang.value);

      // Clear input on success
      if (result && clearInputCallback.value) {
        clearInputCallback.value();
      }

      pendingText.value = '';
      pendingLang.value = '';
      return result;
    }
    return false;
  };

  // Cancel pending text send
  const cancelSend = () => {
    textPasteDialog.value = false;
    pendingText.value = '';
    pendingLang.value = '';
  };

  return {
    sendText,
    confirmSend,
    cancelSend,
    setClearInputCallback,
    pendingText: readonly(pendingText),
    pendingLang: readonly(pendingLang),
  };
}
