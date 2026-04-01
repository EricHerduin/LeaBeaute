const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const schemaPath = path.join(__dirname, "schema.sql");

function createMysqlPoolFromEnv() {
  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || !password || !database) {
    throw new Error("DB_HOST, DB_USER, DB_PASSWORD et DB_NAME sont requis pour MySQL");
  }

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
  });
}

async function executeSchema(pool) {
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const statements = schemaSql
    .split(/;\s*\n/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

module.exports = {
  createMysqlPoolFromEnv,
  executeSchema,
};
