<template>
  <v-dialog v-model="showAboutPageDialog" class="text-center" closeable width="500">
    <v-sheet class="pa-3">
      <!-- Compact Header -->
      <v-row class="mb-2" align="center" justify="center">
        <v-col cols="auto" class="d-flex align-center">
          <v-icon size="28" color="#76FF03" class="mr-2">mdi-information-outline</v-icon>
          <span class="text-h5 font-weight-bold">BliKVM Matrix {{ productVersion }}</span>
        </v-col>
      </v-row>

      <!-- Version Status -->
      <v-row class="mb-2" justify="center">
        <v-col cols="auto">
          <v-chip
            v-if="githubLatestVersion !== `${productVersion}` && githubLatestVersion"
            prepend-icon="mdi-star"
            color="warning"
            size="small"
          >
            {{ $t('aboutPage.newVersion') }} {{ githubLatestVersion }} {{ $t('common.available') }}
          </v-chip>
          <v-chip v-else size="small">
            <template v-slot:prepend>
              <v-icon color="#76FF03">mdi-check-circle</v-icon>
            </template>
            &nbsp; {{ $t('aboutPage.runningLatestVersion') }}
          </v-chip>
        </v-col>
      </v-row>

      <!-- Update UI (no progress bar, show raw API stream) -->
      <v-row
        v-if="githubLatestVersion !== `${productVersion}` && githubLatestVersion"
        class="mb-2"
        justify="center"
      >
        <v-col cols="12">
          <v-card variant="flat" class="pa-3">
            <v-card-subtitle class="text-body-2 pb-2 text-center">
              <v-icon size="small" color="#76FF03" class="mr-2">mdi-update</v-icon>
              {{ $t('aboutPage.newVersion') }} {{ githubLatestVersion }}
            </v-card-subtitle>
            <v-card-text class="pt-0">
              <div class="d-flex justify-center align-center mb-2">
                <v-btn
                  class="text-none"
                  color="#76FF03"
                  variant="tonal"
                  :disabled="isUpdating"
                  @click="startUpgrade"
                >
                  {{ isUpdating ? $t('aboutPage.updating') : $t('aboutPage.startUpgrade') }}
                </v-btn>
              </div>
              <div v-if="isUpdating" class="log-box" ref="logBoxRef">
                <pre class="log-pre">{{ sseOutput }}</pre>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-2"></v-divider>

      <!-- Details Section -->
      <v-expansion-panels flat class="mb-3">
        <v-expansion-panel elevation="0">
          <v-expansion-panel-title>
            <v-icon size="small" class="mr-2">mdi-information-variant</v-icon>
            <span class="text-body-2">Build Details</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="pa-2">
              <table style="width: auto">
                <tbody>
                  <tr>
                    <td class="pb-1" style="white-space: nowrap">
                      <div class="d-flex align-center">
                        <v-icon size="x-small" class="mr-2">mdi-application</v-icon>
                        <span class="text-body-2 text-medium-emphasis">Client:</span>
                      </div>
                    </td>
                    <td class="pb-1 pl-3" style="white-space: nowrap; text-align: left">
                      <span class="text-body-2">v{{ clientVersion }}</span>
                    </td>
                  </tr>
                  <tr>
                    <td class="pb-1" style="white-space: nowrap">
                      <div class="d-flex align-center">
                        <v-icon size="x-small" class="mr-2">mdi-server</v-icon>
                        <span class="text-body-2 text-medium-emphasis">Server:</span>
                      </div>
                    </td>
                    <td class="pb-1 pl-3" style="white-space: nowrap; text-align: left">
                      <span class="text-body-2">{{ serverVersion }}-alpha</span>
                    </td>
                  </tr>
                  <tr>
                    <td class="pb-1" style="white-space: nowrap">
                      <div class="d-flex align-center">
                        <v-icon size="x-small" class="mr-2">mdi-calendar-clock</v-icon>
                        <span class="text-body-2 text-medium-emphasis">Build:</span>
                      </div>
                    </td>
                    <td class="pb-1 pl-3" style="white-space: nowrap; text-align: left">
                      <span class="text-body-2">{{ buildInfo }}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="white-space: nowrap">
                      <div class="d-flex align-center">
                        <v-icon size="x-small" class="mr-2">mdi-source-commit</v-icon>
                        <span class="text-body-2 text-medium-emphasis">Commit:</span>
                      </div>
                    </td>
                    <td class="pl-3" style="white-space: nowrap; text-align: left">
                      <code class="text-body-2">{{ commitHash }}</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-divider class="mb-2"></v-divider>

      <!-- Social Links -->
      <!-- Footer Section -->
      <v-footer class="text-center d-flex flex-column py-sm-1 py-8">
        <div class="my-5">
          <v-btn
            v-for="(icon, index) in icons"
            :key="icon"
            class="mx-4"
            :icon="icon"
            size="small"
            :href="links[index]"
            variant="text"
            target="_blank"
          />
        </div>

        <p class="text-caption">
          &copy; {{ new Date().getFullYear() }} Blicube LLC - All rights reserved
        </p>
      </v-footer>
    </v-sheet>

    <v-card-actions class="bg-surface-light">
      <v-spacer />

      <v-checkbox
        v-model="dontShowAgain"
        density="compact"
        hide-details
        :label="$t('aboutPage.dontShowAfterLogin')"
        class="text-caption mr-4"
      />

      <v-btn class="text-none" color="#76FF03" text="Close" variant="tonal" @click="closeDialog" />
    </v-card-actions>
  </v-dialog>
