import { ref } from 'vue';

/**
 * Composable for managing footer toggle state and mutual exclusivity
 * Handles complex logic for keyboard vs terminals vs notifications
 */
export function useFooterToggle(initialSelection = ["video"]) {
  const activeToggle = ref([...initialSelection]);

  /**
   * Handle toggle changes with mutual exclusivity rules
   * @param {Array} selectedValues - Array of selected toggle IDs
   */
  const handleToggleChange = (selectedValues) => {
    let corrected = [...selectedValues];
    
    // Simple mutual exclusivity rules
    if (corrected.includes("notifications")) {
      // Notifications only with video
      corrected = corrected.filter(val => val === "video" || val === "notifications");
    } else if (corrected.includes("keyboard") && (corrected.includes("console") || corrected.includes("serial"))) {
      // Keyboard vs terminals - remove the older one (keep the last clicked)
      const oldToggle = activeToggle.value;
      const newItem = corrected.find(val => !oldToggle.includes(val));
      
      if (newItem === "keyboard") {
        corrected = corrected.filter(val => val !== "console" && val !== "serial");
      } else {
        corrected = corrected.filter(val => val !== "keyboard");
      }
    }
    
    activeToggle.value = corrected;
  };

  /**
   * Check if a specific item is selected
   * @param {string} itemId - The item ID to check
   * @returns {boolean}
   */
  const isSelected = (itemId) => {
    return activeToggle.value.includes(itemId);
  };

  /**
   * Add an item to the toggle selection
   * @param {string} itemId - The item ID to add
   */
  const addToToggle = (itemId) => {
    if (!activeToggle.value.includes(itemId)) {
      handleToggleChange([...activeToggle.value, itemId]);
    }
  };

  /**
   * Remove an item from the toggle selection
   * @param {string} itemId - The item ID to remove
   */
  const removeFromToggle = (itemId) => {
    const filtered = activeToggle.value.filter(val => val !== itemId);
    handleToggleChange(filtered);
  };

  /**
   * Toggle an item (add if not present, remove if present)
   * @param {string} itemId - The item ID to toggle
   */
  const toggleItem = (itemId) => {
    if (isSelected(itemId)) {
      removeFromToggle(itemId);
    } else {
      addToToggle(itemId);
    }
  };

  /**
   * Reset toggle to initial state
   */
  const resetToggle = () => {
    activeToggle.value = [...initialSelection];
  };

  /**
   * Set toggle to specific selection
   * @param {Array} selection - Array of item IDs to select
   */
  const setToggle = (selection) => {
    handleToggleChange([...selection]);
  };

  return {
    activeToggle,
    handleToggleChange,
    isSelected,
    addToToggle,
    removeFromToggle,
    toggleItem,
    resetToggle,
    setToggle
  };
}