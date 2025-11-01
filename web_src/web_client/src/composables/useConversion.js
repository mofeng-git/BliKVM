// useConversion.js

'use strict';

export function useConversion() {
  // Format date function
  const formatDate = (dateString) => {
    // Ensure the dateString is passed correctly, and handle errors gracefully
    try {
      // TODO not working    return format(dateString, 'fullDateTime24h'); // Adjust format pattern as needed
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return unformatted date as fallback
    }
  };

  const convertBytesToMiB = (bytes) => {
    const mebibytes = bytes / (1024 * 1024); // 1 MiB = 1024 * 1024 bytes
    return mebibytes.toFixed(2); // Adjust the decimal places as needed
  };

  const convertBytesToGB = (bytes) => {
    const mebibytes = bytes / (1024 * 1024 * 1024); // 1 Gb = 1024 * 1024 * 1024 bytes
    return mebibytes.toFixed(2); // Adjust the decimal places as needed
  };

  const convertBytesToGiB = (bytes, decimals = 0) => {
    const gigabytes = bytes / 1_000_000_000; // 1 GB = 1,000,000,000 bytes
    return gigabytes.toFixed(decimals);
  };

  return { formatDate, convertBytesToMiB, convertBytesToGB, convertBytesToGiB };
}
