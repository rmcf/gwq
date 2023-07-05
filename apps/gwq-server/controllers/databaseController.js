// postgres db
const pgp = require('pg-promise')({
  /* initialization options */
  capSQL: true, // capitalize all generated SQL
})
const dbPostgres = require('../custom_modules/db-config.js')

var fs = require('fs')
var Parser = require('@json2csv/plainjs').Parser

const h3 = require('h3-js')
const geojson2h3 = require('geojson2h3')

const chroma = require('chroma-js')

const { v4: uuidv4 } = require('uuid')

const objectItterateProps = function (obj) {
  let templateObj = {}
  Object.entries(obj).forEach(([key, value]) => {
    templateObj[key] = value
  })
  return templateObj
}

// DB tables list
exports.database = async function (request, response) {
  try {
    const tables = await dbPostgres.any(
      "SELECT table_name FROM information_schema.tables where table_schema = 'grqa_data' and table_name <> 'sites'",
      [true]
    )
    const tablesToSelect = tables
      .map((table) => {
        return table.table_name
      })
      .sort()
    response.json({ tables: tablesToSelect })
  } catch (e) {
    console.log(e)
    response.json({ message: 'DB error' })
  }
}

// returns selected sites (geoJSON points)
exports.sites = async function (request, response) {
  const coordinates = request.body.features[0].geometry.coordinates[0]
  const coordinatesString = coordinates.map((coord) => {
    const coordFormatted = `${coord[0]} ${coord[1]}`
    return coordFormatted
  })
  const coordinatesStringFormatted = coordinatesString.join(', ')
  class ResponseTemplate {
    constructor(features, filesFolder, message) {
      this.geojson = features
      this.filesFolder = filesFolder
      this.message = message
    }
  }
  try {
    const points = await dbPostgres.any(
      "select * from grqa_data.sites s where ST_Contains(ST_GeomFromText('POLYGON((" +
        coordinatesStringFormatted +
        "))', 4326), geometry)",
      [true]
    )
    const features = points.map((point) => {
      return {
        type: 'Feature',
        properties: objectItterateProps(point),
        geometry: {
          type: 'Point',
          coordinates: [point.lon_wgs84, point.lat_wgs84],
        },
      }
    })
    const featureCollection = {
      type: 'FeatureCollection',
      name: 'points',
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      features: features,
    }
    const jsonDataString = JSON.stringify(featureCollection)
    const uniqFolderName = uuidv4()
    const uniqFolderNameLocation = `./public/temp-files/${uniqFolderName}`
    try {
      if (!fs.existsSync(uniqFolderNameLocation)) {
        fs.mkdirSync(uniqFolderNameLocation)
        // geoJSON file
        const geoJsonFilePath = uniqFolderNameLocation + '/sites.geojson'
        fs.writeFileSync(
          geoJsonFilePath,
          jsonDataString,
          'utf8',
          function (err) {
            if (err) {
              console.log('An error occured while writing JSON Object to File.')
              return console.log(err)
            }
            console.log('JSON file has been saved')
          }
        )
        // csv file
        const csvFilePath = uniqFolderNameLocation + '/sites.csv'
        try {
          const opts = {}
          const parser = new Parser(opts)
          const csvData = parser.parse(points)
          fs.writeFileSync(csvFilePath, csvData, 'utf8', function (err) {
            if (err) {
              console.log('An error occured while writing JSON Object to File.')
              return console.log(err)
            }
            console.log('JSON file has been saved')
          })
        } catch (err) {
          console.error(err)
        }
        // response
        const responseDataObject = new ResponseTemplate(
          featureCollection,
          uniqFolderName,
          ''
        )
        response.json(responseDataObject)
      }
    } catch (err) {
      // response
      const responseDataObject = new ResponseTemplate(
        featureCollection,
        '',
        'Files to download are not available'
      )
      response.json(responseDataObject)
      console.error(err)
      console.log('File has not been created')
    }
  } catch (e) {
    console.log(e)
    // response
    const responseDataObject = new ResponseTemplate({}, '', 'Database error')
    response.json(responseDataObject)
  }
}

// returns selected sites (list of HEX IDs)
exports.hexIDsList = async function (request, response) {
  const responseDataObject = await responseHex(request.body)
  response.json(responseDataObject)
}

