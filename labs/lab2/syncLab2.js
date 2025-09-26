const { MongoClient } = require("mongodb");
const { randomUUID } = require("crypto");

const uri =
  "mongodb+srv://comp263:c4paJkdsceytNEbr@lab2cluster.yub3wro.mongodb.net/";

(async () => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
  try {
    await client.connect();
    const col = client.db("Lab2").collection("Agriculture");

    const metadata = {
      author: "Sahil Desai",
      last_sync: new Date().toISOString(),
      uuid_source: randomUUID(),
    };

    const baseTime = Date.now();
    const ids = Array.from({ length: 10 }, (_, i) => i + 1);

    const docs = ids.map((id) => ({
      id,
      sensorId: "sensor-" + ((id % 3) + 1),
      reading: Number((Math.sin(id) * 50 + 50).toFixed(2)),
      timestamp: new Date(baseTime + id * 60000).toISOString(),
      notes: ["nominal", "check", "ok"]
        .map((n, i) => ({ i, n }))
        .filter((x) => x.i === id % 3)
        .map((x) => x.n + " | sample #" + id)
        .reduce((a, b) => b, ""),
      metadata,
    }));

    const res = await col.insertMany(docs, { ordered: true });
    console.log(res.insertedCount);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
