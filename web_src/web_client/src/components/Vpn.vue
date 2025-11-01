<template>
  <v-row dense no-gutters>
    <v-col cols="12">
      {{ $t('settings.security.sessionMgmnt.subtitle') }}
    </v-col>
  </v-row>
  <v-row dense no-gutters class="d-flex justify-start">
    <v-col cols="12">
      <v-list variant="text">
        <v-list-item v-for="(item, i) in vpnList" :key="i" :value="i">
          <v-switch
            v-model="item.active"
            @update:modelValue="(value) => onActiveVpn(item.id, value)"
            :label="item.title"
            color="#76FF03"
            density="compact"
            hide-details
            class="pa-2"
            inset
          >
            <template v-slot:label> {{ $t('common.use') }} {{ item.title }} </template>
          </v-switch>

          <v-text-field
            :model-value="item.ip"
            density="compact"
            rounded="lg"
            v-ripple
            color="#76FF03"
            variant="outlined"
            hide-details
            single-line
            readonly
            :disabled="!item.active"
          >
            <template #append>
              <div class="d-flex ga-1">
                <v-btn
                  color="#76FF03"
                  icon="mdi-open-in-new"
                  size="small"
                  variant="text"
                  :href="`https://${item.ip}`"
                  :disabled="!item.active"
                  rel="noopener noreferrer"
                  target="_blank"
                />
              </div>
            </template>
          </v-text-field>
        </v-list-item>
      </v-list>
    </v-col>
  </v-row>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { useVpnStore } from '@/stores/useVpnStore';
  import { storeToRefs } from 'pinia';
  import { onMounted } from 'vue';
  import { useVPN } from '@/composables/useVPN';

  const store = useVpnStore();
  const { vpnList } = storeToRefs(store);

  const { getVPNState, apiActiveVpn } = useVPN();

  const onActiveVpn = (id, value) => {
    apiActiveVpn(id, value)
      .then(() => {
        getVPNState();
      })
      .catch((error) => {
        console.error(`Error updating VPN ${id}:`, error);
      });
  };

  onMounted(() => {
    getVPNState();
  });
</script>
