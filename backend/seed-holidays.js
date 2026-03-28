require("dotenv").config();

const { MongoClient } = require("mongodb");
const holidaysSeed = require("./data/holidaysSeed.json");

async function main() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;

  if (!mongoUrl || !dbName) {
    throw new Error("MONGO_URL et DB_NAME sont requis");
  }

  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("business_hours_holidays");

    await collection.deleteMany({});
    await collection.insertMany(
      holidaysSeed.map((item) => ({
        date: item.date,
        name: item.name,
        isClosed: true,
      })),
    );

    console.log(`Jours fériés insérés: ${holidaysSeed.length}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
