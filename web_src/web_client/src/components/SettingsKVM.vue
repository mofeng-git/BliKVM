<template>
  <v-expansion-panel value="kvm" selected-class="selected-panel">
    <v-expansion-panel-title>
      <template v-slot:default="{ expanded }">
        <v-card class="transparent-card" density="compact" tile width="100%">
          <v-row dense no-gutters>
            <v-col cols="1" class="d-flex justify-start align-center">
              <v-icon color="primary">mdi-toaster-oven</v-icon>
            </v-col>
            <v-col cols="8" class="d-flex justify-start align-center">
              {{ systeminfo.hostname }}</v-col
            >
            <v-col
              cols="3"
              class="d-flex justify-end align-center"
              :style="{
                color: device.isDisconnected ? '#D32F2F' : '#76FF03',
              }"
            >
              <v-chip prepend-icon="mdi-circle-medium">
                {{ device.isDisconnected ? $t('common.disconnect') : $t('common.connect') }}
              </v-chip>
            </v-col>
          </v-row>
          <v-row v-if="expanded" dense>
            <v-col cols="12">
              <v-card-subtitle>{{ $t('settings.device.subtitle') }}</v-card-subtitle>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <!-- General -->
      <v-expansion-panels v-model="innerPanel" multiple>
        <v-expansion-panel value="general">
          <v-expansion-panel-title>
            <v-row dense no-gutters>
              <!-- Left-aligned section -->
              <v-col cols="1">
                <v-icon>mdi-wrench</v-icon>
              </v-col>
              <v-col class="d-flex justify-start align-center" cols="4">
                {{ $t('common.general') }}
              </v-col>
            </v-row>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <!-- General -->

            <v-expansion-panels
              v-model="innerPanel"
              multiple
              @update:modelValue="handleInnerPanelUpdate"
            >
              <v-expansion-panel value="general">
                <v-expansion-panel-text>
                  <v-row no-gutters class="d-flex justify-end align-center">
                    <v-col class="d-flex justify-start align-start" cols="4">
                      {{ $t('settings.device.general.deviceVersion') }}
                    </v-col>
                    <v-col
                      cols="*"
                      class="d-flex justify-end align-center"
                      :style="{
                        color: '#76FF03',
                      }"
                    >
                      <v-chip>
                        {{ systeminfo.deviceVersion }}
                      </v-chip>
                    </v-col>
                  </v-row>

                  <v-row no-gutters class="d-flex justify-end align-center">
                    <v-col class="d-flex justify-start align-start" cols="4">
                      {{ $t('settings.device.general.hardware') }}
                    </v-col>
                    <v-col
                      cols="*"
                      class="d-flex justify-end align-center"
                      :style="{ color: '#76FF03' }"
                    >
                      <v-chip class="d-flex align-center">
                        {{ device.board.type }} | {{ convertBytesToGiB(systeminfo.memTotal) }}GB |
                        {{ convertBytesToGiB(systeminfo.storageTotal) }}GB &nbsp;
                        <v-tooltip text="Tooltip" content-class="">
                          <template v-slot:activator="{ props }">
                            <v-icon
                              v-bind="props"
                              class="d-flex align-center"
                              style="vertical-align: middle"
                            >
                              {{
                                device.network.interfaces[0]?.type === 'wired'
                                  ? 'mdi-ethernet'
                                  : 'mdi-wifi'
                              }}
                            </v-icon>
                          </template>
                          {{ device.network.interfaces[0]?.type }}
                        </v-tooltip>
                      </v-chip>
                    </v-col>
                  </v-row>

                  <v-row no-gutters class="d-flex justify-end align-center">
                    <v-col class="d-flex justify-start align-start" cols="4">
                      {{ $t('settings.device.general.os') }}
                    </v-col>
                    <v-col
                      cols="*"
                      class="d-flex justify-end align-center"
                      :style="{
                        color: '#76FF03',
                      }"
                      ><v-chip>
                        {{ device.os.distro }} {{ device.os.codename }}
                        {{ device.os.release }}
                      </v-chip>
                    </v-col>
                  </v-row>

                  <v-row no-gutters class="d-flex justify-end align-center">
                    <v-col class="d-flex justify-start align-start" cols="4">
                      {{ $t('settings.device.general.architecture') }}
                    </v-col>
                    <v-col
                      cols="*"
                      class="d-flex justify-end align-center"
                      :style="{
                        color: '#76FF03',
                      }"
                      ><v-chip>
                        {{ device.os.arch }}
                      </v-chip>
                    </v-col>
                  </v-row>

                  <v-row no-gutters class="d-flex justify-end align-center">
                    <v-col class="d-flex justify-start align-start" cols="6">
                      {{ $t('settings.device.general.uptime') }}
                    </v-col>
                    <v-col
                      cols="*"
                      class="d-flex justify-end align-center"
                      :style="{
                        color: '#76FF03',
                      }"
                      ><v-chip>
                        {{ device.uptime }}
                      </v-chip>
                    </v-col>
                  </v-row>

                  <v-row no-gutters class="d-flex justify-end align-center">
                    <v-col class="d-flex justify-start align-start" cols="auto">
                      {{ $t('settings.device.general.timezone') }}
                    </v-col>
                    <v-col
                      cols="*"
                      class="d-flex justify-end align-center"
                      :style="{
                        color: '#76FF03',
                      }"
                      ><v-chip>
                        {{ device.timezone }}
                      </v-chip>
                    </v-col>
                  </v-row>

                  <v-row no-gutters class="d-flex justify-end align-center">
                    <v-col class="d-flex justify-start align-start" cols="6">
                      {{ $t('settings.device.general.connectedClients') }}
                    </v-col>
                    <v-col
                      cols="*"
                      class="d-flex justify-end align-center"
                      :style="{
                        color: '#76FF03',
                      }"
                      ><v-chip>
                        {{ device.clientsConnected }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel value="temperature" class="ma-0">
                <v-expansion-panel-title>
                  <template v-slot:default="{ expanded }">
                    <v-row dense no-gutters>
                      <v-col class="d-flex justify-start align-center" cols="4">
                        {{ $t('settings.gui.temperature.title') }}
                      </v-col>
                      <v-col
                        class="d-flex justify-end align-center"
                        :style="{
                          color: '#76FF03',
                        }"
                        ><v-chip> {{ temperatureConverted }}° {{ misc.temperatureUnit }}</v-chip>
                      </v-col>
                    </v-row>
                  </template>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <v-card-text class="text-medium-emphasis pa-6">
                    <div class="d-flex text-caption justify-start">
                      {{ $t('settings.gui.temperature.unit') }}
                    </div>
                    <v-row dense no-gutters class="d-flex justify-start align-center">
                      <v-col cols="auto">
                        <v-btn-toggle
                          v-model="misc.temperatureUnit"
                          density="compact"
                          rounded="lg"
                          v-ripple
                          color="#76FF03"
                          variant="outlined"
                          group
                        >
                          <v-btn value="C">
                            {{ $t('settings.gui.temperature.celsius') }} (C)
                          </v-btn>
                          <v-btn value="F">
                            {{ $t('settings.gui.temperature.fahrenheit') }}
                            (F)</v-btn
                          >
                        </v-btn-toggle>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- System Control -->

              <v-expansion-panel value="system-control">
                <v-expansion-panel-title>
                  <template v-slot:default="{ expanded }">
                    <v-card class="transparent-card" density="compact" tile width="100%">
                      <v-row no-gutters class="d-flex justify-end align-center">
                        <v-col class="d-flex justify-start align-center" cols="6">
                          {{ $t('settings.device.systemControl.title') }}
                        </v-col>
                        <v-col class="d-flex justify-end align-center">
                          <v-icon color="warning">mdi-alert-circle</v-icon>
                        </v-col>
                      </v-row>
                      <v-row v-if="expanded" dense class="d-flex justify-start align-center">
                        <v-col cols="12">
                          <v-card-subtitle>
                            {{ $t('settings.device.systemControl.subtitle') }}
                          </v-card-subtitle>
                        </v-col>
                      </v-row>
                    </v-card>
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-card-text class="text-medium-emphasis pa-6">
                    <v-row dense no-gutters>
                      <v-col cols="12">
                        <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
                          {{ $t('settings.device.systemControl.warning') }}
                        </v-alert>
                      </v-col>
                    </v-row>
                    <v-row dense no-gutters>
                      <v-col cols="12" class="d-flex justify-end">
                        <v-btn
                          color="error"
                          variant="tonal"
                          prepend-icon="mdi-restart"
                          @click="rebootDialog?.open()"
                        >
                          {{ $t('settings.device.systemControl.rebootButton') }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- KVM Device Identity -->

              <v-expansion-panel v-if="device.board.type !== 'mangopi'" value="identity">
                <v-expansion-panel-title>
                  <template v-slot:default="{ expanded }">
                    <v-card class="transparent-card" density="compact" tile width="100%">
                      <v-row no-gutters class="d-flex justify-end align-center">
                        <v-col class="d-flex justify-start align-center" cols="6">
                          {{ $t('settings.identity.title') }}
                        </v-col>

                        <v-col
                          class="d-flex justify-end align-center"
                          :style="{
                            color: '#76FF03',
                          }"
                        >
                          <v-chip>
                            {{ device.meta.monitorName }}
                          </v-chip>
                        </v-col>
                      </v-row>
                      <v-row v-if="expanded" dense class="d-flex justify-start align-center">
                        <v-col cols="12">
                          <v-card-subtitle>
                            {{ $t('settings.identity.subtitle') }}
                          </v-card-subtitle>
                        </v-col>
                      </v-row>
                    </v-card>
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-card-text class="text-medium-emphasis pa-6">
                    <div class="text-caption">
                      {{ $t('settings.identity.monitorNameField') }}
                    </div>
                    <v-row dense no-gutters>
                      <v-col cols="12">
                        <v-text-field
                          v-model="device.meta.monitorName"
                          density="compact"
                          rounded="lg"
                          v-ripple
                          color="#76FF03"
                          variant="outlined"
                          hide-details
                          single-line
                          clearable
                          @keydown.stop
                          @keyup.stop
                          @update:focused="
                            (f) => onEdidFieldFocus('monitorName', f, device.meta.monitorName)
                          "
                        >
                          <template v-slot:append>
                            <v-icon
                              size="small"
                              color="#76FF03"
                              @click="copyClipboard(device.meta.monitorName)"
                              >mdi-content-copy</v-icon
                            >
                          </template>
                        </v-text-field>
                      </v-col>
                    </v-row>
                    <br />
                    <div class="text-caption">
                      {{ $t('settings.identity.manufacturerNameField') }}
                    </div>
                    <v-row dense no-gutters>
                      <v-col cols="12">
                        <v-text-field
                          v-model="device.meta.manufacturer"
                          density="compact"
                          rounded="lg"
                          v-ripple
                          color="#76FF03"
                          variant="outlined"
                          single-line
                          clearable
                          maxlength="3"
                          :rules="[
                            (v) => !!v || 'Manufacturer is required',
                            (v) =>
                              (v && v.length === 3) || 'Manufacturer must be exactly 3 characters',
                          ]"
                          @keydown.stop
                          @keyup.stop
                          @update:focused="
                            (f) => onEdidFieldFocus('manufacturer', f, device.meta.manufacturer)
                          "
                        >
                          <template v-slot:append>
                            <v-icon
                              size="small"
                              color="#76FF03"
                              @click="copyClipboard(device.meta.manufacturer)"
                              >mdi-content-copy</v-icon
                            >
                          </template>
                        </v-text-field>
                      </v-col>
                    </v-row>

                    <div class="text-caption">
                      {{ $t('settings.identity.productIdField') }}
                    </div>

                    <v-row dense no-gutters>
                      <v-col cols="12">
                        <v-text-field
                          v-model="device.meta.productId"
                          density="compact"
                          rounded="lg"
                          v-ripple
                          color="#76FF03"
                          variant="outlined"
                          single-line
                          clearable
                          type="number"
                          min="0"
                          max="65535"
                          :rules="[
                            (v) => !!v || 'Product ID is required',
                            (v) => /^\d+$/.test(v) || 'Product ID must be a number',
                            (v) =>
                              (parseInt(v) >= 0 && parseInt(v) <= 65535) ||
                              'Product ID must be 0-65535',
                          ]"
                          @keydown.stop
                          @keyup.stop
                          @update:focused="
                            (f) => onEdidFieldFocus('productId', f, device.meta.productId)
                          "
                          @update:modelValue="
                            (val) => {
                              const num = parseInt(val, 10);
                              if (!isNaN(num)) {
                                device.meta.productId = Math.min(65535, Math.max(0, num));
                              } else {
                                device.meta.productId = '';
                              }
                            }
                          "
                        >
                          <template v-slot:append>
                            <v-icon
                              size="small"
                              color="#76FF03"
                              @click="copyClipboard(device.meta.productId)"
                              >mdi-content-copy</v-icon
                            >
                          </template>
                        </v-text-field>
                      </v-col>
                    </v-row>

                    <br />
                    <div class="text-caption">
                      {{ $t('settings.identity.serialField') }}
                    </div>
                    <v-row dense no-gutters>
                      <v-col cols="12">
                        <v-text-field
                          v-model="device.meta.serial"
                          density="compact"
                          rounded="lg"
                          v-ripple
                          color="#76FF03"
                          variant="outlined"
                          hide-details
                          single-line
                          clearable
                          @keydown.stop
                          @keyup.stop
                          @update:focused="(f) => onEdidFieldFocus('serial', f, device.meta.serial)"
                        >
                          <template v-slot:append>
                            <v-icon
                              size="small"
                              color="#76FF03"
                              @click="copyClipboard(device.meta.serial)"
                              >mdi-content-copy</v-icon
                            >
                          </template>
                        </v-text-field>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- KVM Device Display -->

              <v-expansion-panel value="display">
                <v-expansion-panel-title>
                  <template v-slot:default="{ expanded }">
                    <v-card class="transparent-card" density="compact" tile width="100%">
                      <v-row no-gutters class="d-flex justify-end align-center">
                        <v-col class="d-flex justify-start" cols="5">
                          {{ $t('settings.device.general.display.title') }}
                        </v-col>

                        <v-col
                          class="d-flex justify-end align-center"
                          :style="{
                            color: '#76FF03',
                          }"
                        >
                          <v-chip>
                            {{
                              device.display.modes.find((m) => m.value === device.display.mode)
                                ?.title || 'Unknown'
                            }}
                          </v-chip>
                        </v-col>
                      </v-row>
                      <v-row v-if="expanded" dense>
                        <v-col cols="12">
                          <v-card-subtitle>
                            {{ $t('settings.device.general.display.subtitle') }}
                          </v-card-subtitle>
                        </v-col>
                      </v-row>
                    </v-card>
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-card-text class="text-medium-emphasis pa-6">
                    <div class="text-caption">
                      {{ $t('settings.device.general.display.mode') }}
                    </div>
                    <v-row dense no-gutters>
                      <v-col>
                        <v-select
                          v-model="device.display.mode"
                          :items="displayModes"
                          item-title="title"
                          item-value="value"
                          variant="outlined"
                          rounded="lg"
                          density="compact"
                          tile
                          v-ripple
                          color="#76FF03"
                          @update:modelValue="changeDisplayMode"
                        >
                        </v-select>
                      </v-col>
                    </v-row>
                    <br />
                    <div class="text-caption" v-if="device.display.mode === 'boot'">
                      {{ $t('settings.device.general.display.bootMode') }}
                    </div>
                    <v-row dense no-gutters v-if="device.display.mode === 'boot'">
                      <v-col cols="12">
                        <v-slider
                          v-model="device.display.displayBootTime"
                          :min="60"
                          :max="3600"
                          :step="100"
                          show-ticks="always"
                          tick-size="2"
                          v-ripple
                          color="#76FF03"
                          track-color="#76FF03"
                          track-fill-color="#76FF03"
                          @end="changeDisplayBootTime"
                        >
                          <template v-slot:append>
                            <v-text-field
                              v-model="device.display.displayBootTime"
                              density="compact"
                              rounded="lg"
                              v-ripple
                              color="#76FF03"
                              style="width: 111px"
                              type="number"
                              suffix="sec"
                              variant="outlined"
                              hide-details
                              single-line
                            ></v-text-field>
                          </template>
                        </v-slider>
                      </v-col>
                    </v-row>
                    <br />
                    <div class="text-caption" v-if="device.display.mode === 'interval'">
                      {{ $t('settings.device.general.display.intervalMode') }}
                    </div>
                    <v-row
                      no-gutters
                      class="d-flex justify-end align-center"
                      style="align-items: center; justify-content: space-between"
                      v-if="device.display.mode === 'interval'"
                    >
                      <v-col cols="12" class="d-flex justify-end align-center">
                        <v-slider
                          v-model="device.display.displayOnInterval"
                          :min="10"
                          :max="device.display.totalCycleTime - 10"
                          :step="10"
                          show-ticks="always"
                          tick-size="2"
                          v-ripple
                          color="#76FF03"
                          track-color="#76FF03"
                          track-fill-color="#76FF03"
                          @end="changeDisplayIntervalTime"
                        >
                          <template v-slot:append>
                            <v-text-field
                              v-model="device.display.displayOnInterval"
                              density="compact"
                              rounded="lg"
                              v-ripple
                              color="#76FF03"
                              style="width: 111px"
                              type="number"
                              suffix="sec"
                              variant="outlined"
                              hide-details
                              single-line
                            ></v-text-field>
                          </template>
                        </v-slider>
                      </v-col>
                    </v-row>
                    <div class="text-caption" v-if="device.display.mode === 'interval'">
                      Total cycle Interval
                    </div>
                    <v-row
                      no-gutters
                      class="d-flex justify-end align-center"
                      style="align-items: center; justify-content: space-between"
                      v-if="device.display.mode === 'interval'"
                    >
                      <v-col cols="12" class="d-flex justify-end align-center">
                        <v-slider
                          v-model="device.display.totalCycleTime"
                          :min="100"
                          :max="3600"
                          :step="100"
                          show-ticks="always"
                          tick-size="2"
                          v-ripple
                          color="#76FF03"
                          track-color="#76FF03"
                          track-fill-color="#76FF03"
                          @end="changeDisplayCycleTime"
                        >
                          <template v-slot:append>
                            <v-text-field
                              v-model="device.display.totalCycleTime"
                              density="compact"
                              rounded="lg"
                              v-ripple
                              color="#76FF03"
                              style="width: 111px"
                              type="number"
                              suffix="sec"
                              variant="outlined"
                              hide-details
                              single-line
                            ></v-text-field>
                          </template>
                        </v-slider>
                      </v-col>
                    </v-row>
                    <div class="text-caption">
                      {{ $t('settings.device.general.display.secondaryIP') }}
                    </div>
                    <v-row dense no-gutters>
                      <v-col>
                        <v-select
                          v-model="device.display.secondaryIP"
                          :items="ifaceArray"
                          item-title="title"
                          item-value="value"
                          variant="outlined"
                          rounded="lg"
                          density="compact"
                          tile
                          v-ripple
                          color="#76FF03"
                          @update:modelValue="changeDisplaySecondaryIP"
                        >
                        </v-select>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-expansion-panel-text>
              </v-expansion-panel>
              <!-- Fan -->
              <v-expansion-panel v-if="device.board.type !== 'mangopi'" value="fan">
                <v-expansion-panel-title>
                  <template v-slot:default="{ expanded }">
                    <v-row no-gutters class="d-flex justify-end align-center">
                      <v-col class="d-flex justify-start" cols="4">
                        {{ $t('settings.device.general.fan.title') }}
                      </v-col>
                      <v-col
                        class="d-flex justify-end align-center"
                        :style="{
                          color: '#76FF03',
                        }"
                      >
                        <v-chip> {{ device.fan.tempThreshold }}° C </v-chip>
                      </v-col>
                    </v-row>
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-card-text class="text-medium-emphasis pa-6">
                    <div class="text-caption">
                      {{ $t('settings.device.general.fan.tempThresholdField') }}
                    </div>
                    <v-row dense no-gutters>
                      <v-col cols="12">
                        <v-slider
                          v-model="device.fan.tempThreshold"
                          min="0"
                          max="100"
                          :step="1"
                          show-ticks="always"
                          thumb-label="always"
                          :ticks="tickLabels"
                          class="align-center"
                          hide-details
                          v-ripple
                          color="#76FF03"
                          track-color="#76FF03"
                          track-fill-color="#76FF03"
                          @end="handleFanThresholdChange"
                        >
                          <template v-slot:thumb-label="{ modelValue }">
                            <span class="custom-thumb-label"> {{ tickLabel(modelValue) }}° C </span>
                          </template>
                        </v-slider>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Health Check -->
      <SettingHealthCheck
        v-model:innerPanel="innerPanel"
        :setHealthThreshold="setHealthThreshold"
      />

      <!-- Video -->
      <v-expansion-panels v-model="innerPanel" multiple>
        <v-expansion-panel value="video">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-card class="transparent-card" density="compact" tile width="100%">
                <v-row no-gutters class="d-flex justify-start align-center">
                  <v-col cols="1">
                    <v-icon>mdi-monitor</v-icon>
                  </v-col>
                  <v-col class="d-flex justify-start align-center" cols="1">
                    {{ $t('settings.device.video.title') }}
                  </v-col>
                  <v-col
                    class="d-flex justify-end align-center"
                    :style="{
                      color: '#76FF03',
                    }"
                    ><v-chip>
                      {{ device.video.isActive ? device.video.videoMode : 'deactivated' }}
                    </v-chip>
                  </v-col>
                </v-row>
                <v-row v-if="expanded" dense>
                  <v-col cols="*">
                    <v-card-subtitle>
                      {{ $t('settings.device.video.subtitle') }}
                    </v-card-subtitle>
                  </v-col>
                </v-row>
              </v-card>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <SettingsVideo />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Mic Registration -->
      <SettingsMic v-model:innerPanel="innerPanel" />

      <!-- Keyboard & Mouse -->
      <v-expansion-panels v-model="innerPanel" multiple>
        <v-expansion-panel value="hid">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-card class="transparent-card" density="compact" tile width="100%">
                <v-row no-gutters class="d-flex justify-start align-center">
                  <v-col cols="1">
                    <v-icon>mdi-usb</v-icon>
                  </v-col>
                  <v-col class="d-flex justify-start align-center" cols="8">
                    {{ $t('settings.device.hid.title') }}
                  </v-col>
                  <v-col
                    cols="3"
                    class="d-flex justify-end align-center"
                    :style="{
                      color: device.hid.isActive ? '#76FF03' : '#D32F2F',
                    }"
                  >
                    <v-chip>
                      {{ device.hid.isActive ? $t('common.active') : $t('common.unavailable') }}
                    </v-chip>
                  </v-col>
                </v-row>
                <v-row v-if="expanded" dense>
                  <v-col cols="*">
                    <v-card-subtitle>
                      {{ $t('settings.device.hid.subtitle') }}
                    </v-card-subtitle>
                  </v-col>
                </v-row>
              </v-card>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <SettingsMouse />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-expansion-panel-text>
  </v-expansion-panel>

  <!-- Reboot Confirmation Dialog -->
  <DialogReboot ref="rebootDialog" />
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { useDevice } from '@/composables/useDevice.js';
  import { useConversion } from '@/composables/useConversion.js';
  import { useClipboard } from '@/composables/useClipboard.js';
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';
  import { useAlert } from '@/composables/useAlert.js';
  import http from '@/utils/http.js';
  import { useTemperature } from '@/composables/useTemperature.js';
  import { useHealth } from '@/composables/useHealth.js';
  import DialogReboot from '@/components/dialog/DialogReboot.vue';

  const { convertBytesToGiB } = useConversion();
  const { device } = useDevice();
  const innerPanel = ref([]);
  const { copyClipboard } = useClipboard();
  const store = useAppStore();
  const { misc, isExperimental, systeminfo } = storeToRefs(store);
  const { sendAlert } = useAlert(alert);
  const { temperatureConverted, tempThresholdDisplay, tempMax, tempMin, temperatureColor } =
    useTemperature(device);
  const { getHealthThreshold } = useHealth();

  // Reboot dialog ref
  const rebootDialog = ref(null);

  const ramThresholdColor = computed(() => {
    return 1 - device.value.mem.actual / systeminfo.value.memTotal <
      device.value.health.ramThreshold
      ? '#76FF03'
      : 'red';
  });

  const storageColor = computed(() => {
    return 1 - device.value.storage.actual / systeminfo.value.storageTotal <
      device.value.health.storageThreshold
      ? '#76FF03'
      : 'red';
  });

  const netWorkColor = computed(() => {
    return device.value.networkLatency < device.value.health.networkLatencyThreshold
      ? '#76FF03'
      : 'red';
  });

  const ifaceArray = computed(() => {
    return device.value.network.interfaces
      .map((networkInterface) => networkInterface.iface)
      .filter((iface) => iface && iface !== 'eth0');
  });

  // Computed property to update 'boot' mode title dynamically
  const displayModes = computed(() =>
    device.value.display.modes.map((mode) =>
      mode.value === 'boot'
        ? {
            ...mode,
            title: `Keep on for ${device.value.display.displayBootTime} sec after boot`,
          }
        : mode
    )
  );

  // Handle panel open event - load both system info and MSD image list
  const handlePanelOpen = async (selected) => {
    if (typeof selected === 'object' && selected && 'value' in selected) {
      selected = selected.value;
    }
    if (!selected) return;
    // Load system info for device storage data (used by chart)
    getHealthThreshold();
  };

  const handleInnerPanelUpdate = async (panel) => {
    try {
      for (const value of panel) {
        if (value === 'identity') {
          const response = await http.get('/video/edid');
          if ((response.status === 200) & (response.data.code === 0)) {
            device.value.meta.manufacturer = response.data.data.manufacturer_id;
            device.value.meta.monitorName = response.data.data.monitor_name;
            device.value.meta.productId = response.data.data.product_id;
            device.value.meta.serial = response.data.data.serial_number;
          } else {
            const title = 'Get EDID Error';
            const message = response.data.msg;
            sendAlert('error', title, message);
          }
        }
        if (value === 'display') {
          const response = await http.get('/display');
          if ((response.status === 200) & (response.data.code === 0)) {
            device.value.display.mode = response.data.data.mode;
            device.value.display.displayBootTime = response.data.data.onBootTime;
            device.value.display.totalCycleTime = response.data.data.cycleInterval;
            device.value.display.displayOnInterval = response.data.data.displayTime;
            device.value.display.secondaryIP = response.data.data.secondaryIP;
          } else {
            const title = 'Get Display Info Error';
            const message = response.data.msg;
            sendAlert('error', title, message);
          }
        }
      }
    } catch (error) {
      const title = 'Get Info error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const tickLabels = computed(() => {
    if (misc.value.temperatureUnit === 'C') {
      return {
        0: 'min',
        100: 'max',
      };
    } else {
      return {
        0: 'min',
        120: 'max',
      };
    }
  });

  const tickLabel = (value) => {
    return tickLabels.value[value] || value; // Default to the number if no label is found
  };

  const changeDisplayMode = async (mode) => {
    try {
      const requestBody = {
        mode: mode,
        onBootTime: device.value.display.displayBootTime,
        cycleInterval: device.value.display.totalCycleTime,
        displayTime: device.value.display.displayOnInterval,
        secondaryIP: device.value.display.secondaryIP,
      };
      const response = await http.post('/display', requestBody);
      if ((response.status === 200) & (response.data.code === 0)) {
        device.value.display.mode = response.data.data.mode;
        device.value.display.displayBootTime = response.data.data.onBootTime;
        device.value.display.totalCycleTime = response.data.data.cycleInterval;
        device.value.display.displayOnInterval = response.data.data.displayTime;
        device.value.display.secondaryIP = response.data.data.secondaryIP;
        // restart kvmd-main
        const restartResponse = await http.post('/kvmdmain?action=restart');
        if ((restartResponse.status === 200) & (restartResponse.data.code === 0)) {
          const title = 'KVMD MAIN';
          const message = `display restart successfully`;
          sendAlert('success', title, message);
        } else {
          const title = 'KVMD MAIN';
          const message = `display restart failed ${restartResponse.data.msg}`;
          sendAlert('error', title, message);
        }
      } else {
        const title = 'Set Display Error';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Set Display Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const handleFanThresholdChange = async (value) => {
    try {
      device.value.fan.tempThreshold = value;
      const requestBody = {
        tempThreshold: value,
      };
      const response = await http.post('/fan', requestBody);
      if ((response.status === 200) & (response.data.code === 0)) {
        const title = 'Fan Threshold';
        const message = response.data.msg;
        sendAlert('success', title, message);
        // restart kvmd-main
        const restartResponse = await http.post('/kvmdmain?action=restart');
        if ((restartResponse.status === 200) & (restartResponse.data.code === 0)) {
          const title = 'KVMD MAIN';
          const message = `fan restart successfully`;
          sendAlert('success', title, message);
        } else {
          const title = 'KVMD MAIN';
          const message = `fan restart failed ${restartResponse.data.msg}`;
          sendAlert('error', title, message);
        }
      } else {
        const title = 'Set Fan Threshold Error';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Set Fan Threshold Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const changeDisplayBootTime = async (time) => {
    try {
      const requestBody = {
        mode: device.value.display.mode,
        onBootTime: time,
        cycleInterval: device.value.display.totalCycleTime,
        displayTime: device.value.display.displayOnInterval,
        secondaryIP: device.value.display.secondaryIP,
      };
      const response = await http.post('/display', requestBody);
      if ((response.status === 200) & (response.data.code === 0)) {
        device.value.display.mode = response.data.data.mode;
        device.value.display.displayBootTime = response.data.data.onBootTime;
        device.value.display.totalCycleTime = response.data.data.cycleInterval;
        device.value.display.displayOnInterval = response.data.data.displayTime;
        device.value.display.secondaryIP = response.data.data.secondaryIP;
        // restart kvmd-main
        const restartResponse = await http.post('/kvmdmain?action=restart');
        if ((restartResponse.status === 200) & (restartResponse.data.code === 0)) {
          const title = 'KVMD MAIN';
          const message = `display restart successfully`;
          sendAlert('success', title, message);
        } else {
          const title = 'KVMD MAIN';
          const message = `display restart failed ${restartResponse.data.msg}`;
          sendAlert('error', title, message);
        }
      } else {
        const title = 'Set Display Error';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Set Display Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const changeDisplayIntervalTime = async (time) => {
    try {
      const requestBody = {
        mode: device.value.display.mode,
        onBootTime: device.value.display.displayBootTime,
        cycleInterval: device.value.display.totalCycleTime,
        displayTime: time,
        secondaryIP: device.value.display.secondaryIP,
      };
      const response = await http.post('/display', requestBody);
      if ((response.status === 200) & (response.data.code === 0)) {
        device.value.display.mode = response.data.data.mode;
        device.value.display.displayBootTime = response.data.data.onBootTime;
        device.value.display.totalCycleTime = response.data.data.cycleInterval;
        device.value.display.displayOnInterval = response.data.data.displayTime;
        device.value.display.secondaryIP = response.data.data.secondaryIP;
        const title = 'Set Display';
        const message = `Update display interval time ${device.value.display.displayOnInterval} successfully`;
        sendAlert('success', title, message);
        // restart kvmd-main
        const restartResponse = await http.post('/kvmdmain?action=restart');
        if ((restartResponse.status === 200) & (restartResponse.data.code === 0)) {
          const title = 'KVMD MAIN';
          const message = `display restart successfully`;
          sendAlert('success', title, message);
        } else {
          const title = 'KVMD MAIN';
          const message = `display restart failed ${restartResponse.data.msg}`;
          sendAlert('error', title, message);
        }
      } else {
        const title = 'Set Display Error';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Set Display Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const changeDisplayCycleTime = async (time) => {
    try {
      const requestBody = {
        mode: device.value.display.mode,
        onBootTime: device.value.display.displayBootTime,
        cycleInterval: time,
        displayTime: device.value.display.displayOnInterval,
        secondaryIP: device.value.display.secondaryIP,
      };
      const response = await http.post('/display', requestBody);
      if ((response.status === 200) & (response.data.code === 0)) {
        device.value.display.mode = response.data.data.mode;
        device.value.display.displayBootTime = response.data.data.onBootTime;
        device.value.display.totalCycleTime = time;
        device.value.display.displayOnInterval = response.data.data.displayTime;
        device.value.display.secondaryIP = response.data.data.secondaryIP;
        const title = 'Set Display';
        const message = `Update display cycle time ${device.value.display.totalCycleTime} successfully`;
        sendAlert('success', title, message);
        // restart kvmd-main
        const restartResponse = await http.post('/kvmdmain?action=restart');
        if ((restartResponse.status === 200) & (restartResponse.data.code === 0)) {
          const title = 'KVMD MAIN';
          const message = `display restart successfully`;
          sendAlert('success', title, message);
        } else {
          const title = 'KVMD MAIN';
          const message = `display restart failed ${restartResponse.data.msg}`;
          sendAlert('error', title, message);
        }
      } else {
        const title = 'Set Display Error';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Set Display Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const changeDisplaySecondaryIP = async (secondaryIP) => {
    try {
      const requestBody = {
        mode: device.value.display.mode,
        onBootTime: device.value.display.displayBootTime,
        cycleInterval: device.value.display.totalCycleTime,
        displayTime: device.value.display.displayOnInterval,
        secondaryIP: secondaryIP,
      };
      const response = await http.post('/display', requestBody);
      if ((response.status === 200) & (response.data.code === 0)) {
        device.value.display.mode = response.data.data.mode;
        device.value.display.displayBootTime = response.data.data.onBootTime;
        device.value.display.totalCycleTime = response.data.data.cycleInterval;
        device.value.display.displayOnInterval = response.data.data.displayTime;
        device.value.display.secondaryIP = response.data.data.secondaryIP;
        const title = 'Set Display';
        const message = `Update display secondary IP ${device.value.display.secondaryIP} successfully`;
        sendAlert('success', title, message);
        // restart kvmd-main
        const restartResponse = await http.post('/kvmdmain?action=restart');
        if ((restartResponse.status === 200) & (restartResponse.data.code === 0)) {
          const title = 'KVMD MAIN';
          const message = `display restart successfully`;
          sendAlert('success', title, message);
        } else {
          const title = 'KVMD MAIN';
          const message = `display restart failed ${restartResponse.data.msg}`;
          sendAlert('error', title, message);
        }
      } else {
        const title = 'Set Display Error';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Set Display Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  // Helpers to validate EDID fields
  function isManufacturerValid(val) {
    return !!val && String(val).length === 3;
  }
  function isProductIdValid(val) {
    if (val === '' || val === null || val === undefined) return false;
    if (!/^\d+$/.test(String(val))) return false;
    const num = parseInt(val, 10);
    return num >= 0 && num <= 65535;
  }
  function isMonitorNameValid(val) {
    // Allow empty (optional), otherwise non-empty trimmed
    if (val === '' || val === null || val === undefined) return true;
    return String(val).trim().length > 0;
  }
  function isSerialValid(val) {
    // Allow empty (optional), otherwise non-empty trimmed
    if (val === '' || val === null || val === undefined) return true;
    return String(val).trim().length > 0;
  }

  // Gate calling changeEDIDInfo to only when a field loses focus and passes validation
  const onEdidFieldFocus = (field, focused, value) => {
    if (focused) return; // only act on blur
    let ok = true;
    switch (field) {
      case 'manufacturer':
        ok = isManufacturerValid(value);
        break;
      case 'productId':
        ok = isProductIdValid(value);
        break;
      case 'monitorName':
        ok = isMonitorNameValid(value);
        break;
      case 'serial':
        ok = isSerialValid(value);
        break;
    }
    if (!ok) return;
    changeEDIDInfo(false);
  };

  const changeEDIDInfo = async (value) => {
    try {
      if (value === false) {
        const requestBody = {
          manufacturer_id: device.value.meta.manufacturer,
          product_id: device.value.meta.productId,
          serial_number: device.value.meta.serial,
          monitor_name: device.value.meta.monitorName,
        };
        const response = await http.post('/video/edid', requestBody);
        if ((response.status === 200) & (response.data.code === 0)) {
          device.value.meta.manufacturer = response.data.data.manufacturer_id;
          device.value.meta.monitorName = response.data.data.monitor_name;
          device.value.meta.productId = response.data.data.product_id;
          device.value.meta.serial = response.data.data.serial_number;
          const title = 'Set EDID';
          const message = `Update EDID info successfully`;
          sendAlert('success', title, message);
        } else {
          const title = 'Set EDID Error';
          const message = response.data.msg;
          sendAlert('error', title, message);
        }
      }
    } catch (error) {
      const title = 'Set EDID Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };

  const setHealthThreshold = async () => {
    try {
      const requestBody = {
        RAM: device.value.health.ramThreshold,
        latency: device.value.health.networkLatencyThreshold,
        storage: device.value.health.storageThreshold,
        temperature: device.value.health.temperatureThreshold,
      };
      const response = await http.post('/healthcheck', requestBody);
      if ((response.status === 200) & (response.data.code === 0)) {
      } else {
        const title = 'Set Health Error';
        const message = response.data.msg;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Set Health Error';
      const message = `${error.message}`;
      sendAlert('error', title, message);
    }
  };
</script>

<style scoped>
  .selected-panel {
    background-color: #e3f2fd !important;
    /* Light blue background for selected panel */
    color: #1565c0 !important;
    /* Dark blue text color */
  }

  .transparent-card {
    background: transparent !important;
    box-shadow: none !important;
  }

  .custom-thumb-label {
    background-color: transparent !important;
    /* Make the background transparent */
    color: #76ff03;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    min-width: 50px;
    /* Ensures a minimum width */
    text-align: center;
    /* Centers text inside */
    display: inline-block;
    /* Makes sure width applies properly */
  }
</style>
