const path = require("path");
const { execFileSync } = require("child_process");
const fs = require("fs");

function sqlValue(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlBool(value) {
  return value ? "1" : "0";
}

function sqlJson(value, fallback = {}) {
  return sqlValue(JSON.stringify(value ?? fallback));
}

function resolveEngine() {
  const explicit = String(process.env.DB_ENGINE || "").trim().toLowerCase();
  if (explicit && explicit !== "mysql") {
    throw new Error(`DB_ENGINE invalide: "${explicit}". Utilise uniquement "mysql".`);
  }
  return "mysql";
}

function getMySqlConfig() {
  const host = process.env.MYSQL_HOST || process.env.DB_HOST;
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);
  const user = process.env.MYSQL_USER || process.env.DB_USER;
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
  const database = process.env.MYSQL_DB_NAME || process.env.DB_NAME;

  if (!host || !user || !password || !database) {
    throw new Error("MYSQL/DB env manquantes (host, user, password, database)");
  }

  return { host, port, user, password, database };
}

function transformSqlForMySql(sql) {
  return String(sql || "")
    .replace(/ON\s+CONFLICT\s*\([^)]+\)\s*DO\s+UPDATE\s+SET/gi, "ON DUPLICATE KEY UPDATE")
    .replace(/=\s*excluded\.([a-zA-Z0-9_]+)/gi, "= VALUES($1)")
    // Le client mariadb en mode -e casse parfois sur ESCAPE '\'
    .replace(/\s+ESCAPE\s+'\\\\'/gi, "")
    .replace(/\s+ESCAPE\s+'\\'/gi, "");
}

function runMySql(sql) {
  const cfg = getMySqlConfig();
  const mysqlBin = process.env.MYSQL_BIN || "/usr/bin/mariadb";
  const transformed = transformSqlForMySql(sql);

  try {
    return execFileSync(
      mysqlBin,
      [
        "--batch",
        "--raw",
        "--default-character-set=utf8mb4",
        "--host",
        cfg.host,
        "--port",
        String(cfg.port),
        "--user",
        cfg.user,
        `--password=${cfg.password}`,
        "--database",
        cfg.database,
        "-e",
        transformed,
      ],
      { encoding: "utf8" },
    );
  } catch (error) {
    const stderr = String(error?.stderr || "").trim();
    const stdout = String(error?.stdout || "").trim();
    const baseMessage = stderr || stdout || error.message || "MySQL query failed";
    const wrapped = new Error(`MySQL query failed: ${baseMessage}`);
    wrapped.status = 500;
    throw wrapped;
  }
}

function parseTabSeparatedRows(rawOutput) {
  const output = String(rawOutput || "").trim();
  if (!output) return [];

  const lines = output.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t");
  return lines.slice(1).map((line) => {
    const values = line.split("\t");
    const row = {};
    headers.forEach((header, index) => {
      const value = values[index];
      const normalized = typeof value === "string" ? value.trim() : value;
      row[header] = normalized === undefined
        || normalized === "\\N"
        || normalized === "NULL"
        ? null
        : normalized;
    });
    return row;
  });
}

function createMySqlClient() {
  const schemaPath = path.join(__dirname, "..", "mysql", "schema.sql");

  return {
    engine: "mysql",
    executeSchema() {
      const schemaSql = fs.readFileSync(schemaPath, "utf8");
      runMySql(schemaSql);
    },
    readRows(sql) {
      const output = runMySql(sql);
      return parseTabSeparatedRows(output);
    },
    runSql(sql) {
      runMySql(sql);
      return "";
    },
    sqlBool,
    sqlJson,
    sqlValue,
    getSqliteDatabasePath() {
      return null;
    },
  };
}

function getSqlClient() {
  const engine = resolveEngine();
  if (engine !== "mysql") {
    throw new Error("Le backend principal est configuré en MySQL uniquement.");
  }
  return createMySqlClient();
}

module.exports = {
  getSqlClient,
  sqlBool,
  sqlJson,
  sqlValue,
};
