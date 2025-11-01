'use strict';

import { ref, onMounted, computed } from 'vue';
import http from '@/utils/http.js';
import { useAppStore } from '@/stores/stores';
import { useAlert } from '@/composables/useAlert';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

const store = useAppStore();

const active = ref([]);
const initials = ref('');
const role = ref('');
const user = ref('');
const password = ref('');
const isActive = ref(true);
const show1 = ref(false);
const show2 = ref(false);
const rePassword = ref('');
const account = ref([]); // Initialize as an array

export function useAccount(search) {
  const router = useRouter();
  const { sendAlert } = useAlert();
  const newUser = ref({
    role: '',
    isEnabled: false,
    username: '<new user>',
    password: '',
  });

  const accountItems = computed(() => account.value.accounts || []);
  const roleItems = computed(() => account.value.roles || []);

  const loadAccount = async () => {
    try {
      const response = await http.get('/account');
      // console.log("loadAccount response:", response);
      if (response.status === 200 && response.data.code === 0) {
        account.value = response.data.data || [];
      } else {
        const title = 'Account Management';
        const message = response.data.msg || 'Failed to get account list';
        sendAlert('error', title, message);
      }
    } catch (error) {
      const title = 'Account Management';
      const message = error.message || 'catch to get account list';
      sendAlert('error', title, message);
    }
  };

  const filteredItems = computed(() =>
    account.value.Accounts.filter((account) =>
      account.username.toLowerCase().includes(search.value.toLowerCase())
    )
  );

  const setDefaultUser = () => {
    if (!account.value || !account.value.Accounts) {
      console.error('Accounts data is not loaded or invalid.');
      return;
    }

    const loggedInUser = account.value.username || '';
    console.log(loggedInUser);

    const defaultUser = account.value.Accounts.find((account) => account.username === loggedInUser);

    console.log(defaultUser);

    if (defaultUser) {
      active.value = [defaultUser.username];
    } else if (account.value.Accounts.length) {
      active.value = [account.value.Accounts[0].username];
      console.warn(
        `Logged-in user not found; defaulting to the first user: ${account.value.Accounts[0].username}`
      );
    } else {
      console.error('No users available to set as default.');
    }
  };

  const saveUser = async (user) => {
    try {
      const response = await http.post('/changeaccount', user);
      if (response.status === 200) {
        console.log('User saved successfully:', user);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const defaultUser = computed(() => {
    const loggedInUser = settings.value.account.user || '';
    return account.value.Accounts.find((account) => account.username === loggedInUser);
  });

  // Use computed to set active user
  const setActiveUser = computed(() => {
    if (defaultUser.value) {
      return [defaultUser.value.user];
    } else if (account.value.length) {
      console.warn(
        `Logged-in user not found; defaulting to the first user: ${account.value[0].user}`
      );
      return [account.value[0].user]; // Default to the first user
    } else {
      console.error('No users available to set as default.');
      return []; // No users available
    }
  });

  const deleteUser = async (user) => {
    account.value = account.value.filter((user) => user.user !== user);
    setDefaultUser();
  };

  // Computed property to find the selected user based on the active item
  const selected = computed(() => {
    // If no active item, return undefined
    if (!active.value) return undefined;
    // console.log("active.value:", active.value);
    // Find the selected user from the data.users array
    const selectedUser = account.value.Accounts.find(
      (account) => account.username === active.value[0]
    );

    // console.log("selectedUser:",selectedUser);

    // If a user is found, set the username and password values
    if (selectedUser) {
      initials.value = selectedUser.username[0];
      user.value = selectedUser.username;
      password.value = '';
      isActive.value = selectedUser.isEnabled;
      role.value = selectedUser.role;

      show1.value = false;
      show2.value = false;
    }

    return selectedUser;
  });

  const isUserTaken = (newUser) => {
    return data.value.users.some((user) => user.user === newUser);
  };

  const isPasswordStrong = (password) => {
    // Define password strength criteria
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar
    );
  };

  const changePassword = async () => {
    if (!user.value || !password.value || !rePassword.value || !selected.value.username) {
      const title = 'Account Management';
      const message = 'Each parameter cannot be empty';
      sendAlert('error', title, message);
      return;
    } else if (password.value !== rePassword.value) {
      const title = 'Account Management';
      const message = 'Each parameter cannot be empty';
      sendAlert('error', title, message);
      return;
    }
    const requestBody = {
      targetUsername: selected.value.username,
      newUsername: user.value,
      newPassword: password.value,
    };

    try {
      const response = await http.post('/account/update', requestBody);
      if (response.status === 200 && response.data?.code === 0) {
        logout();
      } else {
        const title = 'Account Management';
        const message = response.data?.msg || `Set password failed (${response.status})`;
        sendAlert('error', title, message);
      }
    } catch (err) {
      // 捕获 401/403/500 等异常
      const title = 'Account Management';
      const message =
        err.response?.data?.msg || err.response?.statusText || err.message || 'Set password failed';
      sendAlert('error', title, message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  onMounted(async () => {
    await loadAccount();
  });

  return {
    account,
    active,
    isActive,
    role,
    newUser,
    setDefaultUser,
    accountItems,
    roleItems,
    filteredItems,
    selected,
    initials,
    user,
    password,
    isUserTaken,
    logout,
    show1,
    show2,
    rePassword,
    changePassword,
  };
}
