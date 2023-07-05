// PostgreSQL
const pgp = require('pg-promise')({
  capSQL: true,
})

// db connection
const dbPostgresConfig = {
  host: 'localhost',
  port: 5432,
  database: 'waterquality',
  user: 'matsibora',
  password: 'sdvtrv56cg56hx5',
  max: 30, // use up to 30 connections
}

const dbPostgres = pgp(dbPostgresConfig)

module.exports = dbPostgres
