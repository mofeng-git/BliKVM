'use strict';

import { ref } from 'vue';
import http from '@/utils/http.js';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { useAlert } from '@/composables/useAlert';
import { useClipboard } from './useClipboard';
import { zIndex } from '@/styles/zIndex';

const selection = ref({ x: 0, y: 0, width: 0, height: 0 });
const realSelection = ref({ left: 0, top: 0, width: 0, height: 0 });
let ocrStartX = 0;
let ocrStartY = 0;
const isSelecting = ref(false);
const ocrOutput = ref('');

export function useExtractText() {
  const store = useAppStore();
  const { ocr, devices, isProcessing } = storeToRefs(store);
  const { sendAlert } = useAlert();

  const resetOcrState = ({ resetSelection = true } = {}) => {
    // Always hide dialog
    ocr.value.showOcrDialog = false;

    // Optionally reset selection state
    if (resetSelection) {
      ocr.value.isSelecting = false;
      ocr.value.ocrSelection = false;
      selection.value = { x: 0, y: 0, width: 0, height: 0 };
    }
  };

  const startSelection = (event, streamElementRef) => {
    if (ocr.value.ocrSelection === true) {
      if (!streamElementRef.value || !ocr.value.ocrSelection) {
        console.warn('Stream element reference is not available or OCR selection is not active.');
        return;
      }
      // Get the position within the kvm element
      const videoRect = streamElementRef.value.getBoundingClientRect();
      if (!videoRect) {
        console.warn('Video element reference is not available.');
        return;
      }

      // TODO Vuetify uses ref, id is old, not necessary. To be refactored
      const kvmElement = document.getElementById('appkvm');
      if (!kvmElement) {
        console.warn('KVM element not found.');
        return;
      }
      const rect = kvmElement.getBoundingClientRect();
      const kvmLeft = rect.left;
      const kvmTop = rect.top;

      ocrStartX = event.clientX - kvmLeft;
      ocrStartY = event.clientY - kvmTop;
      const width = rect.right - rect.left;
      const height = videoRect.bottom - videoRect.top;
      realSelection.value.left = (devices.value.video.resolutionWidth * ocrStartX) / width;
      realSelection.value.top =
        (devices.value.video.resolutionHeight * (ocrStartY - videoRect.top)) / height;
      ocr.value.isSelecting = true;
      selection.value = { x: ocrStartX, y: ocrStartY, width: 0, height: 0 };
      console.log(
        'startSelection',
        selection.value,
        'rect left:',
        rect.left,
        'rect top:',
        rect.top
      );
      return;
    }
  };

  const endSelection = () => {
    if (ocr.value.ocrSelection === true && ocr.value.isSelecting === true) {
      ocr.value.isSelecting = false;
      ocr.value.ocrSelection = false;
      selection.value = { x: 0, y: 0, width: 0, height: 0 };
      ocr.value.showOcrDialog = true;
      return;
    }
  };

  const updateSelection = (event, streamElementRef) => {
    if (ocr.value.ocrSelection === true && ocr.value.isSelecting === true) {
      if (!streamElementRef.value) return;
      const videoRect = streamElementRef.value.getBoundingClientRect();
      if (!videoRect) return;

      const kvmElement = document.getElementById('appkvm');
      if (!kvmElement) return;
      const rect = kvmElement.getBoundingClientRect();

      const x = Math.min(event.clientX - rect.left, ocrStartX);
      const y = Math.min(event.clientY - rect.top, ocrStartY);
      const width = Math.abs(event.clientX - rect.left - ocrStartX);
      const height = Math.abs(event.clientY - rect.top - ocrStartY);
      const videoWidth = rect.right - rect.left;
      const videoHeight = videoRect.bottom - videoRect.top;
      realSelection.value.width = (devices.value.video.resolutionWidth * width) / videoWidth;
      realSelection.value.height = (devices.value.video.resolutionHeight * height) / videoHeight;

      selection.value = { x, y, width, height };

      // console.log("updateSelection", selection.value, "rect left:", rect.left, "rect top:", rect.top);
      return;
    }
  };

  const ocrRecognition = async () => {
    isProcessing.value = true;
    try {
      sendAlert('info', 'OCR In Progress', 'Processing...');
      console.log(
        'left top width height:',
        realSelection.value.left,
        realSelection.value.top,
        realSelection.value.width,
        realSelection.value.height
      );
      const response = await http.post(
        '/ocr',
        {
          lang: ocr.value.ocrLanguage,
          rect: {
            left: realSelection.value.left,
            top: realSelection.value.top,
            width: realSelection.value.width,
            height: realSelection.value.height,
          },
        },
        { timeout: 60000 }
      );

      if (response.status === 200) {
        ocr.value.showOcrOutputDialog = true;
        ocrOutput.value = response.data.data;
        sendAlert('success', 'OCR Complete', 'Text extracted successfully!');
      } else {
        sendAlert('error', 'OCR Failed', response.data.msg || 'An error occurred during OCR.');
      }
    } catch (error) {
      sendAlert('error', 'OCR Failed', 'An error occurred during OCR.');
    } finally {
      isProcessing.value = false;
    }
  };

  const selectionStyle = computed(() => ({
    position: 'absolute',
    border: '2px dashed #76FF03',
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    zIndex: zIndex.extracText,
    left: `${selection.value.x}px`,
    top: `${selection.value.y}px`,
    width: `${selection.value.width}px`,
    height: `${selection.value.height}px`,
  }));

  // TODO what's this, and should it be here?
  /*
  new ClipboardJS(".copy-btn", {
    text: () => ocrText.value,
  })
    .on("success", () => {
      console.log("Text copied to clipboard.");
    })
    .on("error", () => {
      console.error("Failed to copy text.");
    });
*/

  return {
    ocr,
    isSelecting,
    ocrOutput,
    selection,
    resetOcrState,
    startSelection,
    updateSelection,
    endSelection,
    ocrRecognition,
    selectionStyle,
  };
}
