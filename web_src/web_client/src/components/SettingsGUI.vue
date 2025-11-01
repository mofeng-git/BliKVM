<template>
  <v-expansion-panel value="gui">
    <v-expansion-panel-title>
      <template v-slot:default="{ expanded }">
        <v-card class="transparent-card" density="compact" tile width="100%">
          <v-row dense no-gutters>
            <v-col cols="1">
              <v-icon color="#FF7043">mdi-monitor-dashboard</v-icon>
            </v-col>
            <v-col class="d-flex justify-start align-center" cols="4">
              {{ $t('settings.gui.title') }}
            </v-col>
          </v-row>
          <v-row v-if="expanded" dense>
            <v-col cols="*">
              <v-card-subtitle>
                {{ $t('settings.gui.subtitle') }}
              </v-card-subtitle>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <v-expansion-panels v-model="innerPanel" multiple>
        <v-expansion-panel value="language">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-translate</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.gui.language.languageField') }}
                </v-col>
                <v-col
                  class="d-flex justify-end align-center"
                  :style="{
                    color: '#76FF03',
                  }"
                  ><v-chip>
                    {{ currentLanguage }}
                  </v-chip>
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-select
                    v-model="misc.language"
                    :items="languageList"
                    item-title="label"
                    item-value="language"
                    density="compact"
                    variant="outlined"
                    color="#76FF03"
                    :label="$t('settings.gui.language.languageField')"
                    @update:modelValue="changeLanguage"
                  />
                </v-col>
              </v-row>

              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-chip
                    append-icon="mdi-open-in-new"
                    :href="gitHubTranslateUrl"
                    link
                    density="compact"
                    ripple
                    color="#76FF03"
                    rel="noopener noreferrer"
                    target="_blank"
                    >{{ $t('settings.gui.language.helpTranslate') }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="alert">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-alert-box-outline</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.gui.alert.title') }}
                </v-col>
                <v-col
                  class="d-flex justify-end align-center"
                  :style="{
                    color: '#76FF03',
                  }"
                  ><v-chip>
                    {{ misc.alert.location }}
                  </v-chip>
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-switch
                    v-model="misc.alert.isEnabled"
                    inset
                    :label="$t('settings.gui.alert.isAlertField')"
                    v-ripple
                    color="#76FF03"
                    @update:modelValue="handleAlertToggle"
                  />
                </v-col>
              </v-row>

              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-select
                    v-model="misc.alert.location"
                    :items="locationOptions"
                    item-title="text"
                    item-value="value"
                    :disabled="!misc.alert.isEnabled"
                    density="compact"
                    variant="outlined"
                    rounded="lg"
                    tile
                    v-ripple
                    color="#76FF03"
                    :label="$t('settings.gui.alert.locationField')"
                    @update:modelValue="setLocation"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="cursor">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-cursor-default</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.gui.cursor.title') }}
                </v-col>
                <v-col class="d-flex justify-end align-center">
                  <v-chip color="#76FF03">
                    <v-icon
                      class="mr-2"
                      :size="misc.currentCursor === 'cursor-green-dot' ? 'large' : 'default'"
                    >
                      {{
                        cursorList.find((c) => c.cursor === misc.currentCursor)?.icon ||
                        'mdi-cursor-default'
                      }}
                    </v-icon>
                    {{
                      cursorList.find((c) => c.cursor === misc.currentCursor)?.label || 'Default'
                    }}
                  </v-chip>
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-switch
                    v-model="misc.isLocalCursorVisible"
                    inset
                    :label="$t('settings.gui.isLocalCursorVisibleField')"
                    v-ripple
                    color="#76FF03"
                    @update:modelValue="saveCursorStatus"
                  />
                </v-col>
              </v-row>
              <br />
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-list @click.stop="keepMenuOpen" :disabled="!misc.isLocalCursorVisible">
                    <v-list-item
                      v-for="(item, index) in cursorList"
                      :key="index"
                      class="d-flex text-subtitle-1"
                      :disabled="!misc.isLocalCursorVisible"
                      @click="changeCursor(item)"
                    >
                      <div class="item-wrapper">
                        <div
                          v-if="misc.currentCursor === item.cursor"
                          class="border-indicator"
                        ></div>
                        <div
                          :class="{
                            'selected-item-inner': misc.currentCursor !== item.cursor,
                          }"
                          class="item-content"
                        >
                          <v-list-item-title>
                            <v-icon :color="item.color" class="mr-2">{{ item.icon }}</v-icon>
                            {{ item.label }}
                          </v-list-item-title>
                        </div>
                      </div>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="login" @group:selected="getCocState">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-login</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="11">
                  {{ $t('settings.gui.login.title') }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <v-row dense no-gutters>
                <v-col cols="*">
                  <v-switch
                    v-model="misc.showCoc"
                    inset
                    :label="$t('settings.gui.login.showCocField')"
                    :disabled="!misc.cocUrl"
                    v-ripple
                    color="#76FF03"
                    @update:modelValue="activeCoc"
                  />
                </v-col>
              </v-row>

              <div class="text-caption">
                {{ $t('settings.gui.login.conductUrlField') }}
              </div>

              <v-row dense no-gutters>
                <v-col cols="12">
                  <v-text-field
                    v-model="misc.cocUrl"
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    variant="outlined"
                    placeholder="URL"
                    hide-details
                    single-line
                    clearable
                    @update:modelValue="setCocUrl"
                    @keydown.stop
                    @keyup.stop
                  >
                    <template v-slot:append>
                      <v-btn
                        color="#76FF03"
                        icon="mdi-content-copy"
                        size="small"
                        variant="plain"
                        :disabled="!misc.cocUrl"
                        @click="copyClipboard(misc.cocUrl)"
                      />
                      <v-btn
                        color="#76FF03"
                        icon="mdi-open-in-new"
                        size="small"
                        variant="plain"
                        :href="`${misc.cocUrl}`"
                        :disabled="!misc.cocUrl"
                        rel="noopener noreferrer"
                        target="_blank"
                      />
                    </template>
                  </v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
  import { ref, onMounted, getCurrentInstance } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useLanguage } from '@/composables/useLanguage.js';
  import { useAlert } from '@/composables/useAlert.js';
  import { useCursors } from '@/composables/useCursors.js';
  import { useDevice } from '@/composables/useDevice.js';
  import { useClipboard } from '@/composables/useClipboard.js';
  import http from '@/utils/http.js';

  const innerPanel = ref([]);
  const { languageList, currentLanguage, gitHubTranslateUrl } = useLanguage();
  const store = useAppStore();
  const { misc } = storeToRefs(store);
  const { locationOptions, setLocation, sendAlert } = useAlert();
  const { proxy } = getCurrentInstance();
  const { cursorList, changeCursor } = useCursors();
  const { device } = useDevice();
  const { copyClipboard } = useClipboard();

  // About dialog preference
  const showAboutDialogAfterLogin = ref(
    localStorage.getItem('skipAboutDialogAfterLogin') !== 'true'
  );

  function changeLanguage(language) {
    misc.value.language = language;
    proxy.$i18n.locale = language;
    localStorage.setItem('locale', language);
  }

  function saveCursorStatus(status) {
    localStorage.setItem('cursorStatus', status);
  }

  function updateAboutDialogPreference(value) {
    if (value) {
      // If turning ON (show dialog), remove the skip flag
      localStorage.removeItem('skipAboutDialogAfterLogin');
    } else {
      // If turning OFF (don't show dialog), set the skip flag
      localStorage.setItem('skipAboutDialogAfterLogin', 'true');
    }
  }

  const getCocState = async (selected) => {
    try {
      if (!selected) return;
      const response = await http.get('/conduct');
      misc.value.showCoc = response.data.data.isActive;
      misc.value.cocUrl = response.data.data.url;
    } catch (error) {
      const title = 'Get Code of Conduct state Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const activeCoc = async (isActive) => {
    // Don't allow enabling if there's no URL
    if (isActive && !misc.value.cocUrl) {
      misc.value.showCoc = false;
      sendAlert('warning', 'Cannot Enable', 'Please enter a Code of Conduct URL first');
      return;
    }

    try {
      const response = await http.post('/conduct/active', { isActive });
      misc.value.showCoc = response.data.data.isActive;
      misc.value.cocUrl = response.data.data.url;
    } catch (error) {
      const title = 'active Code of Conduct Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const setCocUrl = async (value) => {
    try {
      // If URL is cleared, immediately disable the CoC switch
      if (!value || value === '') {
        misc.value.showCoc = false;
        await http.post('/conduct/active', { isActive: false });
      }

      // Always update the URL on the server
      const response = await http.post('/conduct/update', {
        url: value || '',
      });
      misc.value.cocUrl = response.data.data.url;
    } catch (error) {
      const title = 'Set Code of Conduct URL Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const handleAlertToggle = (isEnabled) => {
    // Show demo alert when toggling
    const message = isEnabled ? 'Alerts are now enabled' : 'Alerts are now disabled';
    const type = isEnabled ? 'success' : 'info';

    // Always show demo alert regardless of enabled state
    sendAlert(type, 'Alert Settings', message, true);
  };

  const keepMenuOpen = (event) => {
    // You can add additional logic here if needed
    event.stopPropagation(); // Stop the event from bubbling up
  };

  onMounted(() => {
    const locale = localStorage.getItem('locale');
    if (locale) {
      misc.value.language = locale;
      proxy.$i18n.locale = locale;
    }
  });
</script>

<style scoped>
  .v-list-item {
    position: relative;
    overflow: visible !important;
  }

  .item-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    padding-left: 12px;
  }

  .border-indicator {
    position: absolute;
    left: 0;
    top: -8px;
    bottom: -8px;
    width: 4px;
    background-color: #76ff03;
    border-radius: 0 2px 2px 0;
    box-shadow: 0 0 8px rgba(118, 255, 3, 0.4);
  }

  .item-content {
    width: 100%;
  }

  .selected-item-inner {
    /* No special padding needed */
  }

  /* Disabled state for cursor list */
  .v-list[disabled] {
    opacity: 0.5;
    pointer-events: none;
  }
</style>
