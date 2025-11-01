'use strict';

import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert';
import { useVpnStore } from '@/stores/useVpnStore';
import { storeToRefs } from 'pinia';

const store = useVpnStore();
const { vpnList } = storeToRefs(store);

export function useVPN() {
  const { sendAlert } = useAlert();

  const getVPNState = async () => {
    try {
      const response = await http.get('/vpn');
      if (response.status === 200 && response.data.code === 0) {
        if (response.data.data) {
          vpnList.value = vpnList.value.map((vpn) => {
            // 根据 vpn.id 找到对应的 rawInfo 数据
            const rawInfo = response.data.data[vpn.id];

            if (rawInfo) {
              // 填充 IP，如果 IP 为 null，则设置为空字符串
              vpn.ip = rawInfo.ip || '';
              // 根据 state 更新 active 状态
              vpn.active = rawInfo.state === 'active';
            } else {
              // 如果没有对应的 rawInfo 数据，重置 IP 和 active 状态
              vpn.ip = '';
              vpn.active = false;
            }

            return vpn;
          });
          console.log('VPN List updated:', vpnList.value);
        }
      } else {
        const title = 'VPN State';
        const message = response.data.msg || 'Failed to get VPN state';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'VPN State';
      const message = error.message || 'Catch to get VPN state';
      sendAlert('error', title, message);
    }
  };

  const apiActiveVpn = async (vpnValue, activeValue) => {
    try {
      const requestBody = {
        vpn: vpnValue,
        active: activeValue,
      };
      const response = await http.post('/vpn', requestBody);
      if (response.status === 200 && response.data.code === 0) {
      } else {
        const title = 'VPN';
        const message = response.data.msg || 'Failed to toggle VPN';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'VPN';
      const message = error.message || 'Catch to toggle VPN';
      sendAlert('error', title, message);
    }
  };

  return {
    getVPNState,
    apiActiveVpn,
  };
}
