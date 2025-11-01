'use strict';

// TODO not use what this one is used for pasting?
import { ClipboardJS } from 'clipboard';

export function useClipboard() {
  const copyClipboard = async (value) => {
    if (value) {
      const textToCopy = value;

      try {
        await navigator.clipboard.writeText(textToCopy);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  return {
    ClipboardJS,
    copyClipboard,
  };
}
