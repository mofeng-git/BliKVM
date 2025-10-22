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
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom">

    <template v-slot:activator="{ props }">
      <v-btn icon class="toolbar-btn" size="30" v-bind="props">
        <v-icon class="toolbar-icon">mdi-cog</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ $t('tab.setting.tip') }} </v-tooltip>
      </v-btn>
    </template>

    <UiParentCard :title="$t('tab.setting.tip')" @mouseenter.stop @mousemove.stop @keydown.stop @keypress.stop
      @keyup.stop>
      <v-row>
        <v-col cols="12" sm="6" md="6">
          <v-label class="text-subtitlte-1">{{ $t('tab.setting.reboot_kvm') }}</v-label>
        </v-col>

        <v-col cols="12" sm="6" md="6">
          <v-btn key="primary" color="primary" @click="makeSureReboot">
            {{ $t('button.reboot') }}
          </v-btn>
        </v-col>

        <v-col cols="12" sm="6" md="6">
          <v-label class="text-subtitlte-1">{{ $t('tab.setting.fetch_version') }}</v-label>
        </v-col>

        <v-col cols="12" sm="6" md="6">
          <v-btn key="primary" color="primary" @click="fetchVersion">
            {{ $t('tab.setting.fetch') }}
          </v-btn>
        </v-col>

      </v-row>

      <v-dialog v-model="rebootDialog" max-width="500px">
        <v-card>
          <v-card-title class="text-h5">{{ $t('button.reboot') }}</v-card-title>
          <v-card-text>
            {{ $t('common.reboot_info') }}
          </v-card-text>

          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeReboot">{{ $t('button.cancel') }}</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="reboot">{{ $t('button.reboot') }}</v-btn>
          <v-spacer></v-spacer>
        </v-card>
      </v-dialog>

      <v-dialog v-model="newVersionDialog" max-width="500px">
        <v-card>
          <v-card-title class="text-h5">{{ $t('tab.setting.fetch_version') }}</v-card-title>
          <v-card-text>
            {{ newVersion ? `${$t('tab.setting.new_version')} (${github_lasted_version})` :
              $t('tab.setting.no_new_version')
            }}
          </v-card-text>

          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="newVersionDialog = false">{{ $t('button.cancel')
            }}</v-btn>
          <v-spacer></v-spacer>
        </v-card>
      </v-dialog>

    </UiParentCard>

  </v-menu>
</template>

<script setup>
import http from '@/utils/http.js';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import axios from 'axios';

const menu = ref(false);
const store = useAppStore();
const { webversion } = storeToRefs(store);
const rebootDialog = ref(false);
const newVersion = ref(false);
const newVersionDialog = ref(false);
const github_lasted_version = ref('');

async function reboot() {
  try {
    const response = await http.post('/reboot');
    if (response.status === 200 && response.data.code === 0) {
      console.log(`reboot success`);
    } else {
      console.log(`reboot error`);
    }
  } catch (error) {
    console.error('reboot error:', error);
  }
}

function closeReboot() {
  rebootDialog.value = false;
}

function makeSureReboot() {
  rebootDialog.value = true;
}

async function fetchVersion() {
  try {
    const owner = 'ThomasVon2021';
    const repo = 'blikvm';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    axios.get(apiUrl)
      .then(response => {
        github_lasted_version.value = response.data.tag_name;
        newVersionDialog.value = true;
        if (isNewVersion(webversion.value, github_lasted_version.value) === true) {
          newVersion.value = true;
        } else {
          newVersion.value = false;
        }
      })
      .catch(error => {
        console.error('Error fetching latest version:', error);
      });
  } catch (error) {
    console.error('fetchVersion error:', error);
  }
}

function isNewVersion(local, github) {
  // 提取版本号中的数字部分
  const versionToNumbers = (version) => {
    return version.replace(/[^\d.]/g, '').split('.').map(Number);
  };

  // 将版本号字符串转换为数字数组
  const localNumbers = versionToNumbers(local);
  const githubNumbers = versionToNumbers(github);

  // 比较版本号
  for (let i = 0; i < Math.max(localNumbers.length, githubNumbers.length); i++) {
    const localNum = localNumbers[i] || 0; // 如果数组越界，默认值为0
    const githubNum = githubNumbers[i] || 0;

    if (githubNum > localNum) {
      return true; // github 版本比 local 版本新
    } else if (localNum > githubNum) {
      return false; // local 版本比 github 版本新
    }
  }

  return false; // 版本号相同
}

</script>

<style scoped>
.align-center {
  display: flex;
  align-items: center;
}
</style>