## Global Water Quality Web App

Global river water quality application (GRWQ App) is a web-based geographic information system, developed in creative cooperation with Alexander Kmoch and Holger Virro. It is an online tool for visual analysis and spatial data observation of river water quality parameters. GRWQ App is built completely with all advantages of JavaScript (Node.js + Vue.js) and power of SQL (PostgreSQL).

### The main purposes of GRWQ App development are:

- to create a user-friendly web-application for the observation, visualization and analysis of river water quality parameters
- to conduct an engineering experiment with efficient integration of different frameworks, libraries, technologies (Vue.js + Leaflet.js + DGGS H3) and implement original logic into a front-end single page application

### Details about dataset:

- Virro, H., Amatulli, G., Kmoch, A., Shen, L., and Uuemaa, E.: GRQA: Global River Water Quality Archive, Earth Syst. Sci. Data, 13, 5483–5507, 10.5194/essd-13-5483-2021, 2021.

### Only open source frameworks and libraries were used:

- Express.js (Node.js web application framework)
- Quasar.js (Vue.js based front-end framework)
- Leaflet.js (library for interactive maps)
- DGGS H3 (hexagonal geospatial indexing system)
- Turf.js (advanced geospatial analysis library)
- Lodash.js (JS utility library)

### The main features of GRWQ App:

- selecting area of interest
- search for available sites of river water observation in the area
- saving selected sites to CSV or geoJSON files
- calculating basic statistic parameters of observation values (min, max, mean, median, etc)
- selecting among more than 40 water quality parameters from “Biochemical oxygen demand” to “Total suspended solids”
- selecting available river water quality observations by date range dynamically
- generated legend for hexagons of the choropleth map

### The most interesting features of GRWQ App:

- integration of Vue.js and Leaflet.js without using “common state” – both libraries work independently
- usage of all advantages of Composition API and Pinia store in Vue 3
- implementation of DGGS (Discrete Global Grid Systems) H3 (Hexagonal hierarchical geospatial indexing system) for building the choropleth map on different resolution levels

## Installation

```
- git clone git@github.com:rmcf/gwq.git
- yarn install
```

## Usage

- “how-to guide” video on YouTube: https://youtu.be/pLJTKseKyDo
- GRWQ App: https://maps.landscape-geoinformatics.org/gwq-spa/

## Authors and acknowledgment

- Oleksandr Matsibora
- Alexander Kmoch
- Holger Virro

## License

code: MIT License
