const openDB = (name, version) =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => {
      const db = req.result;
      const store = db.createObjectStore("readings", { keyPath: "id" });
      ["sensorId", "timestamp"].map((idx) => store.createIndex(idx, idx));
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const txStore = (db, mode = "readonly") =>
  db.transaction("readings", mode).objectStore("readings");

const ids = Array.from({ length: 10 }, (_, i) => i + 1);
const baseTime = Date.now();

const baseObjects = ids.map((id) => ({
  id,
  sensorId: "sensor-" + ((id % 3) + 1),
  reading: Number((Math.sin(id) * 50 + 50).toFixed(2)),
  timestamp: new Date(baseTime + id * 60000).toISOString(),
  notes: ["nominal", "check", "ok"]
    .map((n, i) => ({ i, n }))
    .filter((x) => x.i === id % 3)
    .map((x) => x.n + " | sample #" + id)
    .reduce((a, b) => b, ""),
}));

const toUTC = (v) => new Date(v).toISOString();
const makeMeta = () => ({
  author: "Sahil Desai",
  last_sync: new Date().toISOString(),
  uuid_source: crypto.randomUUID(),
});

const prepared = baseObjects.map((o) => ({
  id: o.id,
  sensorId: o.sensorId,
  reading: o.reading,
  timestamp: toUTC(o.timestamp),
  notes: o.notes,
  metadata: makeMeta(),
}));

const upsertAll = (db, rows) => {
  const store = txStore(db, "readwrite");
  const putOne = (r) =>
    new Promise((resolve, reject) => {
      const req = store.put(r);
      req.onsuccess = () => resolve(r.id);
      req.onerror = () => reject(req.error);
    });
  return Promise.all(rows.map(putOne)).then((xs) => ({ upserted: xs.length }));
};

const readAll = (db) =>
  new Promise((resolve, reject) => {
    const req = txStore(db).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const showOne = (obj) =>
  document.body.appendChild(
    Object.assign(document.createElement("pre"), {
      textContent: JSON.stringify(obj, null, 2),
    })
  );

openDB("SensorsDB", 1)
  .then((db) => upsertAll(db, prepared).then(() => readAll(db)))
  .then((rows) =>
    rows
      .filter((r) => r.id >= 1 && r.id <= 10)
      .filter((r) => r.id === 1)
      .map(showOne)
      .reduce((a, b) => b, null)
  )
  .catch((err) => console.error("Error:", err));
