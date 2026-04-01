require("dotenv").config();

const { createMysqlPoolFromEnv, executeSchema } = require("./mysql/mysqlClient");

async function main() {
  const pool = createMysqlPoolFromEnv();

  try {
    await executeSchema(pool);
    console.info("Schema MySQL initialisé avec succès.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
