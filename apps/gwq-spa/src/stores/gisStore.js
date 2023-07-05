import { defineStore } from "pinia";

export const gisStore = defineStore("store", {
  state: () => ({
    layersSelected: [],
    mapZoom: 4,
    mapCenter: [48.19538740833338, 18.148816185579072],
    wmsUrlParameters: null,
    mapEditMode: false,
    drawnPolygon: null,
    choroplethLegend: [],
    staticLayers: [
      {
        id: "osm",
        title: { en: "Open Street Map", ee: "Openstreetmap" },
        description: { en: "collaborative project", ee: "koostööprojekt" },
        attributions: "",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        type: "raster",
        group: "c",
        format: "png",
        zIndex: 1,
        projection: "EPSG:4326",
      },
      {
        id: "esri_world_imagery",
        title: { en: "ESRI World Imagery", ee: "ESRI maailmapildid" },
        description: { en: "collaborative project", ee: "koostööprojekt" },
        attributions:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png",
        type: "raster",
        group: "c",
        format: "png",
        zIndex: 1,
        projection: "EPSG:4326",
      },
      {
        id: "esri_world_grey",
        title: { en: "ESRI World Grey Canvas", ee: "ESRI World Grey Canvas" },
        description: { en: "", ee: "" },
        attributions: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        type: "raster",
        group: "c",
        format: "png",
        zIndex: 1,
        projection: "EPSG:4326",
      },
      {
        id: "wikimedia",
        title: { en: "Wikimedia maps", ee: "Wikimedia kaardid" },
        description: {
          en: "general colour map wikimedia maps",
          ee: "Üldine värviline kaart wikimedia kaardid",
        },
        attributions: "",
        url: "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png",
        type: "raster",
        group: "c",
        format: "png",
        zIndex: 1,
        projection: "EPSG:4326",
      },
      {
        id: "argistopomap",
        title: { en: "ArcGIS World Topo Map", ee: "ArcGIS maailma topokaart" },
        description: {
          en: "ArcGIS REST tile services",
          ee: "ArcGIS REST plaaditeenused",
        },
        attributions: "",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        type: "raster",
        group: "c",
        format: "png",
        zIndex: 1,
        projection: "EPSG:4326",
      },
    ],
    h3levels: [
      { level: 0, hexArea: 4357449.41607838, pentArea: 2562182.1629555 },
      { level: 1, hexArea: 609788.441794133, pentArea: 328434.586246469 },
      { level: 2, hexArea: 86801.780398997, pentArea: 44930.898497879 },
      { level: 3, hexArea: 12393.434655088, pentArea: 6315.472267516 },
      { level: 4, hexArea: 1770.347654491, pentArea: 896.582383141 },
      { level: 5, hexArea: 252.903858182, pentArea: 127.785583023 },
      { level: 6, hexArea: 36.129062164, pentArea: 18.238749548 },
      { level: 7, hexArea: 5.16129336, pentArea: 2.604669397 },
      { level: 8, hexArea: 0.737327598, pentArea: 0.372048038 },
      { level: 9, hexArea: 0.105332513, pentArea: 0.053147195 },
      { level: 10, hexArea: 0.015047502, pentArea: 0.007592318 },
      { level: 11, hexArea: 0.002149643, pentArea: 0.001084609 },
      { level: 12, hexArea: 0.000307092, pentArea: 0.000154944 },
      { level: 13, hexArea: 0.00004387, pentArea: 0.000022135 },
      { level: 14, hexArea: 0.000006267, pentArea: 0.000003162 },
      { level: 15, hexArea: 8.95e-7, pentArea: 4.52e-7 },
    ],
  }),

  getters: {
    layersWms(state) {
      const wmsLayers = state.layersSelected.filter((layer) => {
        return layer.type === "wms";
      });
      return wmsLayers;
    },
  },

  actions: {
    updateLayersSelected(layersArray) {
      this.layersSelected.length = 0;
      this.layersSelected = layersArray.map((layer) => {
        return layer;
      });
    },

    removeDynamicLayers() {
      const defaultLayers = this.layersSelected.filter((layer) => {
        return layer.type !== "vector_dynamic";
      });
      this.layersSelected = defaultLayers;
    },

    changeMapEditMode() {
      this.mapEditMode = !this.mapEditMode;
    },
  },
});
