// useStreamControl.js
import { ref } from 'vue';

export function useStreamControl() {
  const activeStreams = ref(new Set());

  // Start stream for a given host
  const startStream = (host) => {
    if (!host || !host?.baseUrl) {
      console.error('baseUrl is missing or undefined');
      return; // or handle error appropriately
    }

    if (!activeStreams.value.has(host)) {
      console.log(`Starting stream for ${host.baseUrl}`);
      activeStreams.value.add(host);
      // Add actual stream start logic here
    }
  };

  // Stop stream for a given host
  const stopStream = (host) => {
    if (activeStreams.value.has(host)) {
      console.log(`Stopping stream for ${host.baseUrl}`);
      activeStreams.value.delete(host);
      // Add actual stream stop logic here
    }
  };

  // Update the active hosts and adjust streams accordingly
  function updateStreams(newHosts) {
    const currentHosts = Array.from(activeStreams.value);

    // Stop streams that are no longer in the active hosts list
    currentHosts.forEach((host) => {
      if (!newHosts.includes(host)) stopStream(host);
    });

    // Start streams for the new active hosts
    newHosts.forEach((host) => {
      if (!activeStreams.value.has(host)) startStream(host);
    });
  }

  return {
    startStream,
    stopStream,
    updateStreams,
  };
}
