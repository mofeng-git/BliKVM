<template>
  <v-dialog v-model="showManageAccountDialog" @keydown.stop @keyup.stop width="800">
    <v-sheet class="pa-3">
      <!-- Compact Header -->
      <v-row class="mb-2" align="center" justify="center">
        <v-col cols="auto" class="d-flex align-center">
          <v-icon size="28" color="#76FF03" class="mr-2">mdi-account-cog</v-icon>
          <span class="text-h5 font-weight-bold">{{ $t('account.title') }}</span>
        </v-col>
      </v-row>

      <v-row class="mb-2" justify="center">
        <v-col cols="auto">
          <span class="text-body-2 text-medium-emphasis">{{ $t('account.subtitle') }}</span>
        </v-col>
      </v-row>

      <v-divider class="my-2"></v-divider>

      <v-sheet width="100%">
        <v-sheet class="inner-sheet pa-4 mx-auto" width="100%">
          <v-sheet
            class="scrollable-container pa-4 text-center mx-auto"
            max-width="800"
            rounded="lg"
            width="100%"
          >
            <v-form ref="form">
              <v-row class="pa-1" justify="space-between">
                <v-col cols="5">
                  <v-toolbar class="inner-sheet" flat>
                    <!-- Title can be optional or moved to the side to not take unnecessary space -->
                    <v-toolbar-title class="d-flex align-items-center" style="flex: 0">
                      <!-- Title content can go here if needed -->
                    </v-toolbar-title>

                    <!-- Flex container to control layout and grow text field properly -->
                    <div class="d-flex align-center" style="flex: 1; gap: 16px">
                      <!-- Ensure the text field takes maximum available space -->
                      <v-text-field
                        v-model="search"
                        append-inner-icon="mdi-magnify"
                        v-ripple
                        rounded="lg"
                        hide-details
                        single-line
                        color="#76FF03"
                        class="flex-grow-1"
                        style="flex: 1"
                      ></v-text-field>

                      <!-- Button container aligned to the right -->
                      <div class="d-flex align-items-center" style="gap: 8px">
                        <v-btn
                          icon
                          :disabled="account.userRole !== 'admin'"
                          @click="handleClick('addUser')"
                        >
                          <v-icon color="#76FF03">mdi-plus</v-icon>
                        </v-btn>

                        <v-btn
                          icon
                          :disabled="!active.length || account.userRole !== 'admin'"
                          @click="handleClick('deleteUser')"
                        >
                          <v-icon color="#76FF03">mdi-minus</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </v-toolbar>

                  <v-list
                    v-if="filteredItems.length"
                    class="inner-sheet"
                    density="compact"
                    item-value="user"
                    activatable
                  >
                    <v-list-item
                      v-for="user in filteredItems"
                      :key="user.username"
                      :value="user.username"
                      :active="user.username === selected?.username"
                      @click="selectUser(user)"
                      class="align-left"
                    >
                      <template v-slot:prepend>
                        <v-icon v-if="!user.children" :color="user.isActive ? '#76FF03' : null"
                          >mdi-account</v-icon
                        >
                      </template>
                      <span>
                        {{ user.username }}
                        <span v-if="user.role"> ({{ user.role }}) </span>
                      </span>
                    </v-list-item>
                  </v-list>
                </v-col>

                <v-divider vertical></v-divider>

                <v-col class="d-flex text-center">
                  <div
                    v-if="!selected"
                    class="text-h6 text-grey-lighten-1 font-weight-light"
                    style="align-self: center"
                  >
                    Select a User
                  </div>
                  <v-card v-else :key="selected.username" flat width="100%">
                    <v-card-text class="inner-sheet">
                      <v-row>
                        <v-col cols="12">
                          <v-text-field
                            v-model="user"
                            :readonly="account.userRole === 'readonly'"
                            :label="$t('account.userField')"
                            color="primary"
                            :placeholder="$t('account.userPlaceholder')"
                          />
                        </v-col>
                      </v-row>

                      <v-row>
                        <v-col cols="12">
                          <v-text-field
                            v-model="password"
                            :append-inner-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                            :type="show1 ? 'text' : 'password'"
                            :label="$t('account.passwordField')"
                            color="#76FF03"
                            :placeholder="$t('account.passwordPlaceholder')"
                            @click:append-inner="show1 = !show1"
                          />
                        </v-col>
                      </v-row>

                      <v-row>
                        <v-col cols="12">
                          <v-text-field
                            v-model="rePassword"
                            :append-inner-icon="show2 ? 'mdi-eye' : 'mdi-eye-off'"
                            :type="show2 ? 'text' : 'password'"
                            :label="$t('account.rePasswordField')"
                            color="#76FF03"
                            :placeholder="$t('account.rePasswordPlaceholder')"
                            @click:append-inner="show2 = !show2"
                            @onRevert="handleClick('password')"
                          />
                        </v-col>
                      </v-row>

                      <!-- <v-row>
                        <v-col cols="12">
                          <switchField v-model="isActive" :disabled="role === 'admin'"
                            :label="$t('account.isActiveField')" :style="{
                              color: '#76FF03',
                            }" @onRevert="handleClick('enable')" />
                        </v-col>
                      </v-row> -->

                      <v-row>
                        <v-col cols="12">
                          <v-select
                            v-model="role"
                            :items="roleItems"
                            :label="$t('account.roleField')"
                            variant="plain"
                            color="#76FF03"
                            @onRevert="handleClick('role')"
                          >
                            <template #item="{ item, index }">
                              <v-list-item>
                                <v-list-item-title>{{ roleItems[index].role }}</v-list-item-title>
                                <v-list-item-subtitle>{{
                                  roleItems[index].description
                                }}</v-list-item-subtitle>
                              </v-list-item>
                            </template>
                          </v-select>
                        </v-col>
                      </v-row>

                      <v-row>
                        <v-col cols="12">
                          <v-btn
                            color="primary"
                            @click="changePassword"
                            :disabled="account.userRole !== 'admin'"
                            >{{ $t('account.changePassword') }}</v-btn
                          >
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-form>
          </v-sheet>
        </v-sheet>
      </v-sheet>
    </v-sheet>

    <v-card-actions class="bg-surface-light">
      <v-spacer />

      <v-btn
        class="text-none"
        variant="text"
        text="Cancel"
        @click="handleClick('cancel')"
        :disabled="isProcessing"
      />

      <v-btn
        class="text-none"
        color="#76FF03"
        text="Save"
        variant="tonal"
        @click="handleClick('ok')"
        :loading="isProcessing"
      />
    </v-card-actions>
  </v-dialog>
