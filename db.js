const { Pool } = require('pg');

// Define the pool object with your database configuration
const pool = new Pool({
  user: 'postgres', // PostgreSQL username
  host: 'localhost',
  database: 'jayantidb',
  password: 'root',
  port: 5432, // Default port for PostgreSQL
});

module.exports = pool;