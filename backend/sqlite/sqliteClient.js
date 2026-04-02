const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const schemaPath = path.join(__dirname, "schema.sql");
const defaultDatabasePath = path.join(__dirname, "..", "local-data", "lea-beaute-local.sqlite");

function getSqliteDatabasePath() {
  return process.env.LOCAL_SQLITE_PATH || defaultDatabasePath;
}

function ensureSqliteDirectory() {
  fs.mkdirSync(path.dirname(getSqliteDatabasePath()), { recursive: true });
}

function runSql(sql) {
  ensureSqliteDirectory();
  return execFileSync("sqlite3", [getSqliteDatabasePath()], {
    input: sql,
    encoding: "utf8",
  });
}

function readRows(sql) {
  ensureSqliteDirectory();
  const output = execFileSync("sqlite3", ["-header", "-csv", getSqliteDatabasePath(), sql], {
    encoding: "utf8",
  });

  const trimmed = output.trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? null]),
    );
  });
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current === "" ? null : current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current === "" ? null : current);
  return result;
}

function executeSchema() {
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  runSql(schemaSql);
}

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

module.exports = {
  executeSchema,
  getSqliteDatabasePath,
  parseCsvLine,
  readRows,
  runSql,
  sqlBool,
  sqlJson,
  sqlValue,
};
