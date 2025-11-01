'use strict';

import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

export function useAlert() {
  const store = useAppStore();
  const { misc, isProcessing } = storeToRefs(store);

  const initializeAlert = () => {
    const alertLocation = localStorage.getItem('alertLocation') || 'top end';
    if (misc.value?.alert) {
      misc.value.alert.location = alertLocation;
    }
  };

  const locationOptions = [
    { text: 'Top Start', value: 'top start' },
    { text: 'Top End', value: 'top end' },
    { text: 'Bottom Start', value: 'bottom start' },
    { text: 'Bottom End', value: 'bottom end' },
  ];

  const getAlertIcon = (type) => {
    const iconMap = {
      success: 'mdi-check-circle',
      error: 'mdi-alert-circle',
      warning: 'mdi-alert',
      info: 'mdi-information',
    };
    return iconMap[type] || 'mdi-information';
  };

  const getAlertColor = (type) => {
    const colorMap = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };
    return colorMap[type] || 'info';
  };

  const sendAlert = (type, title, text, force = false) => {
    try {
      // Validate parameters
      if (!type || !title || !text) {
        console.warn('sendAlert: Missing required parameters');
        return;
      }

      // Only show alert if alerts are enabled (unless forced)
      if (!force && !misc.value?.alert?.isEnabled) return;

      // Ensure alert object exists
      if (!misc.value.alert) {
        console.error('sendAlert: Alert object not initialized in store');
        return;
      }

      misc.value.alert.type = type;
      misc.value.alert.title = title;
      misc.value.alert.text = text;
      misc.value.alert.isActive = true;
    } catch (error) {
      console.error('sendAlert error:', error);
    }
  };

  const setLocation = (value) => {
    try {
      if (!value) {
        console.warn('setLocation: No location value provided');
        return;
      }

      localStorage.setItem('alertLocation', value);

      // Update store location
      if (misc.value?.alert) {
        misc.value.alert.location = value;
      }

      sendAlert('success', 'Location set', `Alert location set to ${value}`);
    } catch (error) {
      console.error('setLocation error:', error);
    }
  };

  return {
    locationOptions,
    sendAlert,
    setLocation,
    getAlertIcon,
    getAlertColor,
    initializeAlert,
  };
}
