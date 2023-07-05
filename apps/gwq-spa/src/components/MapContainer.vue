<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-12 col-md-8">
        <!-- map container -->
        <div id="map-container">
          <!-- map object for leaflet -->
          <div id="map"></div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <!-- info region -->
        <div id="info-container">
          <div v-if="drawnPolygon">
            <GeojsonQueryWebForm
              :polygonSelected="drawnPolygon"
              @reset-search="(value) => (store.drawnPolygon = value)"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="row justify-end"><FooterCopyright /></div>
  </div>
</template>

<script setup>
import styles from "/custom_modules/styles.js";
import { gisStore } from "stores/gisStore";

import FooterCopyright from "components/FooterCopyright.vue";

import { ref, watch, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

import axios from "axios";

import filter from "lodash.filter";

import L from "leaflet";
import "proj4";
import "proj4leaflet";
import "leaflet.markercluster";
import "leaflet-choropleth";

import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

// components
import GeojsonQueryWebForm from "components/GeojsonQueryWebForm.vue";

const store = gisStore();

// data
const dialog = ref(false);
const vectorLayersStyles = ref([
  { layerID: "", style: styles.polygonDefault },
  { layerID: "cadastral_unit", style: styles.polygonYellow },
  { layerID: "vector_data", style: styles.polygonRed },
]);

// methods
function createMap() {
  store.choroplethLegend = [];
  // remove HTML map object
  const mapHTMLobject = document.createElement("div");
  mapHTMLobject.setAttribute("id", "map");
  document.getElementById("map-container").innerHTML = "";
  document.getElementById("map-container").appendChild(mapHTMLobject);
  var myProj = new L.Proj.CRS("EPSG:3857");
  let map = L.map("map", {
    renderer: L.canvas(),
    center: store.mapCenter,
    zoom: store.mapZoom,
  });
  // map events
  map.on("zoomend", function (e) {
    let zoom = map.getZoom();
    setMapZoom(zoom);
  });
  map.on("moveend", function (e) {
    let center = map.getCenter();
    setMapCenter([center.lat, center.lng]);
  });
  if (editMode.value) {
    // geoman
    map.pm.addControls({
      position: "topright",
      drawCircle: false,
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawPolygon: true,
      drawCircle: false,
      drawText: false,
      editMode: false,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
      rotateMode: false,
    });
    map.on("pm:create", (e) => {
      map.pm.removeControls({
        position: "topleft",
        drawCircle: false,
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawPolygon: true,
        drawCircle: false,
        drawText: false,
        editMode: false,
        dragMode: false,
        cutPolygon: false,
        removalMode: false,
        rotateMode: false,
      });
      store.mapEditMode = false;
      const drawnLayers = map.pm.getGeomanDrawLayers();
      let featureGroup = L.featureGroup();
      featureGroup.addLayer(drawnLayers[0]);
      const drawnFeatures = featureGroup.toGeoJSON();
      store.drawnPolygon = drawnFeatures;
    });
  }
  // scale control
  L.control.scale({ imperial: false, maxWidth: 200 }).addTo(map);
  // layers loop
  if (layersSelectedComputed.value.length > 0) {
    layersSelectedComputed.value.forEach(async (layer) => {
      switch (layer.type) {
        case "raster":
          L.tileLayer(layer.url, {
            attribution: layer.attributions,
          }).addTo(map);
          break;
        case "wms":
          L.tileLayer
            .wms(layer.url, {
              layers: layer.layers,
              version: layer.version,
              format: layer.format,
              transparent: layer.transparent,
              projection: layer.projection,
              zIndex: layer.zIndex,
            })
            .addTo(map);
          break;
        case "vector_dynamic":
          if (layer.featurestype === "points") {
            const leafletGeoJSONLayer = L.geoJSON(layer.features, {});
            let markers = L.markerClusterGroup();
            markers.addLayer(leafletGeoJSONLayer);
            markers.addTo(map);
            const leafletGeoJSONLayerBounds = leafletGeoJSONLayer.getBounds();
            map.fitBounds(leafletGeoJSONLayerBounds);
          } else {
            // style function
            function choroplethStyle(feature) {
              const ref = this;
              return {
                fillColor: getColor(
                  parseFloat(feature.properties.value),
                  layer.legend
                ),
                weight: 1,
                opacity: 0.3,
                color: "#000",
                fillOpacity: 0.9,
              };
            }
            const choroplethMap = L.geoJson(layer.features, {
              style: choroplethStyle,
              onEachFeature: function (feature, layer) {
                layer.bindPopup(
                  parseFloat(feature.properties.value).toFixed(2)
                );
              },
            });
            choroplethMap.addTo(map);
            store.choroplethLegend = layer.legend;
            const leafletGeoJSONLayer = L.geoJSON(layer.features.features, {});
            const leafletGeoJSONLayerBounds = leafletGeoJSONLayer.getBounds();
            map.fitBounds(leafletGeoJSONLayerBounds);
          }
          break;
        case "vector_local":
          try {
            const response = await axios({
              method: "get",
              url: layer.url,
              headers: {
                "Content-Type": "application/json",
              },
            });
            let vectorFeatures = response.data.features;
            L.geoJSON(vectorFeatures, {
              style: applyStyle(layer.id),
            }).addTo(map);
          } catch (error) {
            console.log(error);
          }
          break;
      }
    });
  }
}

// get color of feature
function getColor(value, colors) {
  let rangeColor = null;
  switch (true) {
    case value === null || "null":
      rangeColor = "green";
      break;
    default:
      let selected = filter(colors, function (object, index) {
        if (index !== colors.length - 1) {
          return value >= object.min && value < object.max;
        } else {
          return value >= object.min && value <= object.max;
        }
      });
      if (selected && selected.length > 0) {
        rangeColor = selected[0].color;
      }
  }
  if (rangeColor) {
    return rangeColor;
  } else {
    console.log(value);
    console.log(rangeColor);
    return "grey";
  }
}

function applyStyle(layerID) {
  let vectorLayerStyle = null;
  let styles = vectorLayersStyles.value;
  styles.forEach((layerStyle) => {
    if (layerStyle.layerID === layerID) {
      vectorLayerStyle = layerStyle.style;
    }
  });
  return vectorLayerStyle;
}

function setMapZoom(zoom) {
  store.mapZoom = zoom;
}

function setMapCenter(center) {
  store.mapCenter = center;
}

// computed
const layersSelectedComputed = computed(() => {
  return store.layersSelected;
});

const layersSelectedComputedLength = computed(() => {
  return store.layersSelected.length;
});

const editMode = computed(() => {
  return store.mapEditMode;
});

const drawnPolygon = computed(() => {
  return store.drawnPolygon;
});

// watcher
watch(layersSelectedComputed, () => {
  createMap();
});
watch(editMode, () => {
  if (editMode.value) {
    store.choroplethLegend = [];
    store.drawnPolygon = null;
    store.removeDynamicLayers();
    createMap();
  }
});

// mounted
onMounted(() => {
  createMap();
});
</script>

<style lang="scss">
#map {
  width: 100%;
  height: 75vh;
}

#info-container {
  padding: 0rem 1rem 1rem 1rem;
}

@media (max-width: $breakpoint-xs-max) {
  #map {
    height: 50vh;
  }

  #info-container {
    padding: 1rem 0rem 0.5rem 0rem;
  }
}
</style>
