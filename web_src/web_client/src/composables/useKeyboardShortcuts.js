'use strict';

import { ref, onMounted, watch } from 'vue';
import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert';

const shortcutList = ref([]); // Initialize shortcutList as empty array

export function useKeyboardShortcuts(targetOS) {
  const { sendAlert } = useAlert();

  const loadShortcuts = async () => {
    const os = targetOS?.value || 'windows';

    try {
      // Use the API endpoint - http already has /api in baseURL
      const response = await http.get(`/shortcuts/${os}`);

      if ((response.status === 200 || response.status === 201) && response.data.code === 0) {
        // API returns data in { items: [...], targetOS: "..." } format
        const shortcuts = response.data.data?.items || [];

        // Transform API format to match existing format if needed
        // API returns 'keys' but existing code might expect 'value'
        shortcutList.value = shortcuts.map((item) => ({
          name: item.name,
          value: item.keys || item.value,
          category: item.category,
        }));

        return;
      }
    } catch (error) {
      // API failed, try fallback to static JSON
      try {
        const response = await fetch('/data/keyboardShortcuts.json');
        const data = await response.json();
        shortcutList.value = data[os] || data.windows || [];
        console.log('Loaded shortcuts from JSON fallback for OS:', os);
      } catch (fallbackError) {
        console.error('Both API and fallback failed:', fallbackError);
        sendAlert('error', 'Keyboard Shortcuts', 'Failed to load keyboard shortcuts');
        shortcutList.value = [];
      }
    }
  };

  // TODO here we can reuse the websocket sendkey API
  // both are keypress with similar behaviour not warranting additional web service implementation.
  // less code to maintain.
  // also it's shortcut (for a single shortcut), not with s (for multiple)
  const sendShortcut = async (value) => {
    const requestBody = {
      shortcuts: value,
    };

    console.log('Sending shortcut:', requestBody);

    try {
      const response = await http.post('/hid/shortcuts', requestBody);

      if ((response.status === 200 || response.status === 201) && response.data.code === 0) {
        console.log('Shortcut sent successfully');
      } else {
        console.warn(`Shortcut API failed: status ${response.status}, code ${response.data.code}`);
      }
    } catch (error) {
      console.error('Error sending shortcut:', error);
    }
  };

  // Create a new shortcut
  const createShortcut = async (name, keys, category = '') => {
    const os = targetOS?.value || 'windows';

    try {
      const requestBody = {
        name,
        keys,
        category,
      };

      const response = await http.post(`/shortcuts/${os}`, requestBody);

      if ((response.status === 200 || response.status === 201) && response.data.code === 0) {
        sendAlert('success', 'Shortcut Created', `Successfully created shortcut: ${name}`);
        await loadShortcuts(); // Reload the list
        return true;
      } else {
        throw new Error(response.data.msg || 'Failed to create shortcut');
      }
    } catch (error) {
      console.error('Error creating shortcut:', error);
      sendAlert('error', 'Error', 'Failed to create shortcut');
      return false;
    }
  };

  // Update an existing shortcut
  const updateShortcut = async (originalName, newName, keys, category) => {
    const os = targetOS?.value || 'windows';

    try {
      const requestBody = {
        name: newName,
        keys,
        category,
      };

      // URL encode the name to handle special characters
      const encodedName = encodeURIComponent(originalName);
      console.log('Updating shortcut:', originalName, 'with:', requestBody);
      const response = await http.patch(`/shortcuts/${os}/${encodedName}`, requestBody);

      if ((response.status === 200 || response.status === 201) && response.data.code === 0) {
        sendAlert('success', 'Shortcut Updated', `Successfully updated shortcut: ${newName}`);
        await loadShortcuts(); // Reload the list
        return true;
      } else {
        throw new Error(response.data.msg || 'Failed to update shortcut');
      }
    } catch (error) {
      console.error('Error updating shortcut:', error);
      sendAlert('error', 'Error', 'Failed to update shortcut');
      return false;
    }
  };

  // Delete a shortcut
  const deleteShortcut = async (name) => {
    const os = targetOS?.value || 'windows';

    try {
      // URL encode the name to handle special characters
      const encodedName = encodeURIComponent(name);
      console.log('Deleting shortcut:', name);
      const response = await http.delete(`/shortcuts/${os}/${encodedName}`);

      // Check for standard API response format
      if ((response.status === 200 || response.status === 201) && response.data.code === 0) {
        sendAlert('success', 'Shortcut Deleted', `Successfully deleted shortcut: ${name}`);
        await loadShortcuts(); // Reload the list
        return true;
      } else {
        throw new Error(response.data.msg || response.data.message || 'Failed to delete shortcut');
      }
    } catch (error) {
      console.error('Error deleting shortcut:', error);
      sendAlert('error', 'Error', 'Failed to delete shortcut');
      return false;
    }
  };

  // Reset shortcuts to defaults
  const resetShortcuts = async () => {
    const os = targetOS?.value || 'windows';

    try {
      console.log('Resetting shortcuts for OS:', os);
      const response = await http.post(`/shortcuts/${os}/reset`, {});

      if ((response.status === 200 || response.status === 201) && response.data.code === 0) {
        sendAlert(
          'success',
          'Shortcuts Reset',
          `Successfully reset shortcuts to defaults for ${os}`
        );
        await loadShortcuts(); // Reload the list
        return true;
      } else {
        throw new Error(response.data.msg || 'Failed to reset shortcuts');
      }
    } catch (error) {
      console.error('Error resetting shortcuts:', error);
      sendAlert('error', 'Error', 'Failed to reset shortcuts');
      return false;
    }
  };

  onMounted(() => {
    // console.log('useKeyboardShortcuts mounted');
  });

  // Watch for OS changes if targetOS is provided
  if (targetOS) {
    watch(targetOS, loadShortcuts);
  }

  return {
    shortcutList,
    sendShortcut,
    loadShortcuts,
    createShortcut,
    updateShortcut,
    deleteShortcut,
    resetShortcuts,
  };
}
