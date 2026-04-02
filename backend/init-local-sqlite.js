require("dotenv").config();

const { executeSchema, getSqliteDatabasePath } = require("./sqlite/sqliteClient");

function main() {
  executeSchema();
  console.info(`Base SQLite locale initialisée : ${getSqliteDatabasePath()}`);
}

main();
