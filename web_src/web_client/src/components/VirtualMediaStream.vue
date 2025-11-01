<template>
  <v-card class="custom-card-disabled__TODO mx-auto wrap-text" width="auto" @click.stop>
    <v-sheet elevation="5" class="inner-sheet pa-4 mx-auto" width="100%">
      <v-sheet class="scrollable-container pa-4 text-center mx-auto" max-width="800" width="100%">
        <v-form ref="form">
          <v-row dense no-gutters class="d-flex justify-start align-center">
            <v-col cols="auto" class="d-flex align-center">
              <TextField
                v-model="streamUrl"
                :label="$t('msd.streamSourceUrl')"
                style="width: 250px"
              />
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
                Mount
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-sheet>
    </v-sheet>
  </v-card>
</template>

<script setup>
  import { ref } from 'vue';
  import { useDevice } from '@/composables/useDevice';

  const { device } = useDevice();

  const streamUrl = ref('https://');
  const isLoading = ref(false);

  const startStream = async () => {
    console.log('Starting ISO stream...');
    isLoading.value = true;

    try {
      await streamISOToTarget(isoUrl.value, device.value.baseUrl);
      console.log('ISO stream successfully started.');
    } catch (error) {
      console.error('Error streaming ISO:', error);
      const title = 'Stream Status: Failed';
      const message = `An issue occurred while streaming. Please try again later.`;
      sendAlert('error', title, message);
    } finally {
      isLoading.value = false;
    }
  };

  const streamISOToTarget = async (isoUrl, targetIp) => {
    try {
      // Fetch the ISO file from the provided URL
      const response = await fetch(isoUrl);

      if (!response.ok) {
        console.error('Failed to fetch ISO from URL.');
        throw new Error('Failed to fetch ISO');
      }

      console.log(`Streaming ISO from ${isoUrl} to KVM: ${targetIp}`);

      // Create the stream request to the target server
      const req = await fetch(`http://${targetIp}/receive-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: response.body, // Directly stream the response body to the target server
      });

      if (!req.ok) {
        console.error('Failed to send stream to target.');
        throw new Error('Failed to send stream');
      }

      console.log('ISO stream complete.');
    } catch (error) {
      console.error('Error fetching or streaming ISO:', error);
      throw error;
    }
  };

  const sendAlert = (type, title, message) => {
    // Add your alert implementation here, like toast or modal
    console.log(`${type}: ${title} - ${message}`);
  };
</script>
