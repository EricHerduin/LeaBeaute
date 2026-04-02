const mysql = require("mysql2/promise");

function createPoolFromEnv() {
  const host = process.env.MYSQL_HOST || "localhost";
  const port = Number(process.env.MYSQL_PORT || 3306);
  const database = process.env.MYSQL_DB_NAME;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;

  if (!database || !user || !password) {
    throw new Error("MYSQL_DB_NAME, MYSQL_USER et MYSQL_PASSWORD sont requis");
  }

  return mysql.createPool({
    host,
    port,
    database,
    user,
    password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
  });
}

async function pingDatabase(pool) {
  const [rows] = await pool.query(
    "SELECT DATABASE() AS database_name, CURRENT_USER() AS current_user_name, VERSION() AS server_version",
  );
  return rows[0];
}

module.exports = {
  createPoolFromEnv,
  pingDatabase,
};
