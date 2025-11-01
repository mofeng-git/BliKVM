import { ref, watch } from 'vue';

/**
 * Composable for managing component visibility based on footer toggle state
 * Handles showing/hiding keyboard, terminals, mouse, and notifications
 */
export function useComponentVisibility(device, isTouchDevice) {
  // Component visibility state
  const showKeyboard = ref(false);
  const showMobileKeyboard = ref(false);
  const showVirtualMouse = ref(false);
  const showSerial = ref(false);
  const showNotifications = ref(false);
  const showTommy = ref(false);

  /**
   * Hide all interactive components
   */
  const hideAll = () => {
    showNotifications.value = false;
    showTommy.value = false;
    showVirtualMouse.value = false;
    showKeyboard.value = false;
    showMobileKeyboard.value = false;
    device.value.showSSHTerminal = false;
    showSerial.value = false;
  };

  /**
   * Update component visibility based on toggle selection
   * @param {Array} toggleSelection - Array of selected toggle IDs
   */
  const updateVisibility = (toggleSelection) => {
    const hasKeyboard = toggleSelection.includes("keyboard");
    const hasConsole = toggleSelection.includes("console");
    const hasSerial = toggleSelection.includes("serial");
    const hasNotifications = toggleSelection.includes("notifications");
    const hasTommy = toggleSelection.includes("tommy");
    const hasMouse = toggleSelection.includes("mouse");
    
    
    // Business rules:
    // - Notifications and keyboard are mutually exclusive
    // - Terminals (console/serial) can coexist with each other and virtual mouse
    // - Virtual mouse can coexist with terminals but not with keyboards or notifications
    
    // Handle mutual exclusion: keyboard, notifications, and tommy cannot both be active
    if (hasKeyboard && (hasNotifications || hasTommy)) {
      // This should not happen due to frontend logic, but if it does, keyboard wins
      showNotifications.value = false;
      showTommy.value = false;
      showVirtualMouse.value = false;
      device.value.showSSHTerminal = hasConsole;
      showSerial.value = hasSerial;
      
      // Show keyboard based on device type
      if (isTouchDevice.value) {
        showMobileKeyboard.value = true;
        showKeyboard.value = false;
      } else {
        showKeyboard.value = true;
        showMobileKeyboard.value = false;
      }
    } else if (hasNotifications) {
      // Notifications mode - allow terminals to coexist, but hide keyboards, tommy, and mouse
      showNotifications.value = true;
      showTommy.value = false;
      showKeyboard.value = false;
      showMobileKeyboard.value = false;
      showVirtualMouse.value = false;
      device.value.showSSHTerminal = hasConsole;
      showSerial.value = hasSerial;
    } else if (hasTommy) {
      // Tommy mode - allow terminals to coexist, but hide keyboards, notifications, and mouse
      showTommy.value = true;
      showNotifications.value = false;
      showKeyboard.value = false;
      showMobileKeyboard.value = false;
      showVirtualMouse.value = false;
      device.value.showSSHTerminal = hasConsole;
      showSerial.value = hasSerial;
    } else if (hasConsole || hasSerial) {
      // Terminal mode - hide keyboard, notifications, and tommy, allow mouse and terminals
      showNotifications.value = false;
      showTommy.value = false;
      showKeyboard.value = false;
      showMobileKeyboard.value = false;
      showVirtualMouse.value = hasMouse;
      device.value.showSSHTerminal = hasConsole;
      showSerial.value = hasSerial;
    } else {
      // Normal mode - show components based on toggle selection
      showNotifications.value = false;
      showTommy.value = false;
      showVirtualMouse.value = hasMouse;   
      device.value.showSSHTerminal = hasConsole;
      showSerial.value = hasSerial;
      
      // Show keyboard based on device type
      if (hasKeyboard) {
        if (isTouchDevice.value) {
          showMobileKeyboard.value = true;
          showKeyboard.value = false;
        } else {
          showKeyboard.value = true;
          showMobileKeyboard.value = false;
        }
      } else {
        showKeyboard.value = false;
        showMobileKeyboard.value = false;
      }
    }
  };

  /**
   * Setup watcher for activeToggle changes
   * @param {Ref} activeToggle - Reactive reference to active toggle array
   */
  const watchToggleChanges = (activeToggle) => {
    watch(activeToggle, (newToggle) => {
      updateVisibility(newToggle);
    }, { deep: true });
  };


  return {
    // State
    showKeyboard,
    showMobileKeyboard,
    showVirtualMouse,
    showSerial,
    showNotifications,
    showTommy,
    
    // Methods
    hideAll,
    updateVisibility,
    watchToggleChanges
  };
}