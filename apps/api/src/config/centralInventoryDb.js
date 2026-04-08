const mysql = require("mysql2/promise");

const centralInventoryDbPool = mysql.createPool({
  host: process.env.SYMMETRIC_DB_HOST || "localhost",
  port: Number(process.env.SYMMETRIC_DB_PORT || 3307),
  user: process.env.SYMMETRIC_DB_USER || "root",
  password: process.env.SYMMETRIC_DB_PASSWORD || "root",
  database: process.env.SYMMETRIC_DB_NAME || "stockmesh_central",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = centralInventoryDbPool;