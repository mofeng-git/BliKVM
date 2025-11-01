/* not implemented */

import { ref } from 'vue';
import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { useDevice } from '@/composables/useDevice';
import { useConversion } from '@/composables/useConversion.js';
import Config from '@/config.js';

//make
const maxMSDImageSize = ref(5);
const makeMSDImageFlag = ref(false);
const makeMSDImageProgress = ref(0);
const imageMakeResultText = ref('');
const items = ref();
const selectedItems = ref([]); // checkbox
const selectedx = ref([]);
const availableImage = ref(false);
const { device } = useDevice();
const mountImageFiles = ref([]);
const virtualMediaMount = ref(false); // null, creating, created

// set initial state
const MsdImageCreateState = {
  None: 'none',
  NotCreated: 'not_created',
  Created: 'created',
};
const MsdImageConnectState = {
  None: 'none',
  NotConnect: 'not_connected',
  Connected: 'connected',
};

export function useVirtualMedia() {
  const { convertBytesToGB } = useConversion();
  const { sendAlert } = useAlert();

  const store = useAppStore();

  // State tracking creation and connection status with 3 possible states: null, creating/connecting, created/connected
  const virtualMediaCreated = ref(null); // null, creating, created
  const virtualMediaConnected = ref(null); // null, connecting, connected
  const error = ref(null);

  const canCreate = computed(
    () =>
      virtualMediaCreated.value === null ||
      virtualMediaCreated.value === undefined ||
      virtualMediaCreated.value === 'not_created'
  );
  const canDelete = computed(() => virtualMediaCreated.value === 'created');
  const canConnect = computed(
    () =>
      virtualMediaCreated.value === 'created' &&
      virtualMediaConnected.value !== 'connected' &&
      virtualMediaMount.value === false
  );
  const canDisconnect = computed(() => virtualMediaConnected.value === 'connected');
  const canMount = computed(
    () =>
      virtualMediaCreated.value === 'created' &&
      virtualMediaConnected.value === 'not_connected' &&
      virtualMediaMount.value === false
  );
  const canUnmount = computed(() => virtualMediaMount.value === true);

  const updateMsdConnectState = (state) => {
    console.log('current CONNECT state:', state);

    try {
      switch (state) {
        case MsdImageConnectState.NotConnect:
          virtualMediaConnected.value = MsdImageConnectState.NotConnect;
          return;
        case MsdImageConnectState.Connected:
          virtualMediaConnected.value = MsdImageConnectState.Connected;
          return;
        default:
          virtualMediaConnected.value = MsdImageConnectState.None;
          return;
      }
    } catch (error) {}
  };

  const fetchImageList = async (selected) => {
    try {
      if (!selected) return;
      const response = await http.post(`/msd/images`);
      if (response.status === 200 && response.data.code === 0) {
        items.value = response.data.data;
        // Calculate MSD free space in GB with 2 decimal precision (e.g., "18.99")
        // Previously used Math.floor() which truncated decimals (18.99 -> 18)
        maxMSDImageSize.value = convertBytesToGB(items.value.size - items.value.used);
      } else {
        console.log('/msd/images post error');
      }
    } catch (error) {
      console.error('Error during getting MSD image list:', error);
    }
  };

  const fetchMntSize = async () => {
    try {
      const response = await http.get(`/msd/size`);
      if (response.status === 200 && response.data.code === 0) {
        const { used, size } = response.data.data;
        console.log('used:', used, 'size:', size);
        maxMSDImageSize.value = convertBytesToGB(size - used);
        device.value.msd.mntTotalSize = convertBytesToGB(size);
        device.value.msd.mntUsedSize = convertBytesToGB(used);
        // Update your state with the fetched values
      } else {
        const title = 'Fetch MSD Size';
        const message = response.data.msg || 'Error';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Fetch MSD Size';
      const message = error.message || 'Error';
      sendAlert('error', title, message);
    }
  };

  const fetchFilesList = async () => {
    try {
      if (virtualMediaMount.value === false) {
        return;
      }
      const response = await http.get(`/msd/files`);
      if (response.status === 200 && response.data.code === 0) {
        mountImageFiles.value = response.data.data;
      } else {
        console.log('/msd/images post error');
      }
    } catch (error) {
      console.error('Error during getting MSD image list:', error);
    }
  };

  const fetchState = async () => {
    try {
      const response = await http.post('/msd/state');
      if (response.status === 200 && response.data.code === 0) {
        virtualMediaCreated.value = response.data.data.msd_img_created;
        virtualMediaMount.value = response.data.data.file_mount_flag === 'true' ? true : false;
        updateMsdConnectState(response.data.data.msd_status);
        store.tusPort = response.data.data.tusPort;
      } else {
        console.error('fetchState error:', response.data);
      }
    } catch (error) {
      const title = 'MSD State Fetch Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  function downloadFile(fileName) {
    if (!fileName) return;
    // Use relative URL to avoid mixed-content/cert/port mismatch issues
    const url = `/api/virtual-media/${encodeURIComponent(fileName)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const createMedia = async () => {
    let progressInterval;
    try {
      const requestBody = {
        type: 'ventoy',
        name: 'ventoy',
        size: device.value.msd.imageSize,
      };

      // TODO move this out in a method
      progressInterval = setInterval(async () => {
        try {
          const progressResponse = await http.post('/msd/create/progress');
          if (progressResponse.status === 200) {
            const progressData = progressResponse.data;
            makeMSDImageProgress.value = progressData.data;
            console.log(
              'progressResponse.data:',
              progressResponse.data,
              ' make image progress:',
              makeMSDImageProgress.value
            );
          } else {
            console.error('Failed to fetch make image progress:', progressResponse);
          }
        } catch (error) {
          console.error('Error fetching make image progress:', error);
        }
      }, 1000);
      makeMSDImageFlag.value = true;
      const response = await http.post('/msd/create', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        const title = 'MSD Creation Status: Successfully Created';
        const message = 'Please connect the MSD before using it.';
        sendAlert('success', title, message);
      } else {
        const title = 'MSD Creation Status: Failed to create MSD';
        const message = `There was an issue creating the MSD. ${response.data.msg}. Please try again.`;
        sendAlert('error', title, message);
      }
      makeMSDImageProgress.value = 0;
      makeMSDImageFlag.value = false;
      clearInterval(progressInterval);
      availableImage.value = true;
      imageMakeResultText.value = response.data.msg;
      await fetchState();
    } catch (error) {
      error.value = error;
      virtualMediaCreated.value = null; // reset on error

      makeMSDImageProgress.value = 0;
      makeMSDImageFlag.value = false;
      clearInterval(progressInterval);

      const title = 'MSD Creation Status: Failed to create MSD';
      const message = `There was an issue creating the MSD. ${error}. Please try again.`;
      sendAlert('error', title, message);
    }
  };

  const deleteMedia = async () => {
    try {
      const response = await http.post('/msd/remove');
      virtualMediaCreated.value = 'null';
      await fetchState();

      // TODO should we also not refresh the list?
    } catch (error) {
      const title = 'MSD Connection Status: Failed to Connect';
      const message = 'There was an issue connecting the MSD. Please try again.';
      sendAlert('error', title, message);
      virtualMediaCreated.value = 'created';
    }
  };

  const connectMedia = async () => {
    try {
      const action = true;
      const response = await http.post(`/msd/connect?action=${action}`);
      await fetchState();
    } catch (error) {
      const title = 'MSD Connection Status: Failed to Connect';
      const message = 'There was an issue connecting the MSD. Please try again.';
      sendAlert('error', title, message);
    }

    console.log('connectMedia end');
  };

  const disconnectMedia = async () => {
    try {
      const action = false;
      const response = await http.post(`/msd/connect?action=${action}`);
      virtualMediaCreated.value = 'created';
      virtualMediaConnected.value = 'not_connected';
    } catch (error) {
      virtualMediaCreated.value = 'created';
      virtualMediaConnected.value = 'connected';

      throw new Error('Connection failed');
    }

    console.log('disconnectMedia end');
  };

  const mountMedia = async () => {
    try {
      const response = await http.post('/msd/mount?action=mount');
      if (response.status === 200 && response.data.code === 0) {
        virtualMediaCreated.value = response.data.data.msd_img_created;
        virtualMediaMount.value = response.data.data.file_mount_flag === 'true' ? true : false;
        updateMsdConnectState(response.data.data.msd_status);
        await fetchFilesList();
      }
    } catch (error) {
      const title = 'MSD Mount Error';
      const message = error.message || 'There was an issue mounting the MSD. Please try again.';
      sendAlert('error', title, message);
    }
  };

  const unmountMedia = async () => {
    try {
      const response = await http.post('/msd/mount?action=unmount');
      if (response.status === 200 && response.data.code === 0) {
        virtualMediaCreated.value = response.data.data.msd_img_created;
        virtualMediaMount.value = response.data.data.file_mount_flag === 'true' ? true : false;
        updateMsdConnectState(response.data.data.msd_status);
      }
    } catch (error) {
      const title = 'MSD unmount Error';
      const message = error.message || 'There was an issue unmounting the MSD. Please try again.';
      sendAlert('error', title, message);
    }
  };

  return {
    items,
    maxMSDImageSize,
    availableImage,
    makeMSDImageFlag,
    makeMSDImageProgress,
    imageMakeResultText,
    virtualMediaCreated,
    virtualMediaConnected,
    canCreate,
    canDelete,
    canConnect,
    canDisconnect,
    fetchState,
    createMedia,
    deleteMedia,
    connectMedia,
    disconnectMedia,
    error,
    fetchImageList,
    updateMsdConnectState,
    selectedItems,
    selectedx,
    downloadFile,
    fetchFilesList,
    mountImageFiles,
    canMount,
    mountMedia,
    unmountMedia,
    fetchMntSize,
    canUnmount,
  };
}
