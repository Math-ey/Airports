const pg = require('pg');
require('dotenv/config');

const connectionString = "postgres://postgres:1234@localhost:5432/pdt";

const pgClient = new pg.Client(connectionString);

pgClient.connect();

module.exports = pgClient;