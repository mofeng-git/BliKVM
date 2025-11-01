<template>
  <v-card class="custom-card-disabled__TODO mx-auto wrap-text" width="auto" @click.stop>
    <v-sheet elevation="5" class="inner-sheet pa-4 mx-auto" width="100%">
      <v-sheet class="scrollable-container pa-4 text-center mx-auto" max-width="800" width="100%">
        <v-form ref="form">
          <v-row dense no-gutters class="d-flex justify-start align-center">
            <v-col cols="auto" class="d-flex align-center">
              <TextField v-model="isoUrl" :label="$t('msd.urlSource')" style="width: 250px" />
            </v-col>
            <v-col>
              <!--       :disabled="!url || url.length === 0"-->
              <v-btn
                :loading="isLoading"
                :disabled="isLoading"
                color="#76FF03"
                variant="outlined"
                v-ripple
                @click="handleClick('mountStream')"
              >
                {{ $t('settings.msd.mount') }}
              </v-btn>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="1" class="d-flex justify-start"> Popular images </v-col>
          </v-row>
          <v-row dense no-gutters class="d-flex justify-start">
            <v-col>
              <v-list class="px-2" lines="two" variant="flat">
                <v-radio-group v-model="selectedItem">
                  <template v-for="(item, i) in virtualMedia.items" :key="i">
                    <Divider v-if="i !== 0" />

                    <v-list-item :subtitle="item.title">
                      <template #prepend>
                        <v-radio :value="item" color="#76FF03" />
                      </template>

                      <template #title>
                        <span class="d-flex justify-start text-subtitle-2 font-weight-bold">
                          <v-icon>{{ item.icon }}</v-icon
                          >&nbsp;
                          {{ item.title }}
                        </span>
                      </template>

                      <template #subtitle>
                        <span v-if="item.subtitle" class="text-caption">
                          {{ item.subtitle }}
                          <br />
                          {{ item.url }}
                        </span>
                        <span v-else class="d-flex justify-start text-caption">
                          {{ item.url }}
                        </span>
                      </template>
                    </v-list-item>
                  </template>
                </v-radio-group>
              </v-list>
            </v-col>
          </v-row>
        </v-form>
      </v-sheet>
    </v-sheet>
  </v-card>
</template>

<script setup>
  const isoUrl = ref(null);
  const virtualMedia = ref([]); // Initialize as an array
  const selectedItem = ref(null);

  const loadVirtualMedia = async () => {
    try {
      const response = await fetch('/data/virtualMedia.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      virtualMedia.value = data; // Assign directly as an array
      console.log(virtualMedia.value);
    } catch (error) {
      console.error('Failed to load virtual media Urls:', error);
    }
  };

  const actions = {
    mount: () => console.log(isoUrl.value),
  };

  const handleClick = (value) => {
    if (!isoUrl.value) {
      console.warn('URL is empty.');
      return;
    }

    if (value === 'mountStream') {
      console.log('Mounting:', isoUrl.value);
    } else {
      console.warn('Unknown action:', value);
    }
  };

  // Watch for radio selection and update the text field
  watch(selectedItem, (newValue) => {
    if (newValue) {
      isoUrl.value = newValue.url;
    }
  });

  onMounted(async () => {
    await loadVirtualMedia();
  });
</script>
