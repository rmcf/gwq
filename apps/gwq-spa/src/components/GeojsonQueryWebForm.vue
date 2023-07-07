<template>
  <!-- stepper -->
  <div class="q-pl-md q-pr-md q-pb-md">
    <q-stepper v-model="step" ref="stepper" color="primary" animated>
      <q-step :name="1" title="Query" icon="settings" :done="step > 1">
        <div class="q-gutter-y-lg">
          <div class="text-center">
            Area:
            <q-badge align="middle" color="primary">
              {{ polygonAreaFormated }}
            </q-badge>
            sq.km
          </div>
          <div v-if="sitesQuantity > 0" class="text-center">
            Sites quantity:
            <q-badge align="middle" color="primary">
              {{ numberFormatted(sitesQuantity) }}
            </q-badge>
          </div>
          <div class="text-center">
            <!-- button -->
            <div class="q-gutter-x-md">
              <q-btn
                v-if="tempFilesFolder"
                :href="getTempFilesPath(tempFilesFolder, 'geojson')"
                label="geoJSON"
                icon="file_download"
                outline
              />
              <q-btn
                v-if="tempFilesFolder"
                :href="getTempFilesPath(tempFilesFolder, 'csv')"
                label="CSV"
                icon="file_download"
                outline
              />
            </div>
            <!-- server responses -->
            <div v-if="serverText !== ''" class="q-pa-lg">
              {{ serverText }}
            </div>
            <div v-if="serverBody !== ''" class="q-pa-sm">
              {{ serverBody }}
            </div>
            <!-- message -->
            <div v-if="responseMessage" class="text-red">
              {{ responseMessage }}
            </div>
          </div>
        </div>
      </q-step>

      <q-step
        :name="2"
        title="Analysis"
        icon="create_new_folder"
        :done="step > 2"
      >
        <div class="q-gutter-y-lg">
          <!-- sites quantity -->
          <div v-if="sitesQuantity > 0" class="text-center">
            Sites:
            <q-badge align="middle" color="primary">
              {{ numberFormatted(sitesQuantity) }}
            </q-badge>
          </div>
          <!-- hex quantity -->
          <div v-if="responseHexQuantity > 0" class="text-center">
            Hexagons:
            <q-badge align="middle" color="primary">
              {{ numberFormatted(responseHexQuantity) }}
            </q-badge>
          </div>

          <q-list bordered class="rounded-borders">
            <q-expansion-item
              expand-separator
              icon="layers"
              label="H3 available resolutions"
            >
              <q-card>
                <q-card-section>
                  <!-- table -->
                  <div>
                    <q-markup-table dense class="no-shadow">
                      <thead>
                        <tr>
                          <th class="text-left">Resolution</th>
                          <th class="text-right">Hexagons</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="level in hexQuantityFormatted"
                          :key="level.resolution"
                        >
                          <td
                            class="text-left"
                            :class="availablResStyle(level.quantity)"
                          >
                            {{ level.resolution }}
                          </td>
                          <td
                            class="text-right"
                            :class="availablResStyle(level.quantity)"
                          >
                            {{
                              Intl.NumberFormat("nb-NO").format(level.quantity)
                            }}
                          </td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-list>

          <!-- resolution -->
          <div>
            <q-select
              outlined
              v-model="resolution"
              :options="browserSafeResolutions"
              :disable="parametersLoading || parameterDateProgress"
              label="H3 resolutions"
            />
          </div>
          <!-- parameters -->
          <div>
            <q-select
              outlined
              v-model="parameter"
              :disable="parametersLoading || parameterDateProgress"
              :loading="parametersLoading || parameterDateProgress"
              :options="parameters"
              emit-value
              map-options
              label="Parameters"
            />
          </div>
          <!-- select dates -->
          <div
            v-if="
              parameter !== '' &&
              !parameterDateProgress &&
              parameterDateStart !== '' &&
              parameterDateEnd !== ''
            "
            class="row q-gutter-x-md"
          >
            <!-- start date -->
            <div class="col">
              <q-input v-model="parameterDateStart" label="Min Date" outlined>
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-date
                        v-model="parameterDateStart"
                        mask="YYYY-MM-DD"
                        minimal
                      >
                        <div class="row items-center justify-end">
                          <q-btn
                            v-close-popup
                            label="Close"
                            color="primary"
                            flat
                          />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <!-- end date -->
            <div class="col">
              <q-input v-model="parameterDateEnd" label="Max Date" outlined>
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-date
                        v-model="parameterDateEnd"
                        mask="YYYY-MM-DD"
                        minimal
                      >
                        <div class="row items-center justify-end">
                          <q-btn
                            v-close-popup
                            label="Close"
                            color="primary"
                            flat
                          />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>
          <!-- statistics -->
          <div v-if="statisticsTable.length > 0">
            <div>
              <q-markup-table dense class="no-shadow">
                <thead>
                  <tr>
                    <th class="text-left">Parameter</th>
                    <th class="text-left">Dataset</th>
                    <th class="text-left">Selection</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stat in statisticsTable" :key="stat.parameter">
                    <td class="text-left">
                      {{ stat.parameter }}
                    </td>
                    <td class="text-left">
                      {{ stat.datasetValue }}
                    </td>
                    <td class="text-left">
                      {{ stat.selectionValue }}
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
            </div>
          </div>
          <!-- message -->
          <div v-if="responseMessage" class="text-red">
            {{ responseMessage }}
          </div>
        </div>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation class="row justify-between">
          <q-btn
            v-if="step === 1"
            flat
            color="primary"
            @click="resetQueries()"
            label="New Selection"
            class="q-ml-sm"
          />
          <q-btn
            v-if="step > 1"
            flat
            color="primary"
            @click="$refs.stepper.previous()"
            label="Back"
            class="q-ml-sm"
          />
          <q-btn
            v-if="geoJsonFilePath === ''"
            @click="getSites(polygonFeature)"
            :loading="sitesLoading"
            color="primary"
            >Get sites <template v-slot:loading>Loading...</template></q-btn
          >
          <q-btn
            v-if="geoJsonFilePath !== '' && step === 1"
            @click="$refs.stepper.next()"
            color="primary"
            label="Next"
          />
          <q-btn
            v-if="step === 2"
            @click="
              getSitesHex(polygonFeature, parameterDateStart, parameterDateEnd)
            "
            :loading="sitesLoading"
            :disable="
              getHexButtonState ||
              parameterDateProgress ||
              parameterDateStart === ''
            "
            color="primary"
          >
            Get HEX
            <template v-slot:loading>Loading...</template>
          </q-btn>
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from "vue";

