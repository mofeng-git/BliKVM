import { ref } from 'vue';

/**
 * Composable for handling terminal resize functionality
 * Provides drag-to-resize capability for side-by-side terminals
 */
export function useTerminalResize(initialWidth = 50) {
  const terminalWidth = ref(initialWidth); // Default 50/50 split
  const isResizing = ref(false);
  const isDragging = ref(false);
  
  // Industry standard: double-click resets to 50/50
  const defaultWidth = 50;

  const startResize = (event) => {
    event.preventDefault();
    isResizing.value = true;
    isDragging.value = false;
    
    const startX = event.clientX || (event.touches && event.touches[0].clientX);
    const container = event.target.closest('.terminal-container-flex');
    
    if (!container) {
      return;
    }
    
    const containerRect = container.getBoundingClientRect();
    const startWidth = terminalWidth.value;
    
    const handleMouseMove = (moveEvent) => {
      if (!isResizing.value) return;
      
      // Mark as dragging once mouse moves
      isDragging.value = true;
      
      const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
      const deltaX = currentX - startX;
      const containerWidth = containerRect.width;
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      let newWidth = startWidth + deltaPercent;
      
      // Constrain between 20% and 80%
      newWidth = Math.max(20, Math.min(80, newWidth));
      
      terminalWidth.value = newWidth;
    };
    
    const handleMouseUp = () => {
      isResizing.value = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
      
      // Trigger terminal resize after dragging
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);
  };

  // Industry standard: double-click resets to 50/50 split
  const handleResizeDoubleClick = (event) => {
    // Only handle double-clicks, not drags
    if (isDragging.value) {
      isDragging.value = false;
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    // Reset to default 50/50 split
    terminalWidth.value = defaultWidth;
    
    // Trigger terminal resize after double-click
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  return {
    terminalWidth,
    isResizing,
    startResize,
    handleResizeDoubleClick
  };
}