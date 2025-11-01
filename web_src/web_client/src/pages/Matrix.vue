<template>
  <v-app>
    <!-- Only show UserInitScreen for 400ms -->
    <UserInitScreen v-if="showInitScreen" />

    <!-- Main UI shown only after UserInitScreen disappears -->
    <AppNavDrawer v-else />

    <v-main class="main-layout">
      <div class="app-container" @mousemove="handleMouseMove">
        <v-container fluid class="video-container">
          <v-progress-linear
            v-if="!hasValidStream"
            :active="isProcessing"
            :indeterminate="isProcessing"
            :color="isProcessing ? '#76FF03' : '#D32F2F'"
            rounded
            height="1"
          ></v-progress-linear>

          <AppToolbar :z-index="zIndex.toolbar" class="toolbar" />

          <div class="video-center-wrapper">
            <AppKVM />
          </div>
        </v-container>
      </div>
      <AppFooter />
    </v-main>

    <AppAbout v-if="can('manage', 'all')" />
    <AppAlert v-if="!can('manage', 'all')" />
    <AppAlert v-if="can('manage', 'all')" />

    <Reconnect />
    <DialogAboutPage />
    <DialogUpdate />
    <DialogManageAccount />
    <DialogCtrlAltDelConfirm />
    <DialogTextPaste />
  </v-app>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { useAbility } from '@casl/vue';
  import AppToolbar from '@/components/AppToolbar.vue';
  import Reconnect from '@/components/Reconnect.vue';
  import DialogManageAccount from '@/components/dialog/DialogManageAccount.vue';
  import DialogCtrlAltDelConfirm from '@/components/dialog/DialogCtrlAltDelConfirm.vue';
  import DialogTextPaste from '@/components/dialog/DialogTextPaste.vue';
  import { useI18n } from 'vue-i18n';
  import { zIndex } from '@/styles/zIndex';

  const store = useAppStore();
  const { device } = useDevice();
  const { can } = useAbility();

  const { t } = useI18n();

  const { isProcessing, toolbar, showAboutPageDialog, hasValidStream, footer, misc } =
    storeToRefs(store);
  const showInitScreen = ref(true);
  // TODO 2025-05-18 this needs to be move elsewhere
  const handleMouseMove = (event) => {
    const mouseY = event.clientY;
    const containerHeight = event.currentTarget.clientHeight;

    // Show toolbar if near the top
    if (toolbar.value) {
      toolbar.value.visible = mouseY <= 50;
    }
    // Show footer if near the bottom (assumes 600px total height)
    if (footer.value) {
      footer.value.showFooter = mouseY >= containerHeight - 30;
    }
  };

  watch(
    () => [
      device.value.video.videoMode,
      device.value.video.resolution,
      device.value.video.resolutionRatio,
      device.value.refreshRate,
    ],
    ([newVideoMode, newResolution, newResolutionRatio, newRefreshRate]) => {
      const translatedTitle = t('app.defaultTitle');
      document.title = `${translatedTitle} ${newVideoMode} ${newResolution}@${newRefreshRate} (${newResolutionRatio}) 30fps xxx kbps`;
    },
    { immediate: true }
  );

  onMounted(() => {
    const cursorStatus = localStorage.getItem('cursorStatus');
    if (cursorStatus) {
      misc.value.isLocalCursorVisible = cursorStatus === 'true';
    }
    const cursorValue = localStorage.getItem('cursorValue');
    if (cursorValue) {
      misc.value.currentCursor = cursorValue;
    }

    // Check if user wants to see the about dialog after login
    const skipAboutDialog = localStorage.getItem('skipAboutDialogAfterLogin');
    if (skipAboutDialog !== 'true') {
      // Show the about dialog after a short delay
      setTimeout(() => {
        showAboutPageDialog.value = true;
      }, 500);
    }

    setTimeout(() => {
      showInitScreen.value = false;
    }, 1);
  });
</script>

<style scoped>
  html,
  body,
  #app {
    height: 100%;
    margin: 0;
    overflow: hidden;
  }

  .app-container {
    position: relative;
    flex-grow: 1;
    /* flex: 1;   2025-02-25  */
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .toolbar {
    position: absolute;
    /* Position the toolbar absolutely within the app-container */
    left: 50%;
    top: 7px;
    transform: translateX(-50%);

    border-radius: 30px;
    background-color: var(--v-primary-base);
    z-index: 1000;
    transition:
      opacity 0.3s ease,
      top 0.3s ease;
    display: flex;
    /* Ensure elements like icons stay in one line */
    justify-content: center;
    /* Center content */
    align-items: center;
    /* Center vertically */
    width: auto;
    height: auto;
    white-space: nowrap;
    /* Prevent text and icons from wrapping */
    overflow: hidden;
  }

  .main-layout {
    display: flex;
    flex-direction: column;
    height: calc(var(--vh, 1vh) * 100);
    width: 100%;
  }

  .video-container {
    flex: 1 1 auto;
    display: flex;
    overflow: hidden;
    padding: 0;
  }

  .video-center-wrapper {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .video-element {
    /* not necessary */
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .footer-container {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    z-index: 1001;
  }
</style>
