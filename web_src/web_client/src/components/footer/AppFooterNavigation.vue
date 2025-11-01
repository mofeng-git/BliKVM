<template>
  <!-- Navigation bar -->
  <v-row 
    v-if="footer.showFooter || footer.pinnedFooter" 
    no-gutters 
    dense 
    align="center" 
    class="w-100" 
    style="height: 40px"
  >
    <!-- Pin button -->
    <v-col order="first" class="d-flex justify-start align-center">
      <v-icon
        color="#76FF03"
        :class="{ 'pin-active': footer.pinnedFooter }"
        @click.stop="togglePin"
      >
        {{ footer.pinnedFooter ? "mdi-pin-outline" : "mdi-pin-off-outline" }}
      </v-icon>
    </v-col>

    <v-spacer />
    <v-spacer />

    <!-- Navigation toggle buttons -->
    <v-col
      v-if="smAndUp"
      cols="auto"
      class="d-flex justify-center align-center footer-toggle-center"
    >
      <v-btn-toggle
        :model-value="activeToggle"
        multiple
        color="#76FF03"
        density="compact"
        @update:model-value="handleToggleChange"
      >
        <v-btn
          v-for="item in availableMenuItems"
          :key="item.id"
          :value="item.id"
          :prepend-icon="item.icon"
          size="small"
          variant="outlined"
          class="text-none"
          :style="item.id === 'video' ? 'pointer-events: none;' : ''"
        >
          <span v-if="activeToggle.includes(item.id)">{{ item.text }}</span>
        </v-btn>
      </v-btn-toggle>
    </v-col>

    <v-spacer />

    <!-- Current key press indicator -->
    <v-col class="d-flex justify-end align-center pa-0 ma-0">
      <v-chip
        v-if="device.hid.keyboard.keyPress"
        grow
        color="#76FF03"
        :ripple="false"
        v-tooltip:top="$t('common.keypress')"
        class="align-center cursor-default"
        @click.stop
      >
        {{ device.hid.keyboard.keyPress }}
      </v-chip>
    </v-col>

    <v-divider class="mx-3" inset vertical />

    <!-- Lock state indicators -->
    <v-col order="last" class="d-flex justify-end align-center pa-0 ma-0">
      <v-chip
        v-for="lock in lockStates"
        :key="lock.name"
        :disabled="!lock.active"
        :color="lock.active ? '#76FF03' : ''"
      >
        {{ lock.name }}
      </v-chip>
      &nbsp;
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from "vue-i18n";
import { useDisplay } from 'vuetify';

// Props
const props = defineProps({
  footer: {
    type: Object,
    required: true
  },
  activeToggle: {
    type: Array,
    required: true
  },
  device: {
    type: Object,
    required: true
  },
  lockStates: {
    type: Array,
    required: true
  },
  isTouchDevice: {
    type: Boolean,
    required: true
  },
  handleToggleChange: {
    type: Function,
    required: true
  },
  togglePin: {
    type: Function,
    required: true
  }
});

// Composables
const { t } = useI18n();
const { smAndUp } = useDisplay();

// Menu items configuration
const menuItems = [
  { id: "keyboard", text: t("common.keyboard"), icon: "mdi-keyboard" },
  { id: "video", text: t("common.video"), icon: "mdi-monitor" },
  { id: "mouse", text: t("common.mouse"), icon: "mdi-mouse-outline" },
  { id: "console", text: t("appFooter.sshTerminal"), icon: "mdi-console-line" },
  { id: "serial", text: t("appFooter.serialTerminal"), icon: "mdi-serial-port" },
  { id: "notifications", text: t("notification.title"), icon: "mdi-bell-outline" }
];

// Computed properties
const availableMenuItems = computed(() => 
  menuItems.filter(item => item.id !== 'mouse' || props.isTouchDevice)
);
</script>

<style scoped>
.cursor-default {
  cursor: default;
}

.footer-toggle-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
</style>