// composables/useScreenshot.js
import { ref } from 'vue';

export function useScreenshot(device) {
  const isTakingScreenshot = ref(false);
  const delay = 100; // Simulate asynchronous process

  const takeScreenshot = async () => {
    isTakingScreenshot.value = true;
    // Simulate taking a screenshot (replace with your actual asynchronous logic)

    // TODO invoke REST service

    await new Promise((resolve) =>
      setTimeout(() => {
        isTakingScreenshot.value = false;
        resolve();
        // You might want to trigger a notification or other UI updates here
      }, delay)
    );
  };

  const handleScreenshotClick = async () => {
    await takeScreenshot();
    // Any actions to perform after the screenshot is complete can go here
  };

  return {
    isTakingScreenshot,
    handleScreenshotClick,
  };
}
