import http from '@/utils/http.js';
import { useDevice } from '@/composables/useDevice';
import { useAlert } from '@/composables/useAlert';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const { device } = useDevice();
const { sendAlert } = useAlert();
const store = useAppStore();
const { systeminfo } = storeToRefs(store);

export async function getSystemInfo(selected = true) {
  try {
    if (selected && typeof selected === 'object' && 'value' in selected) {
      selected = selected.value;
    }
    if (!selected) return;
    const response = await http.get('/systeminfo');
    if (response.status === 200 && response.data.code === 0) {
      device.value.meta.deviceType = response.data.data.board.deviceType;
      systeminfo.value.deviceVersion = response.data.data.board.deviceVersion;
      device.value.board.type = response.data.data.board.type;
      systeminfo.value.memTotal = response.data.data.mem.total;
      systeminfo.value.storageTotal = response.data.data.storage.total;
      device.value.os.distro = response.data.data.os.distro;
      device.value.os.codename = response.data.data.os.codename;
      device.value.os.release = response.data.data.os.release;
      device.value.os.arch = response.data.data.os.arch;
      systeminfo.value.hostname = response.data.data.os.hostname;
      device.value.timezone = `${response.data.data.timezone} (${response.data.data.timezoneName})`;
      device.value.network.interfaces = response.data.data.network;
      device.value.mem.actual = response.data.data.mem.actual;
      device.value.storage.actual = response.data.data.storage.actual;
      device.value.isATXActive = response.data.data.config.isATXActive;
      device.value.mic.isRegistered = response.data.data.mic.isRegistered;
    } else {
      const title = 'System Info Error';
      const message = response.data.msg;
      sendAlert('error', title, message);
    }
  } catch (error) {
    const title = 'System Info Error';
    const message = `${error.message}`;
    sendAlert('error', title, message);
  }
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
