import { defineStore } from 'pinia';

export const useVpnStore = defineStore('vpn', {
  state: () => ({
    vpnList: [
      { id: 'tailscaled', active: false, title: 'Tailscale?', ip: '' },
      { id: 'wg-quick@wg0', active: false, title: 'WireGuard?', ip: '' },
      { id: 'zerotier-one', active: false, title: 'Zerotier?', ip: '' },
    ],
  }),
  persist: true,
});
