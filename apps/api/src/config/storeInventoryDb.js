const mysql = require("mysql2/promise");

const storeInventoryDbPool = mysql.createPool({
  host: process.env.STORE_DB_HOST || "localhost",
  port: Number(process.env.STORE_DB_PORT || 3309),
  user: process.env.STORE_DB_USER || "root",
  password: process.env.STORE_DB_PASSWORD || "root",
  database: process.env.STORE_DB_NAME || "stockmesh_store_001",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = storeInventoryDbPool;