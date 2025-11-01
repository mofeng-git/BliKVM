<template>
  <v-sheet rounded class="w-100 bg-black console-container">
    <!-- Terminal Tabs Header -->
    <v-tabs
      v-model="activeTab"
      bg-color="black"
      color="#76FF03"
      height="35"
      density="compact"
      show-arrows
      class="terminal-tabs"
    >
      <!-- Connection Status Tab -->
      <v-tab :value="'status'" class="terminal-status-tab" style="min-width: auto; padding: 0 12px">
        <v-icon :color="isConnected ? 'rgba(255, 255, 255, 0.7)' : '#D32F2F'" size="small" class="mr-2">
          {{ isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
        </v-icon>
        <span class="text-caption" :style="{ color: isConnected ? 'rgba(255, 255, 255, 0.7)' : '#D32F2F' }">
          {{ isConnected ? 'SSH Connection' : t('terminal.disconnected') }}
        </span>
      </v-tab>

      <v-spacer />

      <!-- Action Tabs -->
      <v-tab :value="'clear'" @click="clearTerminal" class="terminal-action-tab">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" color="rgba(255, 255, 255, 0.7)" size="small"> mdi-close-circle-outline </v-icon>
          </template>
          <span>{{ t('terminal.clearTerminal') }}</span>
        </v-tooltip>
      </v-tab>

      <v-tab :value="'copy'" @click="copyClipboardHandler" class="terminal-action-tab">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" color="rgba(255, 255, 255, 0.7)" size="small"> mdi-content-copy </v-icon>
          </template>
          <span>{{ t('terminal.copyText') }}</span>
        </v-tooltip>
      </v-tab>

      <v-tab :value="'paste'" @click="pasteClipboard" class="terminal-action-tab">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" color="rgba(255, 255, 255, 0.7)" size="small"> mdi-content-paste </v-icon>
          </template>
          <span>{{ t('terminal.pasteText') }}</span>
        </v-tooltip>
      </v-tab>

      <v-tab :value="'scroll-top'" @click="scrollTop" class="terminal-action-tab">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" color="rgba(255, 255, 255, 0.7)" size="small"> mdi-arrow-up-bold </v-icon>
          </template>
          <span>{{ t('terminal.scrollToTop') }}</span>
        </v-tooltip>
      </v-tab>

      <v-tab :value="'scroll-bottom'" @click="scrollBottom" class="terminal-action-tab">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" color="rgba(255, 255, 255, 0.7)" size="small"> mdi-arrow-down-bold </v-icon>
          </template>
          <span>{{ t('terminal.scrollToBottom') }}</span>
        </v-tooltip>
      </v-tab>
    </v-tabs>

    <!-- Terminal Content -->
    <v-sheet color="black" class="terminal-sheet-outer w-100" elevation="2" rounded="0 0 lg lg">
      <v-hover>
        <template #default="{ props: hoverProps, isHovering }">
          <v-sheet
            v-bind="hoverProps"
            :border="`thin ${isHovering || isKeyboardEventsEnabled ? 'success opacity-75' : ''}`"
            color="black"
            class="terminal-sheet-inner"
            elevation="1"
            rounded="lg"
            flat
            @contextmenu="handleContextMenu"
            @mouseenter="enableKeyboardEvents"
            @mouseleave="disableKeyboardEvents"
            @keydown="handleKeydown"
            @keyup="handleKeyup"
            tabindex="0"
            :aria-label="t('terminal.sshTerminalConsole')"
          >
            <div ref="terminal" class="terminal-content" />
          </v-sheet>
        </template>
      </v-hover>
    </v-sheet>
  </v-sheet>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useDevice } from '@/composables/useDevice';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import '@xterm/xterm/css/xterm.css';
  import { debounce } from 'lodash';
  import Config from '@/config.js';
  import { useAlert } from '@/composables/useAlert.js';
  import { useClipboard } from '@/composables/useClipboard.js';
  import { useTheme } from 'vuetify';
  import { useI18n } from 'vue-i18n';

  const store = useAppStore();
  const { systeminfo } = storeToRefs(store);
  const { device } = useDevice();
  const { sendAlert } = useAlert();
  const { copyClipboard } = useClipboard();
  const theme = useTheme();
  const { t } = useI18n();

  // UI state
  const isConnected = ref(false);
  const activeTab = ref('status');

  // Detect if user is on macOS
  const isMacOS = ref(false);

  // WebSocket setup - following existing pattern
  const wsProtocol = Config.http_protocol === 'https:' ? 'wss' : 'ws';
  const token = localStorage.getItem('token');
  const socketUrl = `${wsProtocol}://${Config.host_ip}${Config.host_port}/ssh?token=${token}`;

  const packStdin = (data) => JSON.stringify({ Op: 'stdin', Data: data });
  const packResize = (cols, rows) => JSON.stringify({ Op: 'resize', Cols: cols, Rows: rows });

  const initText = ref('connecting...\\r\\n'); // TODO localize
  const first = ref(true);
  const term = ref(null);
  const fitAddon = ref(null);
  const ws = ref(null);
  const terminal = ref(null);

  // Terminal theme that matches app's color scheme
  const terminalTheme = computed(() => {
    const isDark = theme.global.current.value.dark;
    return {
      background: '#000000', // Match app's black background
      foreground: isDark ? '#e6edf3' : '#24292f',
      cursor: '#76FF03', // Match app's brand color
      cursorAccent: '#000000',
      selection: isDark ? '#264f78' : '#005fb8',
      black: isDark ? '#484f58' : '#24292f',
      red: isDark ? '#ff7b72' : '#cf222e',
      green: '#76FF03', // Match app's brand color
      yellow: isDark ? '#d29922' : '#4d2d00',
      blue: isDark ? '#58a6ff' : '#0969da',
      magenta: isDark ? '#bc8cff' : '#8250df',
      cyan: isDark ? '#39c5cf' : '#1b7c83',
      white: isDark ? '#b1bac4' : '#656d76',
      brightBlack: isDark ? '#6e7681' : '#656d76',
      brightRed: isDark ? '#ffa198' : '#82071e',
      brightGreen: '#76FF03', // Match app's brand color
      brightYellow: isDark ? '#e3b341' : '#633c01',
      brightBlue: isDark ? '#79c0ff' : '#218bff',
      brightMagenta: isDark ? '#d2a8ff' : '#a475f9',
      brightCyan: isDark ? '#56d4dd' : '#3192aa',
      brightWhite: isDark ? '#f0f6fc' : '#1c2128',
    };
  });

  const option = computed(() => ({
    lineHeight: 1.2,
    cursorBlink: true,
    wraparound: true,
    cursorStyle: 'block',
    fontSize: 13, // Slightly smaller to match app's compact style
    fontFamily: "'JetBrains Mono', 'Fira Code', Monaco, Menlo, Consolas, 'Courier New', monospace",
    theme: terminalTheme.value,
    cols: 100,
    scrollback: 10000,
    bellStyle: 'none',
    allowTransparency: false,
  }));

  const isWsOpen = () => ws.value && ws.value.readyState === 1;
  const isKeyboardEventsEnabled = ref(false);

  const enableKeyboardEvents = () => {
    isKeyboardEventsEnabled.value = true;
    term.value?.focus();
  };

  const disableKeyboardEvents = () => {
    isKeyboardEventsEnabled.value = false;
    term.value?.blur();
  };

  const handleKeydown = (event) => {
    if (isKeyboardEventsEnabled.value) {
      event.stopPropagation();
    }
  };

  const handleKeyup = (event) => {
    if (isKeyboardEventsEnabled.value) {
      event.stopPropagation();
    }
  };

  const initTerm = () => {
    term.value = new Terminal(option.value);
    fitAddon.value = new FitAddon();
    term.value.loadAddon(fitAddon.value);
    term.value.open(terminal.value);

    // Initial fit with retries to handle container width initialization
    const fitWithRetry = (attempts = 0) => {
      if (attempts < 5) {
        setTimeout(() => {
          if (fitAddon.value && terminal.value) {
            fitAddon.value.fit();
            // Retry if the terminal width seems too small (likely not properly sized yet)
            if (term.value.cols < 50) {
              fitWithRetry(attempts + 1);
            }
          }
        }, 300 + (attempts * 200));
      }
    };
    fitWithRetry();

    isConnected.value = false;
  };

  const onTerminalKeyPress = () => {
    term.value.onData((data) => {
      isWsOpen() && ws.value.send(packStdin(data));
    });
  };

  const resizeRemoteTerminal = () => {
    const { cols, rows } = term.value;
    isWsOpen() && ws.value.send(packResize(cols, rows));
  };

  const onResize = debounce(() => {
    fitAddon.value.fit();
  }, 500);

  const copyClipboardHandler = async () => {
    if (term.value) {
      const selection = term.value.getSelection();
      const textToCopy = selection || term.value.buffer.active.translateToString(false).trim();

      try {
        await copyClipboard(textToCopy);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  const pasteClipboard = async () => {
    if (term.value) {
      try {
        const clipboardText = await navigator.clipboard.readText();
        term.value.paste(clipboardText);
      } catch (err) {
        console.error('Clipboard paste failed:', err);
      }
    }
  };

  const clearTerminal = () => {
    if (isWsOpen()) {
      ws.value.send(packStdin('clear\r'));
    }
  };

  const scrollTop = () => {
    if (term.value) {
      term.value.scrollToTop();
    }
  };

  const scrollBottom = () => {
    if (term.value) {
      term.value.scrollToBottom();
    }
  };

  const onTerminalResize = () => {
    window.addEventListener('resize', onResize);
    term.value.onResize(resizeRemoteTerminal);
  };

  const removeResizeListener = () => {
    window.removeEventListener('resize', onResize);
  };

  const initSocket = () => {
    term.value.write(initText.value);
    ws.value = new WebSocket(socketUrl, ['OK']);
    onOpenSocket();
    onCloseSocket();
    onErrorSocket();
    onMessageSocket();
  };

  const onOpenSocket = () => {
    ws.value.onopen = () => {
      term.value.reset();
      isConnected.value = true;
      setTimeout(() => {
        resizeRemoteTerminal();
      }, 500);
    };
  };

  const onCloseSocket = () => {
    ws.value.onclose = () => {
      isConnected.value = false;
      term.value.write(
        '\\r\\n\\x1b[31mConnection lost. Reconnecting in 3 seconds...\\x1b[0m\\r\\n'
      );
      if (device.value.showSSHTerminal) {
        setTimeout(() => {
          initSocket();
        }, 3000);
      }
    };
  };

  const onErrorSocket = () => {
    ws.value.onerror = () => {
      const title = '';
      const message = `websocket connection failed, please refresh`;
      sendAlert('error', title, message);
    };
  };

  const onMessageSocket = () => {
    ws.value.onmessage = (res) => {
      const data = res.data;
      if (first.value) {
        first.value = false;
        term.value.reset();
        term.value.element && term.value.focus();
        resizeRemoteTerminal();
      }
      term.value.write(data);
    };
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  onMounted(() => {
    // Detect macOS
    isMacOS.value =
      navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
      navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;

    console.log(
      'AppConsole - Platform:',
      navigator.platform,
      'UserAgent:',
      navigator.userAgent,
      'isMacOS:',
      isMacOS.value
    );

    initTerm();
    initSocket();
    onTerminalResize();
    onTerminalKeyPress();
  });

  onBeforeUnmount(() => {
    removeResizeListener();
  });
</script>

<style scoped>
  .v-sheet {
    margin: 0;
    width: 100%;
    max-width: none;
  }

  .v-sheet.console-container {
    padding: 0;
    height: 100%;
  }

  .terminal-tabs {
    border-radius: 4px 4px 0 0;

    /* Make the tab structure more visible */
    :deep(.v-tabs-bar) {
      background-color: rgba(118, 255, 3, 0.05);
    }

    :deep(.v-tab) {
      border-right: 1px solid rgba(255, 255, 255, 0.1);

      &:last-child {
        border-right: none;
      }
    }
  }

  .terminal-status-tab {
    pointer-events: none; /* Status tab is not clickable */
    opacity: 1 !important;
    background-color: rgba(118, 255, 3, 0.1) !important;
  }

  .terminal-action-tab {
    min-width: 40px !important;
    padding: 0 8px !important;

    &:hover {
      background-color: rgba(118, 255, 3, 0.15) !important;
    }

    &.v-tab--selected {
      background-color: rgba(118, 255, 3, 0.2) !important;
    }
  }

  .terminal-sheet-outer {
    height: calc(100% - 36px); /* Account for tabs height */
    padding: 8px;
    border-top: 1px solid rgba(118, 255, 3, 0.2);
    width: 100% !important;
    max-width: none !important;
  }

  .terminal-sheet-inner {
    height: 100%;
    padding: 0;
    position: relative;
    overflow: hidden;
    background: linear-gradient(145deg, #000000 0%, #111111 100%);

    &:focus-visible {
      outline: 2px solid #76ff03;
      outline-offset: -2px;
    }
  }

  .terminal-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 28px;
    padding: 0 12px;
    background: linear-gradient(90deg, rgba(118, 255, 3, 0.1) 0%, rgba(118, 255, 3, 0.05) 100%);
    border-bottom: 1px solid rgba(118, 255, 3, 0.2);
  }

  .terminal-window-controls {
    display: flex;
    gap: 6px;
  }

  .control-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transition: all 0.2s ease;

    &.control-close {
      background: #ff5f57;
      &:hover {
        background: #ff3b30;
      }
    }

    &.control-minimize {
      background: #ffbd2e;
      &:hover {
        background: #ff9500;
      }
    }

    &.control-maximize {
      background: #28ca42;
      &:hover {
        background: #30d158;
      }
    }
  }

  .terminal-title {
    display: flex;
    align-items: center;
    color: rgba(255, 255, 255, 0.8);

    &.title-centered {
      justify-content: center;
      width: 100%;
    }
  }

  .terminal-content {
    height: 100%;
    width: 100%;
    overflow: hidden;
    padding: 4px;
  }

  /* XTerm styling to match app theme */
  :deep(.xterm) {
    overflow: hidden;
    font-feature-settings:
      'liga' 1,
      'calt' 1;

    .xterm-screen,
    .xterm-rows {
      overflow: hidden;
    }

    .xterm-char-measure-element,
    .xterm-rows {
      font-variant-ligatures: common-ligatures;
      font-feature-settings:
        'liga' 1,
        'calt' 1;
    }
  }

  /* Hide scrollbars completely */
  .terminal-sheet,
  .terminal-content,
  :deep(.xterm),
  :deep(.xterm-viewport),
  :deep(.xterm-screen) {
    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Force hide any remaining scrollbars */
  :deep(.xterm-viewport) {
    overflow: hidden !important;
  }

  /* Force 100% width for terminal components like AppNotifications does */
  :deep(.xterm) {
    width: 100% !important;
    max-width: none !important;
  }

  :deep(.xterm-viewport) {
    width: 100% !important;
    max-width: none !important;
  }

  :deep(.xterm-screen) {
    width: 100% !important;
    max-width: none !important;
  }

  :deep(.xterm .xterm-helper-textarea) {
    width: 100% !important;
  }
</style>
