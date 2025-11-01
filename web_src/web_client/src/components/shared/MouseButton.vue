<template>
  <v-btn
    class="mouse-btn"
    :class="{ hold: isHold, 'no-icon': !icon }"
    :style="btnStyle"
    :ripple="false"
    size="large"
    variant="flat"
    @touchstart="startPress"
    @touchend="endPress"
    @touchcancel="cancelPress"
    @dblclick.prevent
  >
    <!-- hold 状态：只显示 icon 和 HOLD -->
    <template v-if="isHold">
      <v-icon v-if="icon" :size="isHold ? ThirtyTwoPx : 24" :color="iconColor">{{ icon }}</v-icon>
      <small class="hold-text">HOLD</small>
    </template>
    <!-- 非 hold 状态：仅显示图标 -->
    <template v-else>
      <v-icon v-if="icon" :size="isHold ? ThirtyTwoPx : 24" :color="iconColor">{{ icon }}</v-icon>
    </template>
  </v-btn>
</template>

<script setup>
  import { ref, computed } from 'vue';

  const props = defineProps({
    icon: String,
    color: { type: String, default: 'blue' },
    active: { type: Boolean, default: false },
  });
  const emit = defineEmits(['click', 'hold-start', 'hold-end']);

  const HOLD_COLOR = '#D32F2F'; // 红色：HOLD
  const CLICK_COLOR = '#76FF03'; // 绿色：点击闪烁
  const isHold = ref(false);
  const isClickFlash = ref(false);
  let pressTimer = null;
  let pressStartTime = 0;
  let clickFlashTimer = null;

  const btnStyle = computed(() => {
    // 优先根据交互态着色：HOLD 红，其次点击闪烁绿；否则沿用 active 或灰
    const theme = isHold.value ? HOLD_COLOR : isClickFlash.value ? CLICK_COLOR : null;

    const width = isHold.value ? '60px' : props.icon ? '40px' : '40px';
    const flexDirection = isHold.value ? 'column' : 'row';
    const gap = isHold.value ? '2px' : '0';

    const activeBg = `linear-gradient(145deg, ${props.color}, ${props.color}aa)`;
    const activeShadow = `0 0 12px ${props.color}`;

    const bg = theme
      ? `linear-gradient(145deg, ${theme}, ${theme}aa)`
      : props.active
        ? activeBg
        : 'linear-gradient(145deg, #3a3a3d, #2a2a2d)';

    const shadow = theme
      ? `0 0 12px ${theme}`
      : props.active
        ? activeShadow
        : 'inset 2px 2px 4px #1a1a1d, inset -2px -2px 4px #3a3a3d';

    return {
      background: bg,
      color: theme ? '#fff' : props.active ? '#fff' : '#ccc',
      borderRadius: '12px',
      boxShadow: shadow,
      width,
      height: '60px',
      display: 'flex',
      flexDirection,
      justifyContent: 'center',
      alignItems: 'center',
      gap,
      transition: 'transform 0.15s ease, box-shadow 0.3s ease',
    };
  });

  const iconColor = computed(() =>
    isHold.value || isClickFlash.value ? '#fff' : props.active ? props.color : 'grey-lighten-2'
  );

  function startPress() {
    pressStartTime = Date.now();
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      isHold.value = true;
      emit('hold-start');
    }, 500);
  }

  function endPress() {
    clearTimeout(pressTimer);
    const duration = Date.now() - pressStartTime;
    if (duration < 500) {
      if (!isHold.value) {
        // 点击：绿色闪烁
        isClickFlash.value = true;
        clearTimeout(clickFlashTimer);
        clickFlashTimer = setTimeout(() => (isClickFlash.value = false), 180);
        emit('click');
      } else {
        isHold.value = false;
        emit('hold-end');
      }
    } else {
      isHold.value = false;
      emit('hold-end');
    }
  }

  function cancelPress() {
    clearTimeout(pressTimer);
  }
</script>

<style scoped>
  .mouse-btn {
    transform: scale(1);
    min-width: unset !important; /* 覆盖Vuetify默认64px */
    padding: 0 !important; /* 去掉左右padding */
  }
  .mouse-btn.hold {
    transform: scale(0.92);
    box-shadow: 0 0 18px var(--v-theme-primary) !important;
  }
  .hold-text {
    font-size: 10px;
    opacity: 0.7;
    animation: pulse 1.2s infinite ease-in-out;
  }
  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.6;
    }
  }
</style>
