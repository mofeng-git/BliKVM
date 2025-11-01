// composables/useTusUpload.js
import { ref, computed } from 'vue';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import StatusBar from '@uppy/status-bar';
import Config from '@/config.js';

export function useTusUpload() {
  // Reactive state
  const uppy = ref(null);
  const isDragging = ref(false);
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const dragCounter = ref(0); // Track nested drag events
  const fileInput = ref(null);

  // Computed properties
  const canUpload = computed(() => uppy.value && !isUploading.value);

  /**
   * Initialize Uppy with TUS upload configuration
   * @param {Object} options - Configuration options
   * @param {Function} options.onUploadSuccess - Callback for successful uploads
   * @param {Function} options.onUploadError - Callback for upload errors
   * @param {Function} options.onComplete - Callback when all uploads complete
   * @param {string} options.statusBarTarget - CSS selector for status bar
   */
  const initializeUppy = (options = {}) => {
    const {
      onUploadSuccess,
      onUploadError,
      onComplete,
      statusBarTarget = '#status-bar',
      chunkSize = 5 * 1024 * 1024, // 5MB default
      autoProceed = true,
      debug = false,
      // ,maxFileSize = //TODO make the maxFileSize dependeny on /mnt volume size?
    } = options;

    try {
      uppy.value = new Uppy({
        id: 'tus-uploader',
        autoProceed,
        debug,
        restrictions: {
          //TODO make the maxFileSize dependeny on /mnt volume size?
          maxFileSize: null, // No size limit by default
          allowedFileTypes: null, // Allow all file types by default
        },
      })
        .use(Tus, {
          endpoint: `${Config.http_protocol}//${Config.host_ip}${Config.host_port}/tus`,
          chunkSize,
          // Disable resume functionality to prevent 404 HEAD requests
          resume: false,
          storeFingerprintForResuming: false,
          removeFingerprintOnSuccess: true,
          retryDelays: [0, 1000],
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
          // Handle resume-related errors gracefully
          onShouldRetry: (error, retryAttempt, retryOptions) => {
            if (error.message && error.message.includes('404')) {
              console.log('Ignoring 404 error (resume check failed, but upload works)');
              return false;
            }
            return retryAttempt < retryOptions.retryDelays.length;
          },
        })
        .use(StatusBar, {
          target: statusBarTarget,
          hideUploadButton: false,
          hideRetryButton: false,
          hidePauseResumeButton: false,
          hideCancelButton: false,
          showProgressDetails0: true,
        });

      // Event listeners
      uppy.value.on('upload', () => {
        isUploading.value = true;
        uploadProgress.value = 0;
      });

      uppy.value.on('progress', (progress) => {
        uploadProgress.value = progress;
      });

      uppy.value.on('upload-success', (file, response) => {
        console.log(`Successfully uploaded ${file.name}`, response);
        if (onUploadSuccess) {
          onUploadSuccess(file, response);
        }
      });

      uppy.value.on('upload-error', (file, error) => {
        console.error(`Failed to upload ${file.name}`, error);
        if (onUploadError) {
          onUploadError(file, error);
        }
      });

      uppy.value.on('complete', (result) => {
        isUploading.value = false;
        console.log('All uploads finished', result);
        if (onComplete) {
          onComplete(result);
        }
      });

      uppy.value.on('cancel-all', () => {
        isUploading.value = false;
        uploadProgress.value = 0;
      });

      console.log('✅ Uppy initialized successfully');
      return uppy.value;
    } catch (error) {
      console.error('❌ Error initializing Uppy:', error);
      throw error;
    }
  };

  /**
   * Handle file input change event
   * @param {Event} event - File input change event
   */
  const handleFileInput = (event) => {
    console.log('📁 File input change event fired');

    // Prevent default behavior
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      console.log('⚠️ No files selected');
      return;
    }

    console.log(
      `Selected ${files.length} files:`,
      files.map((f) => f.name)
    );
    addFilesToUppy(files);

    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  /**
   * Open file explorer dialog
   * @param {Event} event - Click event
   */
  const openFileDialog = (event) => {
    console.log('🖱️ Opening file dialog');

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

  /**
   * Handle drag enter event
   * @param {DragEvent} event - Drag event
   */
  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.value++;

    if (dragCounter.value === 1) {
      isDragging.value = true;
      console.log('🎯 Drag enter detected');
    }
  };

  /**
   * Handle drag over event
   * @param {DragEvent} event - Drag event
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Set the drop effect
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  };

  /**
   * Handle drag leave event
   * @param {DragEvent} event - Drag event
   */
  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.value--;

    if (dragCounter.value === 0) {
      isDragging.value = false;
      console.log('🎯 Drag leave detected');
    }
  };

  /**
   * Handle drop event
   * @param {DragEvent} event - Drop event
   */
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Reset drag state
    isDragging.value = false;
    dragCounter.value = 0;

    const files = Array.from(event.dataTransfer?.files || []);

    if (files.length === 0) {
      console.log('⚠️ No files dropped');
      return;
    }

    console.log(
      `🎯 Dropped ${files.length} files:`,
      files.map((f) => f.name)
    );
    addFilesToUppy(files);
  };

  /**
   * Add files to Uppy instance
   * @param {File[]} files - Array of File objects
   */
  const addFilesToUppy = (files) => {
    if (!uppy.value) {
      console.error('❌ Uppy not initialized');
      return;
    }

    files.forEach((file, index) => {
      try {
        uppy.value.addFile({
          source: 'local',
          name: file.name,
          type: file.type,
          data: file,
          meta: {
            // Add any metadata you need
            originalIndex: index,
            uploadedAt: new Date().toISOString(),
          },
        });
        console.log(`✅ Added file: ${file.name}`);
      } catch (error) {
        if (error.isRestriction) {
          console.warn(`⚠️ File restriction error for ${file.name}:`, error.message);
        } else {
          console.error(`❌ Error adding file ${file.name}:`, error);
        }
      }
    });
  };

  /**
   * Start upload manually (if autoProceed is false)
   */
  const startUpload = () => {
    if (!uppy.value) {
      console.error('❌ Uppy not initialized');
      return;
    }

    return uppy.value.upload();
  };

  /**
   * Cancel all uploads
   */
  const cancelAllUploads = () => {
    if (!uppy.value) return;

    uppy.value.cancelAll();
    isUploading.value = false;
    uploadProgress.value = 0;
    console.log('🛑 All uploads cancelled');
  };

  /**
   * Cancel specific upload
   * @param {string} fileId - File ID to cancel
   */
  const cancelUpload = (fileId) => {
    if (!uppy.value) return;

    uppy.value.removeFile(fileId);
    console.log(`🛑 Upload cancelled for file: ${fileId}`);
  };

  /**
   * Clear all files from Uppy
   */
  const clearFiles = () => {
    if (!uppy.value) return;

    uppy.value.clear();
    uploadProgress.value = 0;
    console.log('🧹 All files cleared');
  };

  /**
   * Get current upload queue
   */
  const getUploadQueue = () => {
    if (!uppy.value) return [];

    return Object.values(uppy.value.getFiles());
  };

  /**
   * Get total progress across all files
   */
  const getTotalProgress = () => {
    if (!uppy.value) return 0;

    const files = uppy.value.getFiles();
    if (files.length === 0) return 0;

    const totalProgress = files.reduce((sum, file) => sum + (file.progress?.percentage || 0), 0);
    return Math.round(totalProgress / files.length);
  };

  /**
   * Set file input reference
   * @param {HTMLInputElement} inputRef - File input element reference
   */
  const setFileInputRef = (inputRef) => {
    fileInput.value = inputRef;
  };

  /**
   * Cleanup function
   */
  const cleanup = () => {
    if (uppy.value) {
      uppy.value.destroy();
      uppy.value = null;
    }
    isDragging.value = false;
    isUploading.value = false;
    uploadProgress.value = 0;
    dragCounter.value = 0;
  };

  return {
    // State
    uppy,
    isDragging,
    isUploading,
    uploadProgress,
    canUpload,

    // Methods
    initializeUppy,
    handleFileInput,
    openFileDialog,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    addFilesToUppy,
    startUpload,
    cancelAllUploads,
    cancelUpload,
    clearFiles,
    getUploadQueue,
    getTotalProgress,
    setFileInputRef,
    cleanup,
  };
}
