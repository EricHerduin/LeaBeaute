require("dotenv").config();

const { createPoolFromEnv, pingDatabase } = require("./mysqlClient");

async function main() {
  const pool = createPoolFromEnv();

  try {
    const connectionInfo = await pingDatabase(pool);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_health_checks (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        note VARCHAR(255) NOT NULL
      )
    `);

    await pool.query(
      "INSERT INTO app_health_checks (note) VALUES (?)",
      ["Connexion MySQL backend2 validée"],
    );

    console.info("Connexion MySQL OK :", connectionInfo);
    console.info("Table app_health_checks initialisée.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
