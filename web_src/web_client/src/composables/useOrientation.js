'use strict';

export function useOrientation(device) {
  // Function to handle orientation
  const setOrientation = (value) => {
    device.value.video.orientation = value; // Update the current orientation
  };

  return {
    setOrientation,
  };
}
