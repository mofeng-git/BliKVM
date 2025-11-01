'use strict';

import http from '@/utils/http.js';

export function useVideoScreenshot() {
  const openImageInNewWindow = (imageUrl) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<img src="${imageUrl}" alt="Snapshot" style="max-width: 100%; height: auto;" />`
      );
      newWindow.document.close();
    } else {
      console.error('Failed to open new window');
    }
  };

  const takeScreenshot = async () => {
    try {
      const response = await http.get('/video/snapshot', {
        responseType: 'blob',
      });

      if (response.status === 200) {
        const imageUrl = URL.createObjectURL(response.data);

        if (imageUrl) {
          openImageInNewWindow(imageUrl);
        } else {
          console.error('Failed to take screenshot');
        }
      } else {
        console.error('Failed to take screenshot');
      }
    } catch (error) {
      console.error('Error taking screenshot: ', error);
    }
  };

  return { takeScreenshot };
}