// returns selected sites (geoJSON layer)
exports.hexIDsGeoJson = async function (request, response) {
  class ResponseTemplate {
    constructor(features, legend, statistics, message) {
      this.geojson = features
      this.legend = legend
      this.statistics = statistics
      this.message = message
    }
  }
  const hexResponse = await responseHex(request.body)
  const allHexagons = hexResponse.sitesArray
  const statistics = hexResponse.statistics
  if (allHexagons.length > 0) {
    // reduce duplicates
    const tempTableName = 'temptable'
    await dbPostgres.any(`DROP TABLE IF EXISTS ${tempTableName}`)
    await dbPostgres.any(
      `CREATE TEMP TABLE ${tempTableName} (
      id serial PRIMARY KEY, hexcode text, property numeric)`,
      [true]
    )
    const cs = new pgp.helpers.ColumnSet(['hexcode', 'property'], {
      table: tempTableName,
    })
    const values = allHexagons.map((hexId) => {
      return { hexcode: hexId.id, property: hexId.value }
    })
    const query = pgp.helpers.insert(values, cs)
    await dbPostgres.none(query)
    const uniqHexagons = await dbPostgres.any(
      `SELECT hexcode, AVG(property) FROM ${tempTableName} GROUP BY hexcode`,
      [true]
    )
    // legend
    const legendLimitsResponse = await dbPostgres.any(
      `select ROUND(cast(min(uniqhex.property) as numeric), 5) as min, ROUND(cast(PERCENTILE_CONT(0.2) within group ( order by uniqhex.property) as numeric), 5) as q1, ROUND(cast(PERCENTILE_CONT(0.4) within group ( order by uniqhex.property) as numeric), 5) as q2, ROUND(cast(PERCENTILE_CONT(0.6) within group ( order by uniqhex.property) as numeric), 5) as q3, ROUND(cast(PERCENTILE_CONT(0.8) within group ( order by uniqhex.property) as numeric), 5) as q4, ROUND(cast(max(uniqhex.property) as numeric), 5) as max from (SELECT hexcode, AVG(property) as property FROM ${tempTableName} GROUP BY hexcode) as uniqhex`,
      [true]
    )
    const legendLimits = legendLimitsResponse[0]
    const legendLimitsArray = []
    for (const [key, value] of Object.entries(legendLimits)) {
      const limitNumber = parseFloat(value)
      legendLimitsArray.push(limitNumber)
    }
    const legendLimitsArraySorted = legendLimitsArray.sort(function (a, b) {
      return a - b
    })
    const legendColors = chroma.scale('OrRd').colors(5)
    const legendRanges = legendLimitsArraySorted.map((limit, index) => {
      if (index !== legendLimitsArraySorted.length - 1) {
        return {
          min: limit,
          max: legendLimitsArraySorted[index + 1],
          color: legendColors[index],
        }
      }
      return {}
    })
    const removeLastElement = legendRanges.pop()
    const hexagons = uniqHexagons.map((hexagon) => {
      let hexFeature = geojson2h3.h3ToFeature(hexagon.hexcode)
      hexFeature.properties.hexid = hexagon.hexcode
      hexFeature.properties.value = parseFloat(hexagon.avg).toFixed(5)
      return hexFeature
    })
    const featureCollection = {
      type: 'FeatureCollection',
      name: 'polygons',
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      features: hexagons,
    }
    const responseDataObject = new ResponseTemplate(
      featureCollection,
      legendRanges,
      statistics,
      ''
    )
    response.json(responseDataObject)
  } else {
    const responseDataObject = new ResponseTemplate(
      null,
      [],
      statistics,
      hexResponse.message
    )
    response.json(responseDataObject)
  }
}

exports.sitesFileDownload = function (req, res) {
  const fileName = `sites.${req.params.filetype}`
  const filePath = `./public/temp-files/${req.params.folder}/`
  const pathToFile = `${filePath}/${fileName}`
  res.download(pathToFile)
}

exports.dataStatistics = async function (request, response) {
  class ResponseTemplate {
    constructor(parameter, array, message) {
      this.parameter = parameter
      this.statArray = array
      this.message = message
    }
  }
  const parameter = request.params.parameter
  try {
    const statData = await dbPostgres.any(
      `select param_code as name, count(distinct site_id) as sites, count(obs_id) as observations, ROUND(cast(min(obs_value) as numeric), 2) as min, ROUND(cast(max(obs_value) as numeric), 2) as max, ROUND(cast(avg(obs_value) as numeric), 2) as mean, ROUND(cast(PERCENTILE_CONT(0.5) within group ( order by obs_value) as numeric), 2) as median, TO_CHAR(min(obs_date_as_date) :: DATE, 'dd.mm.yyyy') as date_min, TO_CHAR(max(obs_date_as_date) :: DATE, 'dd.mm.yyyy') as date_max from grqa_data."${parameter}" group by param_code`,
      [true]
    )
    // response
    responseDataObject = new ResponseTemplate(parameter, statData, '')
    response.json(responseDataObject)
  } catch (error) {
    console.log(error)
    // response
    responseDataObject = new ResponseTemplate(parameter, [], 'DB error')
    response.json(responseDataObject)
  }
}

