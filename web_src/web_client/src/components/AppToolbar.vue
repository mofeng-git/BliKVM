<template>
  <v-toolbar
    v-if="toolbar.visible || toolbar.pinned"
    height="30"
    elevation="10"
    app="false"
    dense
    short
    flat
    color="black"
  >
    <template #prepend>
      <div class="toolbar-content">
        <v-icon color="#76FF03" :class="{ 'pin-active': toolbar.pinned }" @click.stop="pinMenu">
          {{ toolbar.pinned ? 'mdi-pin-outline' : 'mdi-pin-off-outline' }}
        </v-icon>
      </div>
    </template>

    <slot name="toolbar-title">
      <span style="text-transform: none; margin-left: 4px">
        {{ systeminfo.hostname }}
      </span>
    </slot>

    <template v-if="$vuetify.display.smAndUp">
      <v-divider class="mx-1 align-self-center" length="24" thickness="2" vertical></v-divider>
    </template>

    <v-tooltip location="top" content-class="">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon
          :color="device.isDisconnected ? '#D32F2F' : '#76FF03'"
          class="toolbar-icon"
          v-bind="tooltipProps"
          style="cursor: pointer"
        >
          {{ device.isDisconnected ? 'mdi-lan-disconnect' : 'mdi-lan-connect' }}
        </v-icon>
      </template>
      <span>{{ device.isDisconnected ? $t('common.disconnect') : $t('common.connect') }}</span>
    </v-tooltip>

    <v-tooltip location="top" content-class="">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon class="toolbar-icon" v-bind="tooltipProps" @click="handleClick('settings')">
          mdi-cog-outline
        </v-icon>
      </template>
      <span>{{ $t('common.configure') }}</span>
    </v-tooltip>

    <v-tooltip location="top" content-class="">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon
          v-bind="tooltipProps"
          :color="showOverlay ? '#76FF03' : '#42A5F5'"
          @click="handleClick('overlay')"
        >
          {{ showOverlay ? 'mdi-layers-outline' : 'mdi-layers-off-outline' }}
        </v-icon>
      </template>
      <span>{{ showOverlay ? $t('common.overlayOff') : $t('common.overlayOn') }}</span>
    </v-tooltip>

    <v-tooltip location="top" content-class="">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon v-bind="tooltipProps" color="#FFD600" @click="handleClick('lock')">
          mdi-lock
        </v-icon>
      </template>
      <span>{{ $t('common.send') }} Ctrl+Alt+Del</span>
    </v-tooltip>

    <v-tooltip v-if="!isFullscreen" location="top" content-class="">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon v-bind="tooltipProps" @click="toggleFullscreen"> mdi-fullscreen </v-icon>
      </template>
      <span>{{ $t('common.fullscreenMode') }}</span>
    </v-tooltip>

    <v-tooltip location="top" content-class="">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon v-bind="tooltipProps" :color="healthIconColor"> mdi-heart-pulse </v-icon>
      </template>
      <span>{{ device.health.status }}</span>
    </v-tooltip>

    <!-- Always show keyboard, video, mouse icons -->
    <v-tooltip v-if="!device?.isDisconnected" location="top" content-class="">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon
          class="toolbar-icon"
          v-bind="tooltipProps"
          :color="device.hid.isActive && device.hid.keyboard.isActive ? '#76FF03' : '#D32F2F'"
          style="cursor: default"
          >mdi-keyboard</v-icon
        >
      </template>
      <span
        >{{ $t('common.keyboard') }}
        {{
          device.hid.isActive && device.hid.keyboard.isActive
            ? $t('common.active')
            : $t('common.inactive')
        }}</span
      >
    </v-tooltip>

    <v-tooltip v-if="!device?.isDisconnected" location="top" content-class="">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon
          class="toolbar-icon"
          v-bind="tooltipProps"
          :color="isVideoActive ? '#76FF03' : '#D32F2F'"
          style="cursor: default"
          >mdi-monitor</v-icon
        >
      </template>
      <span
        >{{ $t('settings.device.video.title') }}
        {{ isVideoActive ? $t('common.active') : $t('common.inactive') }}</span
      >
    </v-tooltip>

    <v-tooltip v-if="!device?.isDisconnected" location="top" content-class="">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon
          class="toolbar-icon"
          v-bind="tooltipProps"
          :color="device.hid.isActive && device.hid.mouse.isActive ? '#76FF03' : '#D32F2F'"
          style="cursor: default"
          >mdi-mouse</v-icon
        >
      </template>
      <span
        >{{ $t('common.mouse') }}
        {{
          device.hid.isActive && device.hid.mouse.isActive
            ? $t('common.active')
            : $t('common.inactive')
        }}</span
      >
    </v-tooltip>

    <AppToolbarOperations v-if="!device?.isDisconnected && toolbar.expanded" />
    <AppToolbarExpanded v-if="toolbar.expanded" />

    <template #append>
      <v-icon color="#76FF03" @click.stop="toggleToolbarExpansion">
        {{ toolbar.expanded ? 'mdi-chevron-double-left' : 'mdi-chevron-double-right' }}
      </v-icon>
    </template>
  </v-toolbar>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { useAppKVMVideo } from '@/composables/useAppKVMVideo';
  import { useHealthCheck } from '@/composables/useHealthCheck.js';
  import { onMounted, onBeforeUnmount } from 'vue';

  const store = useAppStore();

  const { settings, footer, isFullscreen, toolbar, showOverlay, showCtrlAltDelDialog, systeminfo } =
    storeToRefs(store);

  const { device } = useDevice();
  const { isVideoActive } = useAppKVMVideo(device);
  const { healthIconColor } = useHealthCheck();

  const pinMenu = () => {
    toolbar.value.pinned = !toolbar.value.pinned;
    if (toolbar.value.pinned) {
      toolbar.value.visible = true; // Keep menu visible when pinned
    }
  };

  const toggleToolbarExpansion = () => {
    if (!toolbar.value) return; // Ensure toolbar is defined
    console.log('Expand/Collapse toolbar');
    // Logic for expanding or collapsing the toolbar
    toolbar.value.expanded = !toolbar.value.expanded;
  };

  // TODO move to composable
  // Exit fullscreen mode is handled by browser, so we only need to enter fullscreen mode
  const toggleFullscreen = () => {
    const doc = document;
    const root = doc.documentElement;

    const enterFullscreen =
      root.requestFullscreen ||
      root.mozRequestFullScreen ||
      root.webkitRequestFullScreen ||
      root.msRequestFullscreen;

    if (
      !doc.fullscreenElement &&
      !doc.mozFullScreenElement &&
      !doc.webkitFullscreenElement &&
      !doc.msFullscreenElement
    ) {
      enterFullscreen.call(root);
    }
    // No need to manually exit fullscreen — browser handles that
  };

  const updateFullscreenStatus = () => {
    isFullscreen.value = !!(
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );

    if (isFullscreen.value) {
      // Hide UI elements in fullscreen mode
      settings.value.isVisible = false;
      toolbar.value.visible = false;
      toolbar.value.pinned = false;
      footer.value.showFooter = false;
      footer.value.pinnedFooter = false;
    } else {
      // Restore UI elements when exiting fullscreen mode
      toolbar.value.visible = true;
      toolbar.value.pinned = true;
      footer.value.showFooter = true;
      footer.value.pinnedFooter = true;
      // Don't force settings to be visible, let user control it
    }
  };

  const handleClick = (value) => {
    switch (value) {
      case 'settings':
        settings.value.isVisible = !settings.value.isVisible;
        break;
      case 'overlay':
        showOverlay.value = !showOverlay.value;
        break;
      case 'lock':
        store.showCtrlAltDelDialog = true;
        break;

      default:
      // TODO
    }
  };

  onMounted(() => {
    document.addEventListener('fullscreenchange', updateFullscreenStatus);
    document.addEventListener('webkitfullscreenchange', updateFullscreenStatus);
    document.addEventListener('mozfullscreenchange', updateFullscreenStatus);
    document.addEventListener('MSFullscreenChange', updateFullscreenStatus);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', updateFullscreenStatus);
    document.removeEventListener('webkitfullscreenchange', updateFullscreenStatus);
    document.removeEventListener('mozfullscreenchange', updateFullscreenStatus);
    document.removeEventListener('MSFullscreenChange', updateFullscreenStatus);
  });
</script>

<style scoped>
  .pin-active {
    color: #76ff03;
  }

  .toolbar-collapsed {
    position: fixed;
    left: 50%;
    top: 7px;
    transform: translateX(-50%);
    border-radius: 30px;
    background-color: var(--v-primary-base);
    /* TODO do we need this? */
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

  .toolbar-expanded {
    position: fixed;
    flex-grow: 1;
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
    gap: 8px;
    /* Adds space between icons and text if needed */
    width: auto;
    height: auto;
    white-space: nowrap;
    /* Prevent text and icons from wrapping */
    overflow: hidden;
  }

  .ml-2 {
    margin-left: 8px;
  }
</style>
