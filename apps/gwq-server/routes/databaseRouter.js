const express = require('express')
const databaseRouter = express.Router()
const databaseController = require('../controllers/databaseController.js')
// form parser
const urlencodedParser = express.urlencoded({ extended: false })

// tables list in database
databaseRouter.get('/tables', databaseController.database)

// sites
databaseRouter.post('/sites', databaseController.sites)
databaseRouter.post('/sites-hexids', databaseController.hexIDsList)
databaseRouter.post('/sites-hex-geojson', databaseController.hexIDsGeoJson)
databaseRouter.get(
  '/sites/:folder/:filetype',
  databaseController.sitesFileDownload
)

databaseRouter.get('/statistics/:parameter', databaseController.dataStatistics)

// EXPORTS
module.exports = databaseRouter