</template>

<script setup>
  import { ref, computed, watch } from 'vue';
  import http from '@/utils/http.js';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useI18n } from 'vue-i18n';
  import { useAlert } from '@/composables/useAlert';
  import { useAccount } from '@/composables/useAccount';

  const { t } = useI18n();

  const { sendAlert } = useAlert();

  const emit = defineEmits(['update:modelValue']);
  const store = useAppStore();
  const { isProcessing, account, showManageAccountDialog } = storeToRefs(store);

  const search = ref('');

  const {
    active,
    isActive,
    role,
    newUser,
    setDefaultUser,
    roleItems,
    filteredItems,
    selected,
    initials,
    user,
    password,
    isUserTaken,
    show1,
    show2,
    rePassword,
    changePassword,
  } = useAccount(search);

  const selectUser = (user) => {
    active.value = [user.username]; // Update active state
  };

  const handleClick = async (actionType) => {
    try {
      await actionHandlers[actionType]();
    } catch (error) {
      console.error(`Error handling actionType ${actionType}:`, error);
    }
  };

  const createTemporaryUser = () => {
    account.value.accountOperation = 'add';
    newUser.value = {
      role: '',
      isActive: false,
      initials: '',
      user: '<new user>', // Default user
      password: '',
    };

    role.value = newUser.value.role;
    isActive.value = newUser.value.isActive;
    initials.value = newUser.value.user[0];
    user.value = newUser.value.user;
    password.value = newUser.value.password;

    console.log('Temporary user created for preview');
  };

  const saveUser = async () => {
    if (account.value.user.length < 1) {
      const title = 'Username too short';
      const message = `Please try again.`;

      sendAlert('error', title, message);

      return;
    }

    if (password.value !== rePassword.value) {
      const title = 'Passwords do not match';
      const message = `Please try again.`;

      sendAlert('error', title, message);

      return;
    }

    if (!isPasswordStrong(password.value)) {
      const title = 'Password not strong enough';
      const message = `Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters. Please try again.`;

      sendAlert('error', title, message);

      return;
    }

    // Update the newUser object with current form values
    newUser.value.initials = initials.value;
    newUser.value.user = user.value;
    newUser.value.password = password.value;
    newUser.value.role = role.value;
    newUser.value.isActive = isActive.value;

    // Check if the updated user is already taken
    if (isUserTaken(newUser.value.user)) {
      const title = 'Username is already taken';
      const message = `Please choose a different username.`;

      sendAlert('error', title, message);

      isProcessing.value = false;
      return;
    }

    // Add a user to the array in a way that ensures Vue tracks the change
    data.value.users = [...data.value.users, { ...newUser.value }]; // Reassign array to trigger reactivity

    // Set the active user to the newly added user
    active.value = [newUser.value.user];

    // Send request to update credentials
    const requestBody = {
      // initials: newUSer.value.initials,
      user: newUser.value.user,
      password: newUser.value.password,
      role: newUser.value.role,
      isActive: newUser.value.isActive,
    };

    try {
      const response = await http.post('/changeaccount', requestBody);
      if (response.status === 200) {
        const title = 'Credentials changed';
        const message = `Your credentials have been successfully updated.`;

        sendAlert('success', title, message);
      }
    } catch (error) {
      console.error('Error changing credentials:', error);
      sendAlert('error', 'Failed to change credentials', 'Please try again later.');
    }

    resetFormFields();
    isProcessing.value = false;
  };

  const resetFormFields = () => {
    initials.value = '';
    user.value = '';
    password.value = '';
    rePassword.value = '';
    role.value = '';
    isActive.value = true;
    show1.value = false;
    show2.value = false;
  };

  const addUserToList = () => {
    if (newUser.value.user === '<new user>') {
      console.error('Please modify the username before adding.');
      return;
    }

    // Check if the updated username is already taken
    if (isUserTaken(newUser.value.user)) {
      console.error('Username is already taken');
      return;
    }

    // Add new user to the users array
    data.value.users = [...data.value.users, { ...newUser.value }]; // Reassign array to trigger reactivity
    active.value = [newUser.value.user]; // Set the new user as active
    resetFormFields(); // Now reset fields after successful addition
    console.log('User added successfully');
  };

  const deleteUser = () => {
    // Check if a user is selected
    if (!selected.value) {
      console.error('No user selected for deletion.');
      return;
    }

    // Check if the selected user is marked as primary
    if (selected.value.role) {
      console.error('TODO Cannot delete a primary user.');
      return;
    }

    // Confirm deletion
    const confirmDeletion = window.confirm(
      `Are you sure you want to delete the user: ${selected.value.user}?`
    );
    if (!confirmDeletion) {
      return;
    }

    // Filter out the user from the users array
    data.value.users = data.value.users.filter((user) => user.user !== selected.value.user);

    setDefaultUser();

    // Reset form fields
    resetFormFields();

    console.log('User deleted successfully');
  };

  const handleRoleChange = (newValue) => {
    console.log('Role selected:', newValue);
  };

  const cancel = async () => {
    try {
      // Reset new user if needed
      newUser.value = {
        role: '',
        isActive: false,
        initials: '',
        user: '<new user>',
        password: '',
      };

      emit('update:modelValue', false);
      showManageAccountDialog.value = false;
    } catch (error) {
      console.error('Error during cancel operation:', error);
    }
  };

  const save = async () => {
    isProcessing.value = true;

    try {
      // Commit the user addition
      saveUser(); // This function should push the new user into the array

      emit('update:modelValue', false);
      showManageAccountDialog.value = false;
    } catch (error) {
      console.error('Error during save operation:', error);
    } finally {
      isProcessing.value = false;
    }
  };

  const actionHandlers = {
    deleteUser: deleteUser,
    addUser: createTemporaryUser,
    saveUser: addUserToList, // Save user only when ready
    //  resetDefaults: handleResetDefaults,

    ok: save,
    cancel: cancel,
  };

  // onMounted(setDefaultUser);
</script>

<style scoped>
  .align-left {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    /* Ensure items are aligned to the start */
  }
</style>
