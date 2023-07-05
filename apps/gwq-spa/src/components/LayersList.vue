<template>
  <div class="q-pa-md">
    <!-- list of A group layers -->
    <div v-for="layer in layersAll" :key="layer.id" tag="label">
      <div v-if="layer.group === 'a'">
        <!-- layer -->
        <q-item v-ripple>
          <!-- layer checkbox -->
          <q-item-section avatar top>
            <q-checkbox
              v-model="layersSelected.layersVector"
              :val="layer"
              color="primary"
            />
          </q-item-section>
          <!-- layer title & description -->
          <q-item-section>
            <q-item-label class="text-black">{{
              translate(layer.title)
            }}</q-item-label>
            <q-item-label v-if="layer.description !== ''" caption>{{
              translate(layer.description)
            }}</q-item-label>
            <div
              v-if="checkIfLayerSelected(layersSelectedAll, layer)"
              class="column q-gutter-sm q-pt-sm"
            >
              <!-- layer attributes -->
              <div>{{ $t("layer_attributes") }}</div>
            </div>
          </q-item-section>
        </q-item>
      </div>
    </div>

    <!-- list of B group layers -->
    <div v-for="layer in layersAll" :key="layer.id" tag="label">
      <div v-if="layer.group === 'b'">
        <!-- layer -->
        <q-item v-ripple>
          <q-item-section avatar top>
            <q-checkbox
              v-model="layersSelected.layersWMS"
              :val="layer"
              color="primary"
            />
          </q-item-section>
          <!-- layer title & description -->
          <q-item-section>
            <q-item-label class="text-black">{{
              translate(layer.title)
            }}</q-item-label>
            <q-item-label v-if="layer.description !== ''" caption>{{
              translate(layer.description)
            }}</q-item-label>
            <div
              v-if="checkIfLayerSelected(layersSelectedAll, layer)"
              class="column q-gutter-sm q-pt-sm"
            >
              <!-- layer attributes -->
              <div>{{ $t("layer_attributes") }}</div>
            </div>
          </q-item-section>
        </q-item>
      </div>
    </div>

    <!-- statistics -->
    <div>
      <q-list>
        <q-item to="/" exact>
          <q-item-section avatar>
            <q-icon color="primary" name="location_on" />
          </q-item-section>
          <q-item-section>Map</q-item-section>
        </q-item>
        <q-item v-if="currentRouterPath === '/'">
          <div class="q-gutter-y-md">
            <!-- toogle edit mode -->
            <div>
              <q-toggle
                dense
                v-model="store.mapEditMode"
                @update:model-value="toogleEditMode"
                label="Edit mode"
              />
            </div>
            <!-- legend -->
            <div>
              <LegendChoropleth />
            </div>
            <!-- list of C group layers -->
            <q-list>
              <template v-for="layer in layersAll" :key="layer.id">
                <!-- layer -->
                <q-item v-if="layer.group === 'c'" v-ripple>
                  <q-item-section avatar top>
                    <q-radio
                      v-model="layerBaseSelected"
                      :val="layer.id"
                      color="primary"
                    />
                  </q-item-section>
                  <q-item-section top>
                    <q-item-label class="text-black">{{
                      translate(layer.title)
                    }}</q-item-label>
                    <q-item-label v-if="layer.description !== ''" caption>{{
                      translate(layer.description)
                    }}</q-item-label>
                    <div
                      v-if="checkIfLayerSelected(layersSelectedAll, layer)"
                      class="column q-gutter-sm q-pt-sm"
                    >
                      <div>{{ $t("layer_attributes") }}</div>
                    </div>
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
          </div>
        </q-item>
        <q-item to="/statistics">
          <q-item-section avatar>
            <q-icon color="primary" name="analytics" />
          </q-item-section>
          <q-item-section>Statistics</q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { gisStore } from "stores/gisStore";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";

import filter from "lodash.filter";
import cloneDeep from "lodash.clonedeep";

// components
import LegendChoropleth from "src/components/LegendChoropleth.vue";

const store = gisStore(); // store
const { t, locale } = useI18n({ useScope: "global" }); // i18
const router = useRouter();
const route = useRoute();

// data
const layersAll = ref(store.staticLayers);
const layerBaseSelected = ref("argistopomap");
const layersSelected = ref({
  layersVector: [],
  layersWMS: [],
  layersBase: [],
  layerSearch: [],
});

// methods
function addDefaultLayer(id) {
  let layers = filter(layersAll.value, { id: id });
  layersSelected.value.layersBase = [];
  layersSelected.value.layersBase.push(layers[0]);
}
function addAllSelectedLayersToVuex() {
  store.updateLayersSelected(layersSelectedAll.value);
}
function checkIfLayerSelected(layersArray, layerSelected) {
  const layerSelectedInArray = filter(layersArray, {
    id: layerSelected.id,
  });
  if (layerSelectedInArray.length > 0) {
    return true;
  } else {
    return false;
  }
}
function translate(property) {
  if (locale.value === "en-US") {
    return property.en;
  } else {
    return property.ee;
  }
}
function toogleEditMode(value) {
  store.mapEditMode = value;
}

// computed
const layersSelectedAll = computed(() => {
  let layers = [];
  Object.entries(layersSelected.value).forEach((layersArray) => {
    const [key, value] = layersArray;
    layers.push(...value);
  });
  return cloneDeep(layers);
});
const layersSelectedAllIDs = computed(() => {
  const IDs = layersSelectedAll.value.map((layer) => layer.id);
  return IDs.join();
});
const currentRouterPath = computed(() => {
  return route.path;
});

// watchers
watch(layersSelectedAllIDs, () => {
  addAllSelectedLayersToVuex();
});
watch(layerBaseSelected, () => {
  addDefaultLayer(layerBaseSelected.value);
});
watch(layerBaseSelected, () => {
  store.drawnPolygon = null;
});

// mounted
onMounted(() => {
  addDefaultLayer(layerBaseSelected.value);
});
</script>
