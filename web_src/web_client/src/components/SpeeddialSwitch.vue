<template>
  <v-speed-dial
    v-if="device.kvmSwitch.activeSwitchId"
    location="left center"
    open-on-hover
    transition="tab-transition"
  >
    <template v-slot:activator="{ props: activatorProps }">
      <v-tooltip content-class="" location="bottom">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-badge
            v-if="activeChannel !== null && !isActive"
            :content="activeChannel"
            location="bottom center"
            class="custom-badge"
            bordered
            color="primary"
            content-class=""
          >
            <v-fab
              v-bind="mergeProps(activatorProps, tooltipProps)"
              size="small"
              icon="x"
              color="success"
              selected-class="bg-primary"
            />
          </v-badge>
          <v-fab
            v-else
            v-bind="mergeProps(activatorProps, tooltipProps)"
            size="small"
            icon="mdi-server-network-outline"
            color="success"
            selected-class="bg-primary"
          />
        </template>
        <span>{{ tooltipTitle }}</span>
      </v-tooltip>
    </template>

    <template v-for="channel in filteredChannels" :key="channel.id">
      <v-tooltip v-if="channel.override" location="bottom" content-class="">
        <template #activator="{ props }">
          <div v-bind="props">
            <v-btn
              size="x-small"
              rounded
              :color="channel.name == activeChannel ? 'primary' : 'green'"
              @click="setActiveChannel(channel)"
            >
              {{ channel.name }}
            </v-btn>
          </div>
        </template>
        <p>{{ displayName(channel) }}: {{ filteredChannels.length }}</p>
      </v-tooltip>

      <v-tooltip v-else location="bottom" content-class="">
        <template #activator="{ props }">
          <div v-bind="props">
            <v-btn
              size="x-small"
              rounded
              :color="channel.name == activeChannel ? 'primary' : 'green'"
              @click="setActiveChannel(channel)"
            >
              {{ channel.name }}
            </v-btn>
          </div>
        </template>
        <p>{{ displayName(channel) }}</p>
      </v-tooltip>
    </template>
  </v-speed-dial>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import http from '@/utils/http.js';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { useHdmiSwitch } from '@/composables/useHdmiSwitch';
  import { mergeProps } from 'vue';
  const route = useRoute();

  const { kvmSwitch } = useHdmiSwitch();
  console.log(kvmSwitch.value);
  // Computed property to access hdmiSwitch items
  const kvmSwitchItems = computed(() => kvmSwitch.value.items || []);

  const store = useAppStore();
  const { isProcessing } = storeToRefs(store);

  const { device } = useDevice();

  const activeChannel = ref(null);

  const filteredChannels = computed(() => {
    const selectedSwitch = kvmSwitchItems.value.find(
      (item) => item.id === device.value.kvmSwitch.activeSwitchId
    );
    return selectedSwitch ? selectedSwitch.channels : [];
  });

  const tooltipTitle = computed(() => {
    const selectedItem = kvmSwitchItems.value.find(
      (item) => item.id === device.value.kvmSwitch.activeSwitchId
    );
    return selectedItem ? selectedItem.title : 'Invalid switch';
  });

  const displayName = (channel) => {
    return channel.override && channel.override.length > 0 ? channel.override : channel.name;
  };

  const setActiveChannel = async (channel) => {
    const switchId = device.value.kvmSwitch.activeSwitchId;
    const api = `/switch/${switchId}/channel/${channel.id}`;
    console.log(api);

    activeChannel.value = channel.name;
    console.log(activeChannel.value);

    try {
      const response = await http.post(api);
      if (response.status === 200 && response.data.code === 0) {
        console.log(`Invoking ${api} successful`);

        console.log('set module success');
      } else if (response.status !== 200) {
        console.warn(`Invoking ${api} response.status: ${response.status}`);
      } else {
        console.warn(`Invoking ${api} response.data.code: ${response.data.code}`);
      }
    } catch (error) {
      console.error(`Error invoking ${api}:`, error);
    } finally {
    }
  };
</script>