import { api } from "boot/axios";
import filter from "lodash.filter";

import turfarea from "@turf/area";
import { polygon } from "@turf/helpers";

import { useI18n } from "vue-i18n";
import { gisStore } from "stores/gisStore";

const { t, locale } = useI18n({ useScope: "global" });
const store = gisStore();

const parametersCodesNames = [
  { code: "BOD_obs", name: "Biochemical oxygen demand" },
  { code: "BOD5_obs", name: "Biochemical oxygen demand (BOD5)" },
  { code: "BOD7_obs", name: "Biochemical oxygen demand (BOD7)" },
  { code: "COD_obs", name: "Chemical oxygen demand" },
  { code: "CODCr_obs", name: "Chemical oxygen demand (Cr)" },
  { code: "CODMn_obs", name: "Chemical oxygen demand (Mn)" },
  { code: "DC_obs", name: "Total dissolved carbon" },
  { code: "DIC_obs", name: "Dissolved inorganic carbon" },
  { code: "DIN_obs", name: "Dissolved inorganic nitrogen" },
  { code: "DIP_obs", name: "Dissolved inorganic phosphorus" },
  { code: "DKN_obs", name: "Dissolved Kjeldahl nitrogen" },
  { code: "DO_obs", name: "Dissolved oxygen" },
  { code: "DOC_obs", name: "Dissolved organic carbon" },
  { code: "DON_obs", name: "Dissolved organic nitrogen" },
  { code: "DOP_obs", name: "Dissolved organic phosphorus" },
  { code: "DOSAT_obs", name: "Dissolved oxygen saturation" },
  { code: "NH4N_obs", name: "Ammonium nitrogen" },
  { code: "NO2N_obs", name: "Nitrite nitrogen" },
  { code: "NO3N_obs", name: "Nitrate nitrogen" },
  { code: "PC_obs", name: "Particulate carbon" },
  { code: "pH_obs", name: "pH" },
  { code: "PIC_obs", name: "Particulate inorganic carbon" },
  { code: "PN_obs", name: "Particulate nitrogen" },
  { code: "POC_obs", name: "Particulate organic carbon" },
  { code: "PON_obs", name: "Particulate organic nitrogen" },
  { code: "POP_obs", name: "Particulate organic phosphorus" },
  { code: "TAN_obs", name: "Total ammonia nitrogen" },
  { code: "TC_obs", name: "Total carbon" },
  { code: "TDN_obs", name: "Total dissolved nitrogen" },
  { code: "TDP_obs", name: "Total dissolved phosphorus" },
  { code: "TEMP_obs", name: "Water temperature" },
  { code: "TIC_obs", name: "Total inorganic carbon" },
  { code: "TIN_obs", name: "Total inorganic nitrogen" },
  { code: "TIP_obs", name: "Total inorganic phosphorus" },
  { code: "TKN_obs", name: "Total Kjeldahl nitrogen" },
  { code: "TN_obs", name: "Total nitrogen" },
  { code: "TOC_obs", name: "Total organic carbon" },
  { code: "TON_obs", name: "Total organic nitrogen" },
  { code: "TOP_obs", name: "Total organic phosphorus" },
  { code: "TP_obs", name: "Total phosphorus" },
  { code: "TPP_obs", name: "Total particulate phosphorus" },
  { code: "TSS_obs", name: "Total suspended solids" },
];

