<template>
  <v-container class="virtual-mouse" fluid>
    <v-row justify="center" align="center" dense>
      <!-- 左键：有图标+文字 -->
      <MouseButton
        icon="mdi-mouse-left-click"
        label="Left"
        :active="hold.left"
        color="blue"
        @click="emitClick('left')"
        @hold-start="emitHoldStart('left')"
        @hold-end="emitHoldEnd('left')"
      />
      <!-- 中键：无图标+文字 -->
      <MouseButton
        icon="mdi-pan"
        label="Mid"
        :active="hold.mid"
        color="purple"
        @click="emitClick('mid')"
        @hold-start="emitHoldStart('mid')"
        @hold-end="emitHoldEnd('mid')"
      />
      <!-- 右键：有图标+文字 -->
      <MouseButton
        icon="mdi-mouse-right-click"
        label="Right"
        :active="hold.right"
        color="green"
        :icon-right="true"
        @click="emitClick('right')"
        @hold-start="emitHoldStart('right')"
        @hold-end="emitHoldEnd('right')"
      />
      <!-- 滚轮上：有图标无文字 -->
      <MouseButton icon="mdi-mouse-move-up" color="orange" @click="emitClick('wheel-up')" />
      <!-- 滚轮下：有图标无文字 -->
      <MouseButton icon="mdi-mouse-move-down" color="orange" @click="emitClick('wheel-down')" />
    </v-row>
  </v-container>
</template>

<script setup>
  import { reactive } from 'vue';
  import MouseButton from './shared/MouseButton.vue';
  import { useTouch } from '@/composables/useTouch.js';

  const hold = reactive({
    left: false,
    mid: false,
    right: false,
  });
  const { handleTouchClick, handleTouchHoldStart, handleTouchHoldEnd } = useTouch();

  const emit = defineEmits(['click', 'hold-start', 'hold-end']);

  const emitClick = (btn) => {
    handleTouchClick(btn);
  };

  const emitHoldStart = (btn) => {
    hold[btn] = true;
    handleTouchHoldStart(btn);
  };
  const emitHoldEnd = (btn) => {
    hold[btn] = false;
    handleTouchHoldEnd(btn);
  };
</script>

<style scoped>
  .virtual-mouse {
    padding: 4px;
    border-radius: 16px;
  }
</style>
