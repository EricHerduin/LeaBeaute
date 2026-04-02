require("dotenv").config();

const holidaysSeed = require("./data/holidaysSeed.json");
const { executeSchema, runSql, getSqliteDatabasePath, sqlBool, sqlValue } = require("./sqlite/sqliteClient");

function main() {
  executeSchema();

  runSql("DELETE FROM business_hours_holidays;");

  for (const item of holidaysSeed) {
    runSql(`
      INSERT INTO business_hours_holidays (date, name, is_closed, created_at, updated_at)
      VALUES (
        ${sqlValue(item.date)},
        ${sqlValue(item.name)},
        ${sqlBool(true)},
        ${sqlValue(new Date().toISOString())},
        ${sqlValue(new Date().toISOString())}
      );
    `);
  }

  console.info(`Jours fériés insérés dans SQLite: ${holidaysSeed.length}`);
  console.info(`Base SQLite: ${getSqliteDatabasePath()}`);
}

main();
