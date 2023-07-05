<template>
  <div v-if="legendRanges.length > 0" class="q-mb-md">
    <div class="q-pa-md q-gutter-y-xs">
      <div
        v-for="range in legendRanges"
        :key="range.color"
        class="row items-center"
      >
        <div
          class="legend-color q-mr-sm"
          :style="{ 'background-color': range.color }"
        ></div>
        <div>{{ formatNum(range.min) }} - {{ formatNum(range.max) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";

import { useI18n } from "vue-i18n";
import { gisStore } from "stores/gisStore";

const store = gisStore();

// methods
function formatNum(value) {
  return value;
}

// computed
const legendRanges = computed(() => {
  return store.choroplethLegend;
});

onMounted(() => {});
</script>

<style lang="scss" scoped>
.legend-color {
  width: 25px;
  height: 25px;
}
</style>
