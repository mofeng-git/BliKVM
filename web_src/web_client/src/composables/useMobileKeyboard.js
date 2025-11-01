import { ref } from 'vue';

/**
 * Composable for managing mobile keyboard functionality
 * Handles text input, special keys, and character-by-character sending
 */
export function useMobileKeyboard(handleKeyPress, handleKeyReleased) {
  const mobileKeyboardText = ref('');

  /**
   * Send mobile text character by character
   */
  const sendMobileText = () => {
    if (mobileKeyboardText.value.trim()) {
      const text = mobileKeyboardText.value;
      for (const char of text) {
        handleKeyPress({ key: char });
        handleKeyReleased({ key: char });
      }
      mobileKeyboardText.value = ''; // Clear after sending
    }
  };

  /**
   * Send special key (Enter, Tab, Escape, etc.)
   * @param {string} key - The special key to send
   */
  const sendSpecialKey = (key) => {
    handleKeyPress({ key });
    handleKeyReleased({ key });
  };

  return {
    mobileKeyboardText,
    sendMobileText,
    sendSpecialKey
  };
}