</template>

<script setup>
  import { onMounted, onBeforeUnmount, ref } from 'vue';
  import Config from '@/config.js';
  import pkg from 'package';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { getLatestVersion, githubLatestVersion } from '@/composables/useAccount-version.js';
  import { useAlert } from '@/composables/useAlert';

  const store = useAppStore();

  const { showAboutPageDialog, isUpdateAvailable, productVersion, serverVersion } =
    storeToRefs(store); // Access the same reactive ref

  const { sendAlert } = useAlert();

  const email = 'info@blicube.com';
  const clientVersion = ref(pkg.version);
  const buildInfo = ref(__BUILD_TIME__);
  const commitHash = ref(__GIT_COMMIT__);
  const dontShowAgain = ref(false);

  const links = [
    `mailto:${email}`,
    'https://blicube.com',
    'https://discord.com/invite/9Y374gUF6C',
    'https://github.com/blikvm/blikvm',
    'https://wiki.blicube.com/blikvm/',
  ];
  const icons = ['mdi-email', 'mdi-web', 'mdi-forum', 'mdi-github', 'mdi-file-document-outline'];

  const closeDialog = () => {
    // Save preference if checkbox is checked
    if (dontShowAgain.value) {
      localStorage.setItem('skipAboutDialogAfterLogin', 'true');
    }
    showAboutPageDialog.value = false;
  };

  // Update API streaming (SSE): show raw lines, no progress bar
  const isUpdating = ref(false);
  const sseOutput = ref('');
  let es = null;
  const logBoxRef = ref(null);

  function appendLine(line) {
    if (!line) return;
    // Limit content length to avoid uncontrolled growth
    if (sseOutput.value.length > 20000) {
      // keep last ~15000 chars
      sseOutput.value = sseOutput.value.slice(-15000);
    }
    sseOutput.value += (sseOutput.value ? '\n' : '') + line;
    // auto scroll to bottom
    requestAnimationFrame(() => {
      const el = logBoxRef.value;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  function startUpgrade() {
    if (isUpdating.value) return;
    try {
      const apiBase = `${Config.http_protocol}//${Config.host_ip}${Config.host_port}`;
      const token = localStorage.getItem('token') || '';
      const url = `${apiBase}/api/update/stream?token=${encodeURIComponent(token)}`;
      es = new EventSource(url);
      isUpdating.value = true;
      sseOutput.value = '';

      es.onmessage = (ev) => {
        const raw = (ev?.data ?? '').toString();
        try {
          const obj = JSON.parse(raw);
          if (obj && typeof obj === 'object') {
            if (obj.type === 'start') {
              appendLine(`[update] started (${obj.mode || 'unknown'})`);
            } else if (obj.type === 'end') {
              appendLine('[update] finished');
              return stopUpgrade();
            } else if (obj.type === 'busy') {
              appendLine('[update] busy: another update is running');
              return stopUpgrade();
            } else if (obj.type === 'error') {
              appendLine(`[update] error${obj.message ? `: ${obj.message}` : ''}`);
              return stopUpgrade();
            }
            if (obj.line) {
              appendLine(String(obj.line));
            } else if (obj.message && !obj.type) {
              appendLine(String(obj.message));
            } else {
              appendLine(raw);
            }
          } else {
            appendLine(raw);
          }
        } catch {
          appendLine(raw);
        }
        if (/Deactivated\s+successfully\.?/i.test(raw)) {
          appendLine('[update] finished');
          return stopUpgrade();
        }
      };
      es.onerror = () => {
        appendLine('[SSE] error or closed');
        stopUpgrade();
      };
    } catch (e) {
      appendLine(`[SSE] failed to open: ${e?.message || e}`);
      stopUpgrade();
    }
  }

  function stopUpgrade() {
    isUpdating.value = false;
    if (es) {
      try {
        es.close();
      } catch (_) {}
    }
    es = null;
  }

  onMounted(async () => {
    try {
      await getLatestVersion();
      if (githubLatestVersion.value) {
        isUpdateAvailable.value = true;
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  });

  onBeforeUnmount(() => {
    stopUpgrade();
  });
</script>

<style scoped>
  .monospace-font {
    font-family: 'Consolas', 'Monaco', monospace;
  }

  .command-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .command-chip {
    max-width: 100%;
    overflow-x: auto;
    white-space: nowrap;
  }

  .log-box {
    height: 200px;
    overflow: auto;
    background: #0b0c10;
    color: #d1d5db;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 10px;
  }

  .log-pre {
    margin: 0;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
