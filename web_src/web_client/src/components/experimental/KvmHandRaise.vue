<template>
  <v-tooltip location="top" content-class="">
    <template v-slot:activator="{ props: tooltipProps }">
      <v-icon
        v-bind="tooltipProps"
        class="text-none"
        :color="isHandRaised ? '#76FF03' : undefined"
        :size="size"
        icon="mdi-hand-back-right-outline"
        @click="handleHandToggle"
        :loading="isUpdating"
      />
    </template>
    <span>{{ isHandRaised ? 'Lower hand' : 'Raise hand' }}</span>
  </v-tooltip>
</template>

<script setup>
  import { ref, inject, onMounted, onUnmounted } from 'vue';
  import Config from '@/config.js';

  // Props
  const props = defineProps({
    size: {
      type: [String, Number],
      default: 'default',
    },
    userId: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
  });

  // Emits
  const emit = defineEmits(['hand-raised', 'hand-lowered', 'error']);

  // State
  const isHandRaised = ref(false);
  const isUpdating = ref(false);

  // WebSocket connection (could be injected from parent or composable)
  let websocket = null;

  // Method to build the ws URL
  const buildWsUrl = () => {
    const wsProtocol = Config.http_protocol === 'https:' ? 'wss' : 'ws';
    const token = localStorage.getItem('token');
    return `${wsProtocol}://${Config.host_ip}${Config.host_port}/wss?token=${token}`;
  };

  const wsUrl = inject('wsUrl', buildWsUrl);

  // Handle hand raise/lower click
  const handleHandToggle = async () => {
    if (isUpdating.value) return;

    isUpdating.value = true;

    try {
      const newState = !isHandRaised.value;

      // Send WebSocket message
      await sendHandStateUpdate(newState);

      // Update local state
      isHandRaised.value = newState;

      // Emit event for parent component
      emit(newState ? 'hand-raised' : 'hand-lowered', {
        userId: props.userId,
        sessionId: props.sessionId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to update hand state:', error);
      emit('error', error);
    } finally {
      isUpdating.value = false;
    }
  };

  // Send hand state update via WebSocket
  const sendHandStateUpdate = async (raised) => {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message = {
      type: 'hand_state_update',
      data: {
        userId: props.userId,
        sessionId: props.sessionId,
        isHandRaised: raised,
        timestamp: Date.now(),
      },
    };

    try {
      console.log(message);
      websocket.send(JSON.stringify(message));
    } catch (error) {
      throw error;
    }
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'hand_state_sync':
          // Sync hand state from server (on connect or conflict resolution)
          if (message.data.userId === props.userId) {
            isHandRaised.value = message.data.isHandRaised;
          }
          break;

        case 'hand_state_updated':
          // Confirmation that our update was processed
          if (message.data.userId === props.userId) {
            isHandRaised.value = message.data.isHandRaised;
          }
          break;

        case 'error':
          console.error('WebSocket error:', message.data);
          emit('error', new Error(message.data.message));
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    try {
      websocket = new WebSocket(`${wsUrl}?userId=${props.userId}&sessionId=${props.sessionId}`);

      websocket.onopen = () => {
        console.log('Hand raise WebSocket connected');

        // Request current hand state sync
        websocket.send(
          JSON.stringify({
            type: 'sync_hand_state',
            data: {
              userId: props.userId,
              sessionId: props.sessionId,
            },
          })
        );
      };

      websocket.onmessage = handleWebSocketMessage;

      websocket.onerror = (error) => {
        console.error('Hand raise WebSocket error:', error);
        emit('error', error);
      };

      websocket.onclose = (event) => {
        console.log('Hand raise WebSocket closed:', event.code, event.reason);

        // Reconnect after delay if not intentional close
        if (event.code !== 1000) {
          setTimeout(initializeWebSocket, 5000);
        }
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      emit('error', error);
    }
  };

  // Cleanup WebSocket
  const cleanup = () => {
    if (websocket) {
      websocket.close(1000, 'Component unmounted');
      websocket = null;
    }
  };

  // Lifecycle
  onMounted(() => {
    //  initializeWebSocket()
  });

  onUnmounted(() => {
    cleanup();
  });

  // Alternative REST implementation (commented out)
  /*
  const handleHandToggleREST = async () => {
    if (isUpdating.value) return
    
    isUpdating.value = true
    
    try {
      const newState = !isHandRaised.value
      
      const response = await fetch('/api/kvm/hand-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: props.userId,
          sessionId: props.sessionId,
          isHandRaised: newState
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      isHandRaised.value = result.isHandRaised
      
      emit(newState ? 'hand-raised' : 'hand-lowered', result)
      
    } catch (error) {
      console.error('Failed to update hand state:', error)
      emit('error', error)
    } finally {
      isUpdating.value = false
    }
  }
  */
</script>

<style scoped>
  /* Add any custom styles here */
</style>
