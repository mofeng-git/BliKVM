<template>
  <v-card class="custom-card-disavbled mx-auto wrap-text" width="auto">
    <v-sheet width="400">
      <div id="toolbar">
        <v-row dense no-gutters>
          <v-col cols="12">
            <!-- upload -->
            <v-btn-toggle
              :disabled="!canUnmount"
              density="compact"
              rounded="0"
              v-ripple
              variant="plain"
              mandatory
            >
              <v-tooltip
                ref="uploadButton"
                text="Tooltip"
                location="bottom center"
                content-class=""
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    width="auto"
                    class="flex-grow-1 text-none upload-drop-target"
                    flat
                    prepend-icon="mdi-upload"
                    append-icon="mdi-selection"
                    color="#76FF03"
                    v-ripple
                    title
                    @click="openUploader"
                    @dragenter.prevent="onDragEnter"
                    @dragover.prevent="onDragOver"
                    @dragleave.prevent="onDragLeave"
                    @drop.prevent="onDrop"
                  >
                    <template #prepend>
                      <v-icon color="#76FF03" />
                    </template>
                    <v-overlay contained :model-value="isDragging"></v-overlay>
                    <input
                      ref="fileInput"
                      type="file"
                      class="d-none"
                      multiple
                      @change="onFileChange"
                      @click="$event.stopPropagation()"
                    />
                  </v-btn>
                </template>
                {{ $t('settings.msd.uploadOrDrop') }}
              </v-tooltip>
            </v-btn-toggle>
            <!-- refresh -->
            <v-btn-toggle
              :disabled="!canUnmount"
              density="compact"
              rounded="0"
              v-ripple
              variant="plain"
              mandatory
            >
              <v-tooltip text="Tooltip" location="bottom center" content-class="">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    width="auto"
                    class="flex-grow-1 text-none"
                    flat
                    prepend-icon="mdi-refresh"
                    color="#76FF03"
                    v-ripple
                    title
                    @click="refreshVirtualMedia"
                  >
                    <template #prepend>
                      <v-icon color="#76FF03" />
                    </template>
                  </v-btn>
                </template>
                {{ $t('settings.msd.refreshList') }}
              </v-tooltip>
            </v-btn-toggle>

            <!-- Virtual Media Actions -->
            <v-btn-toggle
              v-model="virtualMediaAction"
              density="compact"
              rounded="0"
              v-ripple
              variant="plain"
              mandatory
            >
              <v-tooltip text="Tooltip" location="bottom center" content-class="">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    width="auto"
                    @click="createVirtualMedia"
                    :disabled="!canCreate"
                    class="flex-grow-1 text-none"
                    flat
                    prepend-icon="mdi-server-plus-outline"
                    color="#76FF03"
                    v-ripple
                    title
                  >
                    <template #prepend>
                      <v-icon color="#76FF03" />
                    </template>
                  </v-btn>
                </template>
                {{ $t('settings.msd.virtualMediaCreate') }}
              </v-tooltip>

              <v-tooltip text="Tooltip" location="bottom center" content-class="">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    width="auto"
                    @click="deleteVirtualMedia"
                    :disabled="!canDelete || !canConnect"
                    class="flex-grow-1 text-none"
                    flat
                    prepend-icon="mdi-server-minus-outline"
                    color="#76FF03"
                    v-ripple
                    title
                  >
                    <template #prepend> <v-icon color="#D32F2F" /> </template
                  ></v-btn>
                </template>
                {{ $t('settings.msd.virtualMediaDelete') }}
              </v-tooltip>
            </v-btn-toggle>

            <!-- Connection Actions -->
            <v-btn-toggle
              v-model="connectionAction"
              density="compact"
              rounded="0"
              v-ripple
              variant="plain"
              mandatory
              group
            >
              <v-tooltip text="Tooltip" location="bottom center" content-class="">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    width="auto"
                    @click="connectVirtualMedia"
                    :disabled="!canConnect"
                    class="flex-grow-1 text-none"
                    flat
                    prepend-icon="mdi-link"
                    color="#76FF03"
                    v-ripple
                    title
                  >
                    <template #prepend> <v-icon color="#76FF03" /> </template
                  ></v-btn> </template
                >{{ $t('settings.msd.connectVirtualMedia') }}
              </v-tooltip>

              <v-tooltip text="Tooltip" location="bottom center" content-class="">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    width="auto"
                    @click="disconnectVirtualMedia"
                    :disabled="!canDisconnect"
                    class="flex-grow-1 text-none"
                    flat
                    prepend-icon="mdi-link-off"
                    color="#76FF03"
                    v-ripple
                    title
                  >
                    <template #prepend> <v-icon color="#D32F2F" /> </template
                  ></v-btn>
                </template>
                {{ $t('settings.msd.disconnectVirtualMedia') }}
              </v-tooltip>
            </v-btn-toggle>
          </v-col>
          <!-- File management -->
          <v-btn-toggle
            v-model="mountImageAction"
            density="compact"
            rounded="0"
            v-ripple
            variant="plain"
            mandatory
            group
          >
            <v-tooltip text="Tooltip" location="bottom center" content-class="">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  width="auto"
                  @click="onMountClick"
                  :disabled="!canMount || isMounting"
                  :loading="isMounting"
                  class="flex-grow-1 text-none"
                  flat
                  prepend-icon="mdi-file-download-outline"
                  color="#76FF03"
                  v-ripple
                  title
                >
                  <template #prepend> <v-icon color="#76FF03" /> </template
                ></v-btn> </template
              >{{ $t('settings.msd.mountImage') }}
            </v-tooltip>

            <v-tooltip text="Tooltip" location="bottom center" content-class="">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  width="auto"
                  @click="onUnmountClick"
                  :disabled="!canUnmount || isUnmounting"
                  :loading="isUnmounting"
                  class="flex-grow-1 text-none"
                  flat
                  prepend-icon="mdi-file-document-remove-outline"
                  color="#76FF03"
                  v-ripple
                  title
                >
                  <template #prepend> <v-icon color="#D32F2F" /> </template
                ></v-btn>
              </template>
              {{ $t('settings.msd.unmountImage') }}
            </v-tooltip>
          </v-btn-toggle>
        </v-row>
        <v-row dense no-gutters>
          <v-col cols="12">
            <!-- Status Section -->
            <div class="mt-0">
              <v-chip :color="virtualMediaCreated === 'created' ? 'green' : 'grey'" class="ma-2">
                {{ $t('settings.msd.title') }}
                {{
                  virtualMediaCreated === 'created'
                    ? $t('settings.msd.created')
                    : $t('settings.msd.notCreated')
                }}
              </v-chip>

              <v-chip :color="virtualMediaConnected === 'connected' ? 'blue' : 'grey'">
                {{
                  virtualMediaConnected === 'connected'
                    ? $t('settings.msd.readyForUse')
                    : $t('common.disconnect')
                }}
              </v-chip>
            </div>
          </v-col>
        </v-row>
        <div class="d-flex ga-4 align-center flex-row">
          <v-label class="text-subtitlte-1">{{ $t('settings.msd.setMsdSize') }}</v-label>
          <v-slider
            class="flex-grow-1 mx-3"
            v-model="device.msd.imageSize"
            min="1"
            :max="maxMSDImageSize"
            step="1"
            hide-details
            color="#76FF03"
          >
            <template v-slot:append>
              <div
                :style="{
                  color: '#76FF03',
                  fontWeight: 'bold',
                  minWidth: '50px',
                  textAlign: 'right',
                }"
              >
                {{ device.msd.imageSize }} GB
              </div>
            </template>
          </v-slider>
        </div>
        <v-progress-linear
          :indeterminate="makeMSDImageProgress === 0 && makeMSDImageFlag"
          :model-value="makeMSDImageProgress > 0 ? makeMSDImageProgress : null"
          buffer-value="100"
          :active="makeMSDImageFlag"
          height="6"
          color="#76FF03"
          rounded
        ></v-progress-linear>
      </div>

      <div id="status-bar"></div>

      <div v-if="canUnmount" style="max-height: 230px; overflow-y: auto">
        <div class="mt-2 text-caption">
          {{ $t('common.used') }}: {{ formatSize(mountImageFiles.used) }} /
          {{ $t('common.total') }}: {{ formatSize(mountImageFiles.size) }} ({{ $t('common.free') }}
          {{ formatSize(mountImageFiles.size - mountImageFiles.used) }})
        </div>

        <v-list v-model:selected="selectedx" select-strategy="leaf">
          <v-list-item v-for="item in mountImageFiles.files" :key="item.name" :value="item.name">
            <v-tooltip :text="`${item.path}`" location="bottom center" content-class="">
              <template v-slot:activator="{ props }">
                <v-list-item-subtitle v-bind="props" :style="{ color: '#76FF03' }">{{
                  item.name
                }}</v-list-item-subtitle>
              </template>
            </v-tooltip>

            <v-list-item-subtitle class="text-high-emphasis">
              {{ convertBytesToMiB(item.imageSize) }} MiB
            </v-list-item-subtitle>
            <v-list-item-subtitle class="text-high-emphasis">{{
              localDate(item.date)
            }}</v-list-item-subtitle>

            <template v-slot:prepend="{ isSelected, select }">
              <v-list-item-action start>
                <v-checkbox-btn
                  v-model="selectedItems"
                  :value="item.name"
                  color="#76FF03"
                ></v-checkbox-btn>
              </v-list-item-action>
            </template>

            <template v-slot:append="{ isSelected }">
              <v-list-item-action class="align-end">
                <v-tooltip text="Tooltip" location="bottom center" content-class="">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      size="x-small"
                      flat
                      color="#76FF03"
                      v-ripple
                      tile
                      variant="tonal"
                      @click="copyClipboard(item.path)"
                      >mdi-content-copy
                    </v-icon>
                  </template>
                  {{ $t('common.copy') }}
                </v-tooltip>

                <v-tooltip text="Tooltip" location="bottom center">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      flat
                      size="x-small"
                      color="#76FF03"
                      v-ripple
                      tile
                      style="cursor: pointer"
                      @click="downloadFile(item.name)"
                    >
                      mdi-download
                    </v-icon>
                  </template>
                  {{ $t('common.download') }}
                </v-tooltip>

                <v-tooltip text="Tooltip" location="bottom center" content-class="">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      size="x-small"
                      color="#76FF03"
                      v-ripple
                      @click="openDeleteMsdImageDialog(item)"
                      >mdi-trash-can-outline
                    </v-icon>
                  </template>
                  {{ $t('common.delete') }}
                </v-tooltip>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-sheet>
  </v-card>

  <DialogDeleteImage @refreshImageList="refreshVirtualMedia" />
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';

  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  import { useConversion } from '@/composables/useConversion';
  import { useAlert } from '@/composables/useAlert';
  import { useVirtualMedia } from '@/composables/useVirtualMedia';
  import { useTusUpload } from '@/composables/useTusUpload';
  import { useClipboard } from '@/composables/useClipboard';
  import { useDevice } from '@/composables/useDevice';
  import '@uppy/core/dist/style.min.css';
  import '@uppy/status-bar/dist/style.min.css';

  const store = useAppStore();

  const { device } = useDevice();
  const { isProcessing, msd, selectedItem, deleteImageDialog } = storeToRefs(store);

  const { formatDate, convertBytesToMiB, convertBytesToGB, convertBytesToGiB } = useConversion();
  const { sendAlert } = useAlert();
  const {
    virtualMediaCreated,
    virtualMediaConnected,
    canCreate,
    canDelete,
    canConnect,
    canDisconnect,
    selectedItems,
    selectedx,
    makeMSDImageProgress,
    makeMSDImageFlag,
    fetchState,
    createMedia,
    deleteMedia,
    connectMedia,
    disconnectMedia,
    maxMSDImageSize,
    fetchFilesList,
    mountImageFiles,
    canMount,
    canUnmount,
    mountMedia,
    unmountMedia,
    fetchMntSize,
    downloadFile,
  } = useVirtualMedia();
  const { copyClipboard } = useClipboard();

  // Initialize the TUS upload composable
  const {
    uppy,
    isDragging,
    initializeUppy,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    setFileInputRef,
    cleanup,
  } = useTusUpload();

  const localDate = (dt) => {
    return computed(() => new Date(dt).toLocaleString());
  };

  // Toggle models
  const virtualMediaAction = ref(null); // 'create' or 'delete'
  const connectionAction = ref(null); // 'connect' or 'disconnect'
  const mountImageAction = ref(null); // 'mount' or 'unmount'
  const loading = ref(false);
  const isMounting = ref(false);
  const isUnmounting = ref(false);

  // Component state
  const fileInput = ref(null);
  const uploadButton = ref(null);

  // 格式化容量显示
  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  }

  const onFileChange = (event) => {
    console.log('File input change event fired');
    const files = Array.from(event.target.files);

    if (files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log(
      `Selected ${files.length} files:`,
      files.map((f) => f.name)
    );

    files.forEach((file) => {
      try {
        if (uppy.value) {
          uppy.value.addFile({
            source: 'file input',
            name: file.name,
            type: file.type,
            data: file,
          });
        }
      } catch (err) {
        if (err.isRestriction) {
          console.log('Restriction error:', err);
        } else {
          console.error('Error adding file:', err);
        }
      }
    });

    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const openUploader = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (fileInput.value) {
      console.log('📂 Triggering file input click');
      fileInput.value.click();
    } else {
      console.error('❌ fileInput ref is null');
    }
  };

  // Add the drag and drop handlers
  const onDragEnter = (event) => {
    handleDragEnter(event);
  };

  const onDragOver = (event) => {
    handleDragOver(event);
  };

  const onDragLeave = (event) => {
    handleDragLeave(event);
  };

  const onDrop = (event) => {
    handleDrop(event); // uploadConfig);
  };

  ////////////////////

  function handleDoneButtonClick() {
    uppy.value.clear();
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'cancelled':
        return 'warning';
      case 'uploading':
        return 'primary';
      default:
        return 'grey';
    }
  };

  // Handlers
  const refreshVirtualMedia = async () => {
    let status = '';
    let title = '';
    let message = '';

    try {
      await fetchFilesList();
    } catch (error) {
      status = 'error';
      title = 'Failed to refresh Virtual Media.';
      message = 'Please try again.';
      sendAlert(status, title, message);
    } finally {
    }
  };

  const createVirtualMedia = async () => {
    if (virtualMediaCreated.value === 'creating' || virtualMediaCreated.value === 'created') {
      return;
    }
    // indicate the process has started
    virtualMediaCreated.value = 'creating';

    try {
      await createMedia();
    } catch (error) {
      sendAlert(
        'error',
        'Virtual Media created Error',
        error?.message || 'Failed to create Virtual Media'
      );
    }
  };

  const deleteVirtualMedia = async () => {
    isProcessing.value = true;

    // Only allow delete if virtual media is in 'created' state
    if (virtualMediaCreated.value !== 'created') return;

    // Optimistically reset states
    virtualMediaCreated.value = null; // or maybe 'deleting' if you want an interim state
    virtualMediaConnected.value = null;
    virtualMediaAction.value = 'delete';
    connectionAction.value = null;

    await deleteMedia(); // actual API call to delete the media

    sendAlert('success', 'Virtual Media deleted.', 'Create Virtual Media before connecting to it.');
    isProcessing.value = false;
  };

  const connectVirtualMedia = async () => {
    isProcessing.value = true;
    if (virtualMediaCreated.value !== 'created') return;

    try {
      await connectMedia(); // This is the method you'll define for making the connection.
    } catch (error) {
      console.error('Failed to connect virtual media:', error);
      virtualMediaAction.value = 'create'; // Revert action to 'create' if connection fails
    }
    isProcessing.value = false;
  };

  const disconnectVirtualMedia = async () => {
    isProcessing.value = true;
    if (!virtualMediaConnected.value) return;
    virtualMediaConnected.value = false;
    connectionAction.value = 'disconnect';

    try {
      await disconnectMedia(); // This is the method you'll define for making the connection.

      sendAlert('success', 'MSD', 'Disconnected from Virtual Media.');
    } catch (error) {
      console.error('Failed to connect virtual media:', error);
      virtualMediaAction.value = 'delete'; // Revert action to 'create' if connection fails
    }
    isProcessing.value = false;
  };

  // Reference to the child component
  const deleteMsdDialog = ref(null);

  const openDeleteMsdImageDialog = (item) => {
    selectedItem.value = item;
    deleteImageDialog.value = true;
  };

  const handleRefreshMSDListClick = async () => {
    loading.value = true;
    try {
      await fetchFilesList();
      // Perform other actions upon success
    } catch (error) {
      // Handle errors
      sendAlert('error', 'MSD', `Error refreshing MSD list:` + error.message);
    } finally {
      loading.value = false;
    }
  };

  const onMountClick = async () => {
    if (isMounting.value) return;
    isMounting.value = true;
    try {
      await mountMedia();
    } catch (error) {
      sendAlert('error', 'MSD Mount Error', error?.message || 'Mount failed');
    } finally {
      isMounting.value = false;
    }
  };

  const onUnmountClick = async () => {
    if (isUnmounting.value) return;
    isUnmounting.value = true;
    try {
      await unmountMedia();
    } catch (error) {
      sendAlert('error', 'MSD Unmount Error', error?.message || 'Unmount failed');
    } finally {
      isUnmounting.value = false;
    }
  };

  watch(
    () => makeMSDImageProgress.value,
    (newVal, oldVal) => {
      if (newVal === 100 && oldVal < 100) {
        sendAlert(
          'info',
          'MSD Image Creation',
          'During disk synchronization, it takes approximately 10s'
        );
      }
    }
  );

  onMounted(async () => {
    try {
      // Set the file input reference for the composable
      setFileInputRef(fileInput.value);

      // Initialize Uppy with configuration
      initializeUppy({
        onUploadSuccess: (file, response) => {
          console.log(`File ${file.name} uploaded successfully`, response);
          // Refresh the file list after successful upload
          handleRefreshMSDListClick();
        },
        onUploadError: (file, error) => {
          console.error(`Upload failed for ${file.name}:`, error);
          sendAlert('error', 'Upload Failed', `Failed to upload ${file.name}`);
        },
        onComplete: (result) => {
          console.log('All uploads completed', result);
          if (result.successful.length > 0) {
            sendAlert(
              'success',
              'Upload Complete',
              `Successfully uploaded ${result.successful.length} file(s)`
            );
          }
        },
        statusBarTarget: '#status-bar',
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        autoProceed: true,
        debug: false,
      });

      // Fetch initial data
      await fetchState();
      await fetchFilesList();
      fetchMntSize();
    } catch (error) {
      sendAlert('error', 'Initialization Error', 'Failed to initialize upload component');
    }
  });

  onUnmounted(() => {
    // Cleanup when component is destroyed
    cleanup();
  });
</script>

import '@uppy/core/dist/style.min.css';
<style src="@uppy/core/dist/style.css"></style>
<style src="@uppy/status-bar/dist/style.min.css"></style>

<style scoped>
  .toolbar {
    background-color: #000;
    color: white;
    flex-shrink: 0;
    /* Prevent shrinking of the toolbar */
    box-sizing: border-box;
    /* Include padding in height calculation */
  }
</style>
