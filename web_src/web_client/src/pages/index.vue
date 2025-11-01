<!--
****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
****************************************************************************
-->
<template>
  <DialogLogin />
</template>

<script setup>
  import { ref, shallowRef, onMounted } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRouter } from 'vue-router';
  import { useAppStore } from '@/stores/stores';

  const store = useAppStore();
  const { misc } = storeToRefs(store);
  const { proxy } = getCurrentInstance();

  onMounted(() => {
    console.log('LoginPage mounted');
    const locale = localStorage.getItem('locale');

    if (locale) {
      misc.value.language = locale;
      proxy.$i18n.locale = locale;
    }
  });
</script>

<style scoped>
  html,
  body,
  #app {
    height: 100%;
    margin: 0;
  }

  .login {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }

  .content {
    text-align: left;
    color: white;
    margin-left: 80px;
    /* Adjust the margin-left value as desired */
  }
</style>
