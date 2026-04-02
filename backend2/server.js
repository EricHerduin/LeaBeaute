require("dotenv").config();

const express = require("express");
const { createPoolFromEnv, pingDatabase } = require("./mysqlClient");

const app = express();
const port = Number(process.env.PORT || 8000);
const corsOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const pool = createPoolFromEnv();

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (corsOrigins.includes("*") || !origin || corsOrigins.includes(origin)) {
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.get("/api", (req, res) => {
  res.json({
    message: "Léa Beauté backend2 MySQL",
    mode: "mysql-only",
  });
});

app.get("/api/health", async (req, res, next) => {
  try {
    const db = await pingDatabase(pool);
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS checks_count, MAX(checked_at) AS last_check FROM app_health_checks",
    );

    res.json({
      status: "ok",
      db,
      checks: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/mysql-check", async (req, res, next) => {
  try {
    const db = await pingDatabase(pool);

    res.json({
      mysql_connected: true,
      host: process.env.MYSQL_HOST || "localhost",
      port: Number(process.env.MYSQL_PORT || 3306),
      database: db.database_name,
      current_user: db.current_user,
      server_version: db.server_version,
      message: "Connexion MySQL o2switch validee",
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/health/write-test", async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "INSERT INTO app_health_checks (note) VALUES (?)",
      ["Test d'écriture backend2"],
    );

    res.json({
      status: "ok",
      insertedId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    status: "error",
    mysql_connected: false,
    detail: error.message || "Internal server error",
  });
});

async function start() {
  await pool.query("SELECT 1");

  app.listen(port, () => {
    console.info(`backend2 MySQL démarré sur le port ${port}`);
  });
}

async function shutdown() {
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
