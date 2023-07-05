<template>
  <div class="q-pa-lg">
    <div class="text-body2 q-pt-sm text-right q-gutter-y-sm">
      <div>
        Virro, H., Amatulli, G., Kmoch, A., Shen, L., and Uuemaa, E.: GRQA:
        Global River Water Quality Archive, Earth Syst. Sci. Data, 13,
        5483-5507, https://doi.org/10.5194/essd-13-5483-2021, 2021.
      </div>
      <div>© 2022-{{ year }} Oleksandr Matsibora, Alexander Kmoch</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

// computed
const year = computed(() => {
  const date = new Date();
  return date.getFullYear();
});
</script>

<style scoped></style>