// response function
const responseHex = async function (requestBody) {
  const siteParameter = requestBody.parameter
  const resolution = requestBody.resolution
  const dateStart = requestBody.dateStart
  const dateEnd = requestBody.dateEnd
  class ResponseTemplate {
    constructor(array, statistics, message) {
      this.sitesArray = array
      this.statistics = statistics
      this.message = message
    }
  }
  const coordinates = requestBody.geojson.features[0].geometry.coordinates[0]
  const coordinatesString = coordinates.map((coord) => {
    const coordFormatted = `${coord[0]} ${coord[1]}`
    return coordFormatted
  })
  const coordinatesStringFormatted = coordinatesString.join(', ')
  let responseDataObject = null
  try {
    // sites
    let sites = []
    if (dateStart && dateEnd) {
      sites = await dbPostgres.any(
        `select paramsiteid, obs_value, info.lat_WGS84, info.lon_WGS84, obs_date, obs_date_as_date from ( select param.paramsiteid, param.obs_value, param.obs_date, param.obs_date_as_date, selectedsites.sitesiteid, selectedsites.lat_WGS84, selectedsites.lon_WGS84 from ( select site_id as paramsiteid, obs_value, obs_date, obs_date_as_date from grqa_data."${siteParameter}" where obs_date_as_date between '${dateStart}' and '${dateEnd}') as param join ( select site_id as sitesiteid, lat_WGS84, lon_WGS84 from grqa_data."sites" where ST_Contains( ST_GeomFromText('POLYGON((${coordinatesStringFormatted}))', 4326), geometry )) as selectedsites on param.paramsiteid = selectedsites.sitesiteid) as info`,
        [true]
      )
    }
    // statistics
    let sitesStatistics = null
    if (dateStart && dateEnd) {
      sitesStatistics = await dbPostgres.any(
        `select param_code as name, count(distinct sitesiteid) as sites, count(obs_date) as observations, min(obs_value), max(obs_value), ROUND(cast(avg(obs_value) as numeric), 2) as mean, ROUND(cast(PERCENTILE_CONT(0.5) within group (order by obs_value) as numeric), 2) as median, TO_CHAR(min(obs_date_as_date) :: DATE, 'yyyy-mm-dd') as date_min, TO_CHAR(max(obs_date_as_date) :: DATE, 'yyyy-mm-dd') as date_max from ( select param.param_code, param.paramsiteid, param.obs_value, param.obs_date, param.obs_date_as_date, selectedsites.sitesiteid, selectedsites.lat_WGS84, selectedsites.lon_WGS84 from ( select site_id as paramsiteid, obs_value, param_code, obs_date, obs_date_as_date from grqa_data."${siteParameter}" where obs_date_as_date between '${dateStart}' and '${dateEnd}') as param join ( select site_id as sitesiteid, lat_WGS84, lon_WGS84 from grqa_data."sites" where ST_Contains( ST_GeomFromText('POLYGON((${coordinatesStringFormatted}))', 4326), geometry )) as selectedsites on param.paramsiteid = selectedsites.sitesiteid) as info group by name`,
        [true]
      )
    } else {
      sitesStatistics = await dbPostgres.any(
        `select param_code as name, count(distinct sitesiteid) as sites, count(obs_date) as observations, min(obs_value), max(obs_value), ROUND(cast(avg(obs_value) as numeric), 2) as mean, ROUND(cast(PERCENTILE_CONT(0.5) within group (order by obs_value) as numeric), 2) as median, TO_CHAR(min(obs_date_as_date) :: DATE, 'yyyy-mm-dd') as date_min, TO_CHAR(max(obs_date_as_date) :: DATE, 'yyyy-mm-dd') as date_max from ( select param.param_code, param.paramsiteid, param.obs_value, param.obs_date, param.obs_date_as_date, selectedsites.sitesiteid, selectedsites.lat_WGS84, selectedsites.lon_WGS84 from ( select site_id as paramsiteid, obs_value, param_code, obs_date, obs_date_as_date from grqa_data."${siteParameter}") as param join ( select site_id as sitesiteid, lat_WGS84, lon_WGS84 from grqa_data."sites" where ST_Contains( ST_GeomFromText('POLYGON((${coordinatesStringFormatted}))', 4326), geometry )) as selectedsites on param.paramsiteid = selectedsites.sitesiteid) as info group by name`,
        [true]
      )
    }
    if (sites.length > 0) {
      const hexIndexes = sites.map((site) => {
        return {
          id: h3.latLngToCell(site.lat_wgs84, site.lon_wgs84, resolution),
          value: site.obs_value,
        }
      })
      // response
      responseDataObject = new ResponseTemplate(hexIndexes, sitesStatistics, '')
      return responseDataObject
    } else {
      // response
      responseDataObject = new ResponseTemplate(
        [],
        sitesStatistics,
        `No ${siteParameter} values for selected sites`
      )
      return responseDataObject
    }
  } catch (e) {
    console.log(e)
    // response
    responseDataObject = new ResponseTemplate([], null, 'Database error')
    return responseDataObject
  }
}
