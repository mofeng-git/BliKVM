import { ref } from 'vue';

/**
 * Composable for managing vertical terminal height resizing
 * Provides drag-to-resize capability for terminal height adjustment
 */
export function useTerminalVerticalResize(initialHeight = 300) {
  const terminalHeight = ref(initialHeight);
  const isVerticalResizing = ref(false);
  const startY = ref(0);
  const startHeight = ref(0);

  /**
   * Start vertical resize operation
   * @param {MouseEvent|TouchEvent} event - The initiating event
   */
  const startVerticalResize = (event) => {
    event.preventDefault();
    isVerticalResizing.value = true;
    
    // Handle both mouse and touch events
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);
    startY.value = clientY;
    startHeight.value = terminalHeight.value;

    // Add global event listeners
    const handleMove = (e) => {
      if (!isVerticalResizing.value) return;
      
      const currentY = e.clientY || (e.touches && e.touches[0].clientY);
      const deltaY = currentY - startY.value;
      
      // Calculate new height (inverted because we're at the bottom)
      const newHeight = Math.max(200, Math.min(600, startHeight.value - deltaY));
      terminalHeight.value = newHeight;
    };

    const handleEnd = () => {
      isVerticalResizing.value = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  return {
    terminalHeight,
    isVerticalResizing,
    startVerticalResize
  };
}