// data
const parameter = ref("");
const parameters = reactive([]);
const parametersLoading = ref(false);
const resolution = ref(10);
const hexBrowserSafeQuantity = 1000000;
const serverText = ref("");
const serverBody = ref("");
const parameterDateStart = ref("");
const parameterDateEnd = ref("");
const parameterDateProgress = ref(false);

const sitesLoading = ref(false);
const geoJsonFilePath = ref("");
const csvFilePath = ref("");
const tempFilesFolder = ref(null);
const sitesQuantity = ref(0);
const responseHexQuantity = ref(0);
const responseMessage = ref(null);
const responseSiteStatistics = ref(null);
const responseSiteStatisticsSelection = ref(null);

const step = ref(1);

// props
const props = defineProps({
  polygonSelected: Object,
});

// events
const emit = defineEmits(["resetSearch"]);

// methods
function availablResStyle(value) {
  if (value > 1 && value < hexBrowserSafeQuantity) {
    return "bg-green-2";
  } else {
    return "none";
  }
}

function numberFormatted(value) {
  return Intl.NumberFormat("nb-NO").format(value);
}

function getTempFilesPath(folder, fileExtension) {
  // return `${process.env.serverUrl}/data/sites/${folder}/${fileExtension}`;
  // return `https://maps.landscape-geoinformatics.org/gwq-spa/#/data/sites/${folder}/${fileExtension}`;
  return `https://maps.landscape-geoinformatics.org/data/sites/${folder}/${fileExtension}`;
  
}

function resetQueries() {
  store.choroplethLegend = [];
  store.removeDynamicLayers();
  emit("resetSearch", null);
  store.changeMapEditMode();
}

