'use strict';

import { ref } from 'vue';
import axios from 'axios';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const githubLatestVersion = ref(''); // Reactive reference for GitHub version
const hasNewVersion = ref(false); // Reactive reference to indicate if a new version is available

/**
 * Converts a version string to an array of numbers for comparison.
 * @param {string} version - Version string (e.g., "v1.2.3").
 * @returns {number[]} Array of numeric parts (e.g., [1, 2, 3]).
 */
const versionToNumbers = (version) => {
  return version
    .replace(/[^\d.]/g, '')
    .split('.')
    .map(Number);
};

/**
 * Compares local and GitHub version numbers.
 * @param {string} local - Local version string.
 * @param {string} github - GitHub version string.
 * @returns {boolean} True if GitHub version is newer; false otherwise.
 */
const compareNewVersion = (local, github) => {
  const localNumbers = versionToNumbers(local);
  const githubNumbers = versionToNumbers(github);

  for (let i = 0; i < Math.max(localNumbers.length, githubNumbers.length); i++) {
    const localNum = localNumbers[i] || 0; // Default to 0 if undefined
    const githubNum = githubNumbers[i] || 0;

    if (githubNum > localNum) return true; // GitHub version is newer
    if (localNum > githubNum) return false; // Local version is newer
  }

  return false; // versions are identical
};

/**
 * Get the latest release version from the GitHub API.
 */
const getLatestVersion = async () => {
  const owner = 'blikvm';
  const repo = 'blikvm';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

  try {
    const response = await axios.get(apiUrl);
    githubLatestVersion.value = response.data.tag_name;

    const store = useAppStore();
    const { productVersion } = storeToRefs(store);

    hasNewVersion.value = compareNewVersion(productVersion.value, githubLatestVersion.value);
  } catch (error) {
    console.error('Error fetching latest version:', error.message);
  }
};

export { getLatestVersion, githubLatestVersion, hasNewVersion };
