'use strict';

import http from '@/utils/http.js';
import { useAlert } from '@/composables/useAlert';

const ACLAllowList = ref([]);
const ACLBlockList = ref([]);
const ACLMode = ref('none');

export function useACL() {
  const { sendAlert } = useAlert();
  const getACLState = async () => {
    try {
      const response = await http.get('/network/acl');
      if (response.status === 200 && response.data.code === 0) {
        if (response.data.data) {
          ACLMode.value = response.data.data.mode || 'none';
          ACLAllowList.value = response.data.data.allowList.items || [];
          ACLBlockList.value = response.data.data.blockList.items || [];
          console.log('ACLAllowList: ', ACLAllowList.value);
        }
      } else {
        const title = 'Access Control List';
        const message = response.data.msg || 'Failed to retrieve ACL state';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Access Control List';
      const message = error.message || 'Catch to retrieve ACL state';
      sendAlert('error', title, message);
    }
  };

  const apiAdd = async (mode, ip) => {
    try {
      if (!mode || !ip) {
        const title = 'Access Control List';
        const message = 'Invalid input parameters';
        sendAlert('error', title, message);
        return;
      }
      const requestBody = {
        mode: mode,
        ip: ip,
      };
      const response = await http.post('/network/acl', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        if (response.data.data) {
          ACLAllowList.value = response.data.data.allowList.items || [];
          ACLBlockList.value = response.data.data.blockList.items || [];
        }
      } else {
        const title = 'Access Control List';
        const message = response.data.msg || `Failed to add IP ${ip} to ${mode} list`;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Access Control List';
      const message = error.message || `Catch to add IP ${ip} to ${mode} list`;
      sendAlert('error', title, message);
    }
  };

  const apiRemove = async (mode, ip) => {
    try {
      if (!mode || !ip) {
        const title = 'Access Control List';
        const message = 'Invalid input parameters';
        sendAlert('error', title, message);
        return;
      }
      const requestBody = {
        mode: mode,
        ip: ip,
      };
      const response = await http.delete('/network/acl', { data: requestBody });
      if (response.status === 200 && response.data.code === 0) {
        if (response.data.data) {
          ACLAllowList.value = response.data.data.allowList.items || [];
          ACLBlockList.value = response.data.data.blockList.items || [];
        }
      } else {
        const title = 'Access Control List';
        const message = response.data.msg || `Failed to delete IP ${ip} from ${mode} list`;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Access Control List';
      const message = error.message || `Catch to delete IP ${ip} from ${mode} list`;
      sendAlert('error', title, message);
    }
  };

  const apiChangeACLMode = async (mode) => {
    try {
      if (!mode) {
        const title = 'Access Control List';
        const message = 'Invalid input parameters';
        sendAlert('error', title, message);
        return;
      }
      const requestBody = {
        mode: mode,
      };
      const response = await http.post('/network/acl/mode', requestBody);
      if (response.status === 200 && response.data.code === 0) {
        ACLMode.value = response.data.data.mode || 'none';
      } else {
        const title = 'Access Control List';
        const message = response.data.msg || `Failed to change ACL mode to ${mode}`;
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Access Control List';
      const message = error.message || `Catch to change ACL mode to ${mode}`;
      sendAlert('error', title, message);
    }
  };

  return {
    ACLMode,
    ACLAllowList,
    ACLBlockList,
    getACLState,
    apiAdd,
    apiRemove,
    apiChangeACLMode,
  };
}
