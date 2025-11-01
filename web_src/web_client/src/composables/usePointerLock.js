import { onMounted, onBeforeUnmount } from 'vue';

export function usePointerLock(device, onChange, onError) {
  const absoluteMode = computed(() => device.value?.hid?.mouse?.absoluteMode);
  const requestPointerLock = (event) => {
    const element = event.target;
    if (element) {
      // TODO relative?
      if (absoluteMode.value === false && element.requestPointerLock) {
        element.requestPointerLock();
      }
    }
  };

  /*
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement !== null;
      if (typeof onChange === 'function') {
        onChange(isLocked);
      }
    };
*/

  // TODO this is a composable no access to document. we don't have element.
  const handlePointerLockChange = (element) => {
    if (element) {
      console.log('xxxxPointer is locked');
    } else {
      console.log('xxxxPointer is unlocked');
    }
  };

  const handlePointerLockError = (event) => {
    if (typeof onError === 'function') {
      onError(event);
    }
  };

  const exitPointerLock = () => {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  };

  // TODO where is this used?
  const isPointerLocked = () => {
    return element !== null;
  };

  onMounted(() => {
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('pointerlockchange', handlePointerLockChange);
    document.removeEventListener('pointerlockerror', handlePointerLockError);
  });

  return {
    requestPointerLock,
    exitPointerLock,
    isPointerLocked,
  };
}