async function getListOfTables() {
  parametersLoading.value = true;
  parameter.value = "";
  parameters.length = 0;
  try {
    const response = await api({
      method: "get",
      url: "/data/tables",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const tablesOrigin = response.data.tables;
    const tablesDictionary = tablesOrigin.map((tableName) => {
      const paramName = filter(parametersCodesNames, { code: tableName })[0]
        .name;
      return { label: paramName, value: tableName };
    });
    parameters.push(...tablesDictionary);
    parametersLoading.value = false;
  } catch (error) {
    console.log(error);
    parameter.value = "Database error";
    parametersLoading.value = false;
  }
}

async function getSites(polygon) {
  sitesLoading.value = true;
  responseMessage.value = null;
  try {
    const response = await api({
      method: "post",
      url: "/data/sites",
      data: polygon,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.geojson.features.length > 0) {
      const dynamicLayer = {
        id: "sites",
        title: { en: "Sites", ee: "Sites" },
        description: { en: "selected sites", ee: "selected sites" },
        attributions: "",
        features: response.data.geojson.features,
        featurestype: "points",
        type: "vector_dynamic",
        group: "a",
        format: "geojson",
        projection: "EPSG:4326",
      };
      sitesQuantity.value = response.data.geojson.features.length;
      store.removeDynamicLayers();
      const layers = store.layersSelected.map((layer) => {
        return layer;
      });
      layers.push(dynamicLayer);
      store.updateLayersSelected(layers);
      geoJsonFilePath.value = response.data.geoJsonFilePath;
      csvFilePath.value = response.data.csvFilePath;
      tempFilesFolder.value = response.data.filesFolder;
    } else {
      responseMessage.value = "No sites found";
    }
    sitesLoading.value = false;
  } catch (error) {
    console.log(error);
    sitesLoading.value = false;
  }
}

async function getSitesHex(polygon, dateStart, dateEnd) {
  responseMessage.value = null;
  sitesLoading.value = true;
  const queryData = {
    parameter: parameter.value,
    resolution: resolution.value,
    geojson: polygon,
    dateStart: dateStart,
    dateEnd: dateEnd,
  };
  try {
    const response = await api({
      method: "post",
      url: "/data/sites-hex-geojson",
      data: queryData,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.geojson) {
      const responseFeatures = response.data.geojson.features;
      const dynamicLayer = {
        id: "sites",
        title: { en: "Sites", ee: "Sites" },
        description: { en: "selected sites", ee: "selected sites" },
        attributions: "",
        features: response.data.geojson,
        legend: response.data.legend,
        statistics: response.data.statistics.value,
        featurestype: "polygon",
        type: "vector_dynamic",
        group: "a",
        format: "geojson",
        projection: "EPSG:4326",
      };
      responseHexQuantity.value = responseFeatures.length;
      store.removeDynamicLayers();
      const layers = store.layersSelected.map((layer) => {
        return layer;
      });
      layers.push(dynamicLayer);
      store.updateLayersSelected(layers);
    }
    responseMessage.value = response.data.message;
    responseSiteStatisticsSelection.value = response.data.statistics[0];
    sitesLoading.value = false;
  } catch (error) {
    console.log(error);
    sitesLoading.value = false;
    responseMessage.value = "Unexpected error";
  }
}

async function getParameterDates(polygon) {
  parameterDateProgress.value = true;
  responseMessage.value = null;
  const queryData = {
    parameter: parameter.value,
    resolution: resolution.value,
    geojson: polygon,
  };
  try {
    const response = await api({
      method: "post",
      url: "/data/sites-hex-geojson",
      data: queryData,
      headers: {
        "Content-Type": "application/json",
      },
    });
    parameterDateProgress.value = false;
    return response.data.statistics;
  } catch (error) {
    console.log(error);
    parameterDateProgress.value = false;
    return null;
  }
}

// computed
const polygonFeature = computed(() => {
  return props.polygonSelected;
});

const polygonArea = computed(() => {
  const turfPolygon = polygon(
    polygonFeature.value.features[0].geometry.coordinates
  );
  const area = turfarea(turfPolygon) / 1000000;
  return area;
});

const polygonAreaFormated = computed(() => {
  const areaFixed = polygonArea.value.toFixed(2);
  const areaFormatted = Intl.NumberFormat("nb-NO").format(areaFixed);
  return areaFormatted;
});

const hexQuantity = computed(() => {
  const hexQuant = store.h3levels.map((level) => {
    const quantityCalculated = polygonArea.value / level.hexArea;
    return {
      resolution: level.level,
      quantity: quantityCalculated,
    };
  });
  const hexQuantFiltered = filter(hexQuant, function (level) {
    return level.quantity.toFixed() > 0;
  });
  return hexQuantFiltered;
});

const browserSafeResolutions = computed(() => {
  const available = filter(hexQuantity.value, function (level) {
    return (
      level.quantity.toFixed() > 1 &&
      level.quantity.toFixed() < hexBrowserSafeQuantity
    );
  });
  const availableFormatted = available.map((level) => {
    return level.resolution.toFixed();
  });
  return availableFormatted;
});

const hexQuantityFormatted = computed(() => {
  const hexQuantFilteredFormatted = hexQuantity.value.map((level) => {
    return {
      resolution: level.resolution,
      quantity: level.quantity.toFixed(),
    };
  });
  return hexQuantFilteredFormatted;
});

const getHexButtonState = computed(() => {
  if (parameter.value !== "" && !parametersLoading.value) {
    return false;
  } else {
    return true;
  }
});

const statisticsTable = computed(() => {
  const stat = [];
  if (responseSiteStatistics.value) {
    Object.entries(responseSiteStatistics.value).forEach(([key, value]) => {
      if (responseSiteStatisticsSelection.value) {
        const statValueS = {
          parameter: key,
          datasetValue: value,
          selectionValue: responseSiteStatisticsSelection.value[key],
        };
        stat.push(statValueS);
      } else {
        const statValue = {
          parameter: key,
          datasetValue: value,
          selectionValue: value,
        };
        stat.push(statValue);
      }
    });
  }
  return stat;
});

// watchers
watch(parameter, async (currentValue, oldValue) => {
  responseSiteStatistics.value = null;
  responseSiteStatisticsSelection.value = null;
  responseMessage.value = "";
  parameterDateStart.value = "";
  parameterDateEnd.value = "";
  store.choroplethLegend = [];
  store.removeDynamicLayers();
  const parameterDates = await getParameterDates(polygonFeature.value);
  if (parameterDates.length > 0) {
    responseSiteStatistics.value = parameterDates[0];
    parameterDateStart.value = parameterDates[0].date_min;
    parameterDateEnd.value = parameterDates[0].date_max;
  } else responseMessage.value = `No observations for selected sites`;
});

onMounted(() => {
  resolution.value = 3;
  getListOfTables();
});
</script>
