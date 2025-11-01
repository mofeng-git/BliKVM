<template>
  <v-expansion-panel value="network">
    <v-expansion-panel-title>
      <template v-slot:default="{ expanded }">
        <v-card class="transparent-card" density="compact" tile width="100%">
          <v-row dense no-gutters>
            <v-col cols="1">
              <v-icon color="#448AFF">mdi-ip-network</v-icon>
            </v-col>
            <v-col class="d-flex justify-start align-center" cols="4">
              {{ $t('settings.network.title') }}
            </v-col>
          </v-row>
          <v-row v-if="expanded" dense>
            <v-col cols="12">
              <v-card-subtitle>
                {{ $t('settings.network.subtitle') }}
              </v-card-subtitle>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-expansion-panels multiple>
        <v-expansion-panel value="network-general">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-wrench</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('common.general') }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <div class="text-caption">
                {{ $t('settings.network.general.hostnameField') }}
              </div>
              <v-row dense no-gutters>
                <v-col cols="12">
                  <v-tooltip>
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-model="systeminfo.hostname"
                        v-bind="props"
                        density="compact"
                        rounded="lg"
                        v-ripple
                        color="#76FF03"
                        variant="outlined"
                        hide-details
                        single-line
                        clearable
                        @update:focused="changeHostname"
                        @keydown.stop
                        @keyup.stop
                      >
                        <template v-slot:append>
                          <v-icon
                            size="small"
                            color="#76FF03"
                            @click="copyClipboard(systeminfo.hostname)"
                            >mdi-content-copy</v-icon
                          >
                        </template>
                      </v-text-field> </template
                    >{{ $t('common.copy') }}
                  </v-tooltip>
                </v-col>
              </v-row>

              <br />

              <div class="text-caption">
                {{ $t('settings.network.general.mac') }}
              </div>
              <v-row dense no-gutters>
                <v-col cols="12">
                  <v-text-field
                    v-model="device.network.interfaces[0].mac"
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    variant="outlined"
                    hide-details
                    single-line
                    disabled
                  >
                    <template v-slot:append>
                      <v-icon
                        size="small"
                        color="#76FF03"
                        @click.stop="copyClipboard(device.network.interfaces[0].mac)"
                        style="pointer-events: auto; cursor: pointer"
                        >mdi-content-copy</v-icon
                      >
                    </template></v-text-field
                  >
                </v-col>
              </v-row>
              <br />
              <div class="text-caption">
                {{ $t('settings.network.general.ip4Field') }}
              </div>
              <v-row dense no-gutters>
                <v-col cols="12">
                  <v-text-field
                    v-model="device.network.interfaces[0].ip4"
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    variant="outlined"
                    hide-details
                    single-line
                    clearable
                    :disabled="device.network.interfaces[0].dhcp"
                  >
                    <template v-slot:append>
                      <v-icon
                        size="small"
                        color="#76FF03"
                        @click="copyClipboard(device.network.interfaces[0].ip4)"
                        >mdi-content-copy</v-icon
                      >
                    </template></v-text-field
                  >
                </v-col>
              </v-row>
              <br />
              <v-row dense no-gutters>
                <v-col class="d-flex justify-start" cols="4">
                  {{ $t('settings.network.general.dhcp') }}
                </v-col>
                <v-col
                  class="d-flex justify-end align-center"
                  :style="{
                    color: '#76FF03',
                  }"
                >
                  <v-chip>
                    {{
                      device.network.interfaces[0].dhcp
                        ? $t('settings.network.general.dynamic')
                        : $t('settings.network.general.static')
                    }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="network-services" @group:selected="getNetworkInfo">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-cog</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.network.services.title') }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <v-row dense no-gutters>
                <v-col cols="6">
                  <label class="text-subtitle-1 font-weight-medium mb-2 d-block">
                    {{ $t('settings.network.services.httpPortField') }}</label
                  >
                  <div class="d-flex align-center ga-2">
                    <v-number-input
                      v-model="device.network.httpPort"
                      control-variant="hidden"
                      density="compact"
                      type="number"
                      variant="outlined"
                      rounded="lg"
                      v-ripple
                      color="#76FF03"
                      @update:focused="changeNetworkPorts"
                      @keydown.stop
                      @keyup.stop
                    >
                    </v-number-input>
                  </div>
                </v-col>
                <v-col cols="6">
                  <label class="text-subtitle-1 font-weight-medium mb-2 d-block">
                    {{ $t('settings.network.services.httpsPortField') }}</label
                  >
                  <div class="d-flex align-center ga-2">
                    <v-number-input
                      v-model="device.network.httpsPort"
                      control-variant="hidden"
                      density="compact"
                      type="number"
                      variant="outlined"
                      rounded="lg"
                      v-ripple
                      color="#76FF03"
                      @update:focused="changeNetworkPorts"
                      @keydown.stop
                      @keyup.stop
                    >
                    </v-number-input>
                  </div>
                </v-col>
              </v-row>

              <v-row dense no-gutters>
                <v-col cols="12">
                  <v-switch
                    v-model="device.network.isHttpsConnectionEnabled"
                    inset
                    :label="$t('settings.network.services.isHttpsConnectionEnabledField')"
                    v-ripple
                    color="#76FF03"
                    @update:modelValue="changeNetworkProtocol"
                  />
                </v-col>
              </v-row>
              <v-row dense no-gutters v-if="isExperimental">
                <v-col cols="12">
                  <v-switch
                    v-model="device.network.isDiscoverable"
                    inset
                    :label="$t('settings.network.services.isHttpsConnectionEnabledField')"
                    v-ripple
                    color="#76FF03"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-expansion-panels multiple>
        <v-expansion-panel value="network-wol">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-lan</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.network.wol.title') }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text width="100%">
            <Wol />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
  import { useDevice } from '@/composables/useDevice.js';
  import { useAlert } from '@/composables/useAlert.js';
  import http from '@/utils/http.js';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const store = useAppStore();
  const { isExperimental, systeminfo } = storeToRefs(store);
  const { device } = useDevice();
  const { sendAlert } = useAlert(alert);

  const changeHostname = async (value) => {
    try {
      if (value === false) {
        const requestBody = {
          hostname: systeminfo.value.hostname,
        };
        const response = await http.post('/hostname', requestBody);
        if (response.status === 200 && response.data.code === 0) {
          if (response.data.data.hostname) {
            systeminfo.value.hostname = response.data.data.hostname;
          } else {
            const title = 'Hostname Change Error';
            const message = 'Failed to change hostname.';
            sendAlert('error', title, message);
          }
        }
      }
    } catch (error) {
      const title = 'Set Hostname Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const changeNetworkPorts = async (value) => {
    try {
      if (value === false) {
        const requestBody = {
          http_port: device.value.network.httpPort,
          https_port: device.value.network.httpsPort,
        };
        const response = await http.post('/network/port', requestBody);
        if ((response.status === 200) & (response.data.code === 0)) {
          if (response.data.data.http_port && response.data.data.https_port) {
            device.value.network.httpPort = response.data.data.http_port;
            device.value.network.httpsPort = response.data.data.https_port;
            const title = 'Network Ports Change Success';
            const message =
              'Network ports changed successfully. After 3 seconds to restart the server.';
            sendAlert('success', title, message);
          } else {
            const title = 'Network Ports Change Error';
            const message = 'Failed to change network ports.';
            sendAlert('error', title, message);
          }
        }
      }
    } catch (error) {
      const title = 'Set Network Ports Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const changeNetworkProtocol = async (value) => {
    try {
      const requestBody = {
        protocol: value ? 'https' : 'http',
      };
      const response = await http.post('/network/protocol', requestBody);
      if ((response.status === 200) & (response.data.code === 0)) {
        if (response.data.data.protocol) {
          device.value.network.protocol = response.data.data.protocol;
          const title = 'Network Protocol Change Success';
          const message =
            'Network protocol changed successfully. After 3 seconds to restart the server.';
          sendAlert('success', title, message);
        } else {
          const title = 'Network Ports Change Error';
          const message = 'Failed to change network ports.';
          sendAlert('error', title, message);
        }
      }
    } catch (error) {
      const title = 'Set Network Ports Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const getNetworkInfo = async (selected) => {
    try {
      if (!selected) return;
      const response = await http.get('/network');
      if (response.status === 200 && response.data.code === 0) {
        device.value.network.protocol = response.data.data.protocol;
        device.value.network.httpPort = response.data.data.http_port;
        device.value.network.httpsPort = response.data.data.https_port;
        if (device.value.network.protocol === 'https') {
          device.value.network.isHttpsConnectionEnabled = true;
        } else {
          device.value.network.isHttpsConnectionEnabled = false;
        }
      } else {
        const title = 'Network Ports Error';
        const message = 'Failed to fetch network ports.';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Network Ports Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  onMounted(() => {});
</script>

<style scoped></style>
