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
        <v-icon class="toolbar-icon">mdi-folder-cog</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ $t('tab.msd.tip') }}</v-tooltip>
      </v-btn>
    </template>

    <UiParentCard :title="$t('tab.msd.title')" @mouseenter.stop @mousemove.stop>

      <div class="d-flex align-center">
        <v-label class="font-weight-medium align-center">{{ $t('label.status') }}: </v-label>
        <v-chip :color="imageCreateStateColor" class="ma-2">
          {{ imageCreateState === MsdImageCreateState.NotCreated ? $t('label.not_created') :
            imageCreateState === MsdImageCreateState.Created ? $t('label.created') : $t('label.none') }}
        </v-chip>
        <v-chip :color="imageConnectStateColor" class="ma-2">
          {{ imageConnectState === MsdImageConnectState.NotConnect ? $t('label.dis_connected') :
            imageConnectState === MsdImageConnectState.Connected ? $t('label.connected') : $t('label.none') }}
        </v-chip>
      </div>

      <Dashboard :uppy="uppy" :props="{
        metaFields: [{ id: 'name', name: 'Name', placeholder: 'File name' }],
        height: '300px',
        showProgressDetails: true,
        doneButtonHandler: handleDoneButtonClick
      }" />

      <v-toolbar flat>

        <v-toolbar-title
          :style="{ flex: '1 1 auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }">
          {{ $t('tab.msd.available_images') }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-title
          :style="{ color: getColor(100 - parseFloat(items.capacity)), flex: '1 1 auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }"
          class="custom-subtitle">
          {{ $t('common.available') }} {{ parseFloat(items.capacity) }}% ({{ convertBytesToGB(items.used) }}Gb) {{ $t('of') }}
          {{
            convertBytesToGB(items.size)
          }}Gb
        </v-toolbar-title>


        <v-btn @click="handleRefreshMSDListClick" append-icon="mdi-refresh" :ripple="true" color="primary">
          <v-tooltip activator="parent" location="bottom">{{ $t('tab.msd.refresh_list') }}</v-tooltip>
        </v-btn>

        <v-dialog v-model="dialogRemove" max-width="500px">
          <v-card>
            <v-card-title class="text-h5">{{ $t('tab.msd.remove_image_confirm') }}</v-card-title>
            <v-card-text v-if="selectedItem">
              {{ $t('tab.msd.image_name') }}: {{ selectedItem.name }}
            </v-card-text>

            <v-spacer></v-spacer>
            <v-btn color="blue-darken-1" variant="text" @click="closeRemove">{{ $t('button.cancel') }}</v-btn>
            <v-btn color="blue-darken-1" variant="text" @click="removeItemConfirm(selectedItem.path)">{{ $t('button.ok') }}</v-btn>
            <v-spacer></v-spacer>
          </v-card>
        </v-dialog>

      </v-toolbar>

      <v-data-table v-model="selected" height="215px" :loading="loading" :headers="headers" :items="items.files"
        item-value="name" fixed-header :multi-sort="true" no-data-text="No data available" return-object>

        <template v-slot:item="{ item }">
          <tr>
            <!-- TODO support download
            <td>
              <a :href="encodeURIComponent(item.path)" :download="encodeURIComponent(item.name)">{{ item.name }}</a>
            </td>
            -->
            <td>{{ item.name }}</td>
            <td>{{ convertBytesToMiB(item.imageSize) }} MiB</td>
            <td>{{ item.date }}</td>
            <td>
              <!-- Use a unique name for each v-switch using the item.name -->
              <v-switch v-model="switches[item.name]" true-value="yes" false-value="no" inset hide-details
                color="primary" @update:modelValue="!uploading && handleSwitch(item)" :disabled="uploading" />
            </td>
            <td>
              <v-btn @click="!uploading && openRemoveDialog(item)" :disabled="uploading" append-icon="mdi-delete"
                size="small" class="align-center" color="primary" :ripple="true">
                <v-tooltip activator="parent" location="bottom">{{ $t('tab.msd.remove_image_tip') }}</v-tooltip>
              </v-btn>
            </td>
          </tr>
        </template>
      </v-data-table>

      <div class="d-flex ga-4 align-center flex-row">
        <v-label class="text-subtitlte-1">{{ $t('tab.msd.make_msd_size') }}</v-label>
        <v-slider class="flex-grow-1 mx-3" v-model="actualMSDImageSize" min="1" :max="maxMSDImageSize" color="primary"
          step="1" hide-details>
          <template v-slot:append>
            <v-text-field variant="plain" v-model="actualMSDImageSize"></v-text-field>
          </template>
        </v-slider>
      </div>

      <v-progress-linear :indeterminate="makeMSDImageProgress === 0 && makeMSDImageFlag"
        :model-value="makeMSDImageProgress > 0 ? makeMSDImageProgress : null" buffer-value="100"
        :active="makeMSDImageFlag" height="6" color="primary" rounded></v-progress-linear>

      <v-spacer></v-spacer>

      <div class="grid-container">
        <v-btn key="primary" color="primary" @click=makeMSDDrive()
          :disabled="imageCreateState === MsdImageCreateState.Created || makeMSDImageFlag">{{ $t('tab.msd.make_usb_drive') }}</v-btn>
        <v-dialog v-model="availableImage">
          <v-card>
            <v-card-text>
              {{ imageMakeResultText }}
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" block @click="availableImage = false">{{ $t('button.close') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-btn key="primary" color="primary" @click=deleteMSDImage() :disabled="imageCreateState !== MsdImageCreateState.Created">{{ $t('tab.msd.delete_usb_drive') }}</v-btn>
        <v-dialog v-model="imageRemoveDialog">
          <v-card>
            <v-card-text>
              {{ imageRemoveResultText }}
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" block @click="imageRemoveDialog = false">{{ $t('button.close') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-btn key="primary" color="primary" @click="connectMSDImage('true')" :disabled="imageCreateState !== MsdImageCreateState.Created || imageConnectState === MsdImageConnectState.Connected"
        > {{ $t('tab.msd.connect_to_host') }} </v-btn>
        <v-btn key="primary" color="primary" @click="connectMSDImage('false')" :disabled="imageCreateState !== MsdImageCreateState.Created || imageConnectState === MsdImageConnectState.NotConnect" 
        >{{ $t('tab.msd.abort') }}</v-btn>
        <v-dialog v-model="imageConnectDialog">
          <v-card>
            <v-card-text>
              {{ imageConnectResultText }}
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" block @click="imageConnectDialog = false">{{ $t('button.close') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>

    </UiParentCard>

  </v-menu>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import http from '@/utils/http.js';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { Dashboard } from '@uppy/vue';
import Config from '@/config.js';
import { useAppStore } from '@/stores/stores';

const menu = ref(false);
const items = ref([]);
const uploading = ref(false);
const loading = ref(false);
const switches = ref([]);
const dialogResize = ref(false);
const dialogRemove = ref(false);
const selectedItem = ref(null);
const selected = ref([]);
const availableImage = ref(false);
const sliders = ref([]);
const headers = ref([
  {
    title: 'Image name',
    align: 'start',
    sortable: true,
    key: 'name',
  },
  { title: 'Image size', align: 'start', sortable: true, key: 'imageSize' },
  { title: 'Image last modified', align: 'start', sortable: true, key: 'date' },
  { title: 'Available', align: 'start', sortable: false },
  { title: 'Remove', align: 'start', sortable: false }
])
const UploadMSDImageState = {
  None: 0,
  UPloadToNetworkBuff: 1,
  UPloadToKVM: 2
};
const MsdImageCreateState = {
  None: 'none',
  NotCreated: 'not_created',
  Created: 'created'
};
const MsdImageConnectState = {
  None: 'none',
  NotConnect: 'not_connected',
  Connected: 'connected'
};

//make
const maxMSDImageSize = ref(5);
const actualMSDImageSize = ref(5);
const makeMSDImageFlag = ref(false);
const makeMSDImageProgress = ref(0);
const imageMakeResultText = ref('');

//state
const imageCreateStateColor = ref('error');
const imageConnectStateColor = ref('error');
const imageCreateStateText = ref('none');
const imageConnectStateText = ref('none');
const imageCreateState = ref(MsdImageCreateState.None);
const imageConnectState = ref(MsdImageConnectState.None);


//remove
const imageRemoveDialog = ref(false);
const imageRemoveResultText = ref('');
//connect
const imageConnectDialog = ref(false);
const imageConnectResultText = ref('');
const store = useAppStore();
const uppy = ref(null);

function handleDoneButtonClick() {
  uppy.value.clear();
}

const makeMSDDrive = async () => {
  let progressInterval;
  const selectedItems = [];
  for (const itemName in switches.value) {
    if (switches.value[itemName] === 'yes') {
      selectedItems.push(itemName);
    }
  }
  if (selectedItems.length > 0) {
    try {
      const requestBody = {
        type: "ventoy",
        images: selectedItems,
        name: "ventoy",
        size: actualMSDImageSize.value
      };

      progressInterval = setInterval(async () => {
        try {
          const progressResponse = await http.post('/msd/create/progress');
          if (progressResponse.status === 200) {
            const progressData = progressResponse.data;
            makeMSDImageProgress.value = progressData.data;
            console.log('progressResponse.data:', progressResponse.data, ' make image progress:', makeMSDImageProgress.value);
          } else {
            console.error('Failed to fetch make image progress:', progressResponse);
          }
        } catch (error) {
          console.error('Error fetching make image progress:', error);
        }
      }, 1000); // 每隔1秒请求一次进度
      makeMSDImageFlag.value = true;
      const response = await http.post('/msd/create', requestBody);

      if (response.status === 200) {
        console.log('MSD created successfully:', response.data);
      } else {
        console.error('Failed to create MSD:', response);
      }
      makeMSDImageProgress.value = 0;
      makeMSDImageFlag.value = false;
      clearInterval(progressInterval);
      availableImage.value = true;
      imageMakeResultText.value = response.data.msg;
      getMSDState();
    } catch (error) {
      makeMSDImageProgress.value = 0;
      makeMSDImageFlag.value = false;
      clearInterval(progressInterval);
      console.error('Error creating MSD:', error);
    }
  } else {
    console.log("No image selected");
    availableImage.value = true;
    imageMakeResultText.value = 'No image selected';
    return;
  }
};

const getColor = (value) => {
  if (value < 10) {
    return 'red';
  } else if (value < 25) {
    return 'orange';
  }
};

const convertBytesToMiB = (bytes) => {
  const mebibytes = bytes / (1024 * 1024); // 1 MiB = 1024 * 1024 bytes
  return mebibytes.toFixed(2); // Adjust the decimal places as needed
};

const convertBytesToGB = (bytes) => {
  const mebibytes = bytes / (1024 * 1024 * 1024); // 1 Gb = 1024 * 1024 * 1024 bytes
  return mebibytes.toFixed(2); // Adjust the decimal places as needed
};

const openRemoveDialog = (item) => {
  dialogRemove.value = true;
  selectedItem.value = item; // Select the item to trigger the watcher
};

const handleSwitch = (item) => {
  console.log(item);
}

const switchImageCreateState = (state) => {
  console.log('create state:', state);
  switch (state) {
    case MsdImageCreateState.NotCreated:
      imageCreateState.value = MsdImageCreateState.NotCreated;
      imageCreateStateColor.value = 'primary';
      imageCreateStateText.value = 'Not created'
      return;
    case MsdImageCreateState.Created:
      imageCreateState.value = MsdImageCreateState.Created;
      imageCreateStateColor.value = 'success';
      imageCreateStateText.value = 'Created'
      return;
    default:
      imageCreateState.value = MsdImageCreateState.Created;
      imageCreateStateColor.value = 'error';
      imageCreateStateText.value = 'None'
      return;
  }
};

const switchImageConnectState = (state) => {
  console.log('connect state:', state);
  switch (state) {
    case MsdImageConnectState.NotConnect:
      imageConnectState.value = MsdImageConnectState.NotConnect;
      imageConnectStateColor.value = 'primary';
      imageConnectStateText.value = 'Disconnected'
      return;
    case MsdImageConnectState.Connected:
      imageConnectState.value = MsdImageConnectState.Connected;
      imageConnectStateColor.value = 'success';
      imageConnectStateText.value = 'Connected'
      return;
    default:
      imageConnectState.value = MsdImageConnectState.Connected;
      imageConnectStateColor.value = 'error';
      imageConnectStateText.value = 'None'
      return;
  }
};

const removeItemConfirm = async (item) => {

  const removeImage = async (item) => {
    try {
      const encodedPath = encodeURIComponent(item);
      const url = `/msd/delete?image=${encodedPath}`;

      const response = await http.post(url);

      if (response.data.code === 0) {
        // success
      } else {
        console.error('Error removing partition:', response);
      }
      await handleRefreshMSDListClick();
    } catch (error) {
      console.error(error);
    }
  };

  removeImage(item);

  closeRemove();
}

const closeRemove = () => {
  selectedItem.value = null;
  dialogRemove.value = false;
}

const getMSDList = async () => {

  try {
    const response = await http.post(`/msd/images`);
    if (response.status === 200 && response.data.code === 0) {
      console.log("/msd/images:", response.data);
      items.value = response.data.data;
      maxMSDImageSize.value = Math.floor(convertBytesToGB(items.value.size - items.value.used));
      console.log("items:", items.value, "maxMSDImageSize:", maxMSDImageSize.value)
      // Function to initialize switches array based on the number of rows
      const initializeSwitches = (rowCount) => {
        return Array(rowCount).fill(false); // Assuming the default value is false
      };

      // Populate the switches array based on the number of rows
      switches.value = initializeSwitches(items.value.length);
    } else {
      console.log("/msd/images post error");
    }

  } catch (error) {
    console.error('Error during atx button trigger:', error);
    const messageType = 'Error';
    const icon = 'mdi-alert';
    const target = '';
    const message = `Error getting MSD image list ${error}`;
    const text = '???';

    createAndAddNotification('uuid', messageType, icon, message, target, text);
    throw error;
  }
};

const handleRefreshMSDListClick = async () => {
  loading.value = true;
  try {
    await getMSDList();
    getMSDState();
    // Perform other actions upon success
  } catch (error) {
    // Handle errors
    console.error('Error refreshing MSD list:', error);
  } finally {
    loading.value = false;
  }
};

const getMSDState = async () => {
  try {
    const response = await http.post('/msd/state');
    if (response.status === 200 && response.data.code === 0) {
      switchImageCreateState(response.data.data.msd_img_created);
      switchImageConnectState(response.data.data.msd_status);
      store.tusPort = response.data.data.tusPort;
    } else {
      console.error('getMSDState error:', response.data);
    }

  } catch (error) {
    console.error('getMSDState:', error);
  }
};

const deleteMSDImage = async () => {
  try {
    const response = await http.post('/msd/remove');
    imageRemoveDialog.value = true;
    imageRemoveResultText.value = response.data.msg;
    getMSDState();
  } catch (error) {
    console.error('deleteMSDImage:', error);
  }
};

const connectMSDImage = async (action) => {
  try {
    const response = await http.post(`/msd/connect?action=${action}`);
    imageConnectDialog.value = true;
    imageConnectResultText.value = response.data.msg;
    getMSDState();
  } catch (error) {
    console.error('connect:', error);
  }
};

onMounted(async () => {
  // Initialize sliders array
  sliders.value = items.value.map(() => ref(5));

  await getMSDList();
  await getMSDState();
  uppy.value = new Uppy({ id: 'uppy1', autoProceed: false, debug: true })
    .use(Tus, { endpoint: `${Config.http_protocol}//${Config.host_ip}${Config.host_port}/tus`, chunkSize: 5 * 1024 * 1024, })
    .on('upload-success', (file, response) => {
      handleRefreshMSDListClick();
    });
});


</script>

<style src="@uppy/core/dist/style.css"></style>
<style src="@uppy/dashboard/dist/style.css"></style>
<style src="@uppy/drag-drop/dist/style.css"></style>
<style src="@uppy/progress-bar/dist/style.css"></style>

<style scoped>
.align-center {
  display: flex;
  align-items: center;
}

.custom-subtitle {
  color: 'Roboto';
  font-size: 14px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  /* 可选，添加按钮之间的间距 */
}
</style>