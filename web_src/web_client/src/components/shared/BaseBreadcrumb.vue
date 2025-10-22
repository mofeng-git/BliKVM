
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
<script setup lang="ts">
import { ChevronRightIcon } from 'vue-tabler-icons';

type Breadcrumb = {
  title: string;
  disabled: boolean;
  href: string;
};

const props = defineProps({
  title: String,
  breadcrumbs: Array as () => Breadcrumb[],
  icon: String
});
</script>

// ===============================|| Theme Breadcrumb ||=============================== //
<template>
  <v-row class="page-breadcrumb mb-1 mt-1">
    <v-col cols="12" md="12">
      <v-card variant="flat" class="px-4 py-3">
        <v-row no-gutters class="align-center">
          <v-col md="5">
            <h3 class="text-h3">{{ props.title }}</h3>
          </v-col>

          <v-col md="7" sm="12" cols="12">
            <v-breadcrumbs :items="props.breadcrumbs" class="text-h5 justify-md-end pa-1">
              <template v-slot:divider>
                <div class="d-flex align-center">
                  <ChevronRightIcon size="17" />
                </div>
              </template>
              <template v-slot:prepend>
                <v-icon size="small" icon="mdi-home" class="text-secondary mr-2"></v-icon>
                <div class="d-flex align-center">
                  <ChevronRightIcon size="17" />
                </div>
              </template>
            </v-breadcrumbs>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss">
.page-breadcrumb {
  .v-toolbar {
    background: transparent;
  }
}
</style>
