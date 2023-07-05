<template>
  <div class="q-pa-md">
    <div class="row justify-between align-center q-pb-lg">
      <div class="row justify-start align-center">
        <div>
          <q-input outlined dense clearable v-model="search" label="Search">
            <template v-slot:prepend> <q-icon name="search" /> </template
          ></q-input>
        </div>
        <div class="text-subtitle1 q-ml-md q-pt-xs">
          {{ message }} <span class="text-green">{{ currentParameter }}</span>
        </div>
      </div>
      <div class="text-subtitle1">
        <q-chip size="md"
          >Parameters: {{ statDataSorted.length }}/{{
            parameters.length
          }}</q-chip
        >
      </div>
    </div>

    <div>
      <q-markup-table flat dense>
        <thead>
          <tr>
            <th class="text-left">#</th>
            <th class="text-left">Parameter</th>
            <th class="text-left">Sites</th>
            <th class="text-left">Observations</th>
            <th class="text-left">Min</th>
            <th class="text-left">Max</th>
            <th class="text-left">Mean</th>
            <th class="text-left">Median</th>
            <th class="text-left">Date min</th>
            <th class="text-left">Date max</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, index) in statDataSorted" :key="row">
            <tr v-if="row.error" class="bg-red-1">
              <td class="text-left">{{ index + 1 }}</td>
              <td class="text-left">{{ row.name }}</td>
              <td class="text-left text-red">{{ row.error }}</td>
              <td :colspan="7"></td>
            </tr>
            <tr v-else>
              <td class="text-left">{{ index + 1 }}</td>
              <td class="text-left">{{ row.name }}</td>
              <td class="text-left">{{ numFormat(row.sites) }}</td>
              <td class="text-left">{{ numFormat(row.observations) }}</td>
              <td class="text-left">{{ numFormat(row.min) }}</td>
              <td class="text-left">{{ numFormat(row.max) }}</td>
              <td class="text-left">{{ numFormat(row.mean) }}</td>
              <td class="text-left">{{ numFormat(row.median) }}</td>
              <td class="text-left">{{ row.date_min }}</td>
              <td class="text-left">{{ row.date_max }}</td>
            </tr>
          </template>
        </tbody>
      </q-markup-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { gisStore } from "stores/gisStore";
import { api } from "boot/axios";
import orderBy from "lodash.orderby";
import filter from "lodash.filter";
// import moment from "moment";

const store = gisStore();

class EmptyStat {
  constructor(parameter, error) {
    this.name = parameter;
    this.error = error;
  }
}

// state
const loading = ref(false);
const search = ref("");
const text = ref("");
const currentParameter = ref("");
const statData = reactive([]);

// on mount hook
onMounted(() => {
  getStatData();
});

// methods
async function getStatData() {
  statData.value = [];
  text.value = "Loading:";

  for await (const parameter of parameters.value) {
    currentParameter.value = `${parameter}`;
    try {
      const response = await api({
        method: "get",
        url: `/data/statistics/${parameter}`,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.statArray[0]) {
        statData.value.push(response.data.statArray[0]);
      } else {
        const errorObject = new EmptyStat(parameter, response.data.message);
        statData.value.push(errorObject);
      }
    } catch (error) {
      const errorObject = new EmptyStat(parameter, error.message);
      statData.value.push(errorObject);
    }
  }
  text.value = "";
  currentParameter.value = "";
}

function numFormat(value) {
  return Intl.NumberFormat("nb-NO").format(value);
}

// computed
const statDataComputed = computed(() => {
  return statData.value;
});

const statDataFiltered = computed(() => {
  const featuresFiltered = filter(statDataComputed.value, function (feature) {
    if (search.value && search.value !== "") {
      return feature.name.toLowerCase().includes(search.value.toLowerCase());
    } else {
      return feature;
    }
  });
  return featuresFiltered;
});

const statDataSorted = computed(() => {
  const sorted = orderBy(statDataFiltered.value, ["name"]);
  return sorted;
});

const message = computed(() => {
  return `${text.value}`;
});

const parameters = computed(() => {
  return [
    "BOD5_obs",
    "BOD7_obs",
    "BOD_obs",
    "CODCr_obs",
    "CODMn_obs",
    "COD_obs",
    "DC_obs",
    "DIC_obs",
    "DIN_obs",
    "DIP_obs",
    "DKN_obs",
    "DOC_obs",
    "DON_obs",
    "DOP_obs",
    "DOSAT_obs",
    "DO_obs",
    "NH4N_obs",
    "NO2N_obs",
    "NO3N_obs",
    "PC_obs",
    "PIC_obs",
    "PN_obs",
    "POC_obs",
    "PON_obs",
    "POP_obs",
    "TAN_obs",
    "TC_obs",
    "TDN_obs",
    "TDP_obs",
    "TEMP_obs",
    "TIC_obs",
    "TIN_obs",
    "TIP_obs",
    "TKN_obs",
    "TN_obs",
    "TOC_obs",
    "TON_obs",
    "TOP_obs",
    "TPP_obs",
    "TP_obs",
    "TSS_obs",
    "pH_obs",
  ];
});
</script>

<style></style>
