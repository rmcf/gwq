<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-grey-1 text-grey-8">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> GWQ web-GIS </q-toolbar-title>

        <!-- <div>
          <q-select
            v-model="locale"
            :options="localeOptions"
            dense
            borderless
            emit-value
            map-options
            options-dense
            style="min-width: 120px"
          />
        </div> -->
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <!-- layers list -->
      <LayersList />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// components
import LayersList from "components/LayersList.vue";

const { t, locale } = useI18n({ useScope: "global" });

// data
const leftDrawerOpen = ref(false);
const localeOptions = ref([
  { value: "en-US", label: "English" },
  { value: "ee", label: "Estonian" },
]);

// methods
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
