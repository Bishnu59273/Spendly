import { openDB } from "idb";

const DB_NAME = "spendly-offline";
const DB_VERSION = 1;
const STORE = "outbox";

let dbPromise;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: "sequence", autoIncrement: true });
        store.createIndex("byId", "id", { unique: true });
      },
    });
  }
  return dbPromise;
}

// entry: { id, entity, op, clientOpId, tempId?, targetId?, payload, expectedUpdatedAt?, extra? }
export async function addToOutbox(entry) {
  const db = await getDb();
  const sequence = await db.add(STORE, {
    ...entry,
    status: "pending",
    attempts: 0,
    lastError: null,
    createdAt: Date.now(),
  });
  return { ...entry, sequence };
}

export async function getAllOutbox() {
  const db = await getDb();
  return db.getAll(STORE);
}

async function getBySequenceFor(id) {
  const db = await getDb();
  return db.getFromIndex(STORE, "byId", id);
}

// Re-reads a single entry by its own id — used right before syncing it, since
// an earlier op in the same sync pass may have just rewritten this entry's
// payload (see resolveTempIdInOutbox) and a stale in-memory copy would still
// carry the unresolved temp id.
export async function getOutboxEntryById(id) {
  return getBySequenceFor(id);
}

export async function updateOutboxEntry(id, patch) {
  const db = await getDb();
  const existing = await getBySequenceFor(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await db.put(STORE, updated);
  return updated;
}

export async function removeFromOutbox(id) {
  const db = await getDb();
  const existing = await getBySequenceFor(id);
  if (!existing) return;
  await db.delete(STORE, existing.sequence);
}

// Folds an edit made before the original create ever synced into that
// create's own queued payload, instead of enqueuing a separate update op.
export async function mergeIntoCreateOp(entity, tempId, patch) {
  const db = await getDb();
  const all = await db.getAll(STORE);
  const createEntry = all.find((e) => e.entity === entity && e.op === "create" && e.tempId === tempId);
  if (!createEntry) return null;
  const updated = { ...createEntry, payload: { ...createEntry.payload, ...patch } };
  await db.put(STORE, updated);
  return updated;
}

// Drops the queued create (and any queued edits/deletes targeting the same
// not-yet-synced temp id) — used when a record is deleted before it ever synced.
export async function removeCreateOpAndDependents(entity, tempId) {
  const db = await getDb();
  const all = await db.getAll(STORE);
  const toRemove = all.filter(
    (e) => e.entity === entity && ((e.op === "create" && e.tempId === tempId) || e.targetId === tempId)
  );
  const tx = db.transaction(STORE, "readwrite");
  await Promise.all(toRemove.map((e) => tx.store.delete(e.sequence)));
  await tx.done;
  return toRemove.length;
}

function replaceTempId(value, tempId, realId) {
  if (value === tempId) return realId;
  if (Array.isArray(value)) return value.map((v) => (v === tempId ? realId : v));
  return value;
}

// Once a queued create resolves to a real id, any still-queued op that
// referenced the temp id (e.g. an expense create with categoryId set to an
// offline-created category's temp id) must be rewritten in place — the temp
// id won't be resolvable once the create that minted it leaves the outbox.
export async function resolveTempIdInOutbox(tempId, realId) {
  const db = await getDb();
  const all = await db.getAll(STORE);
  const tx = db.transaction(STORE, "readwrite");
  for (const entry of all) {
    let changed = false;
    const newPayload = {};
    for (const [key, value] of Object.entries(entry.payload || {})) {
      const replaced = replaceTempId(value, tempId, realId);
      newPayload[key] = replaced;
      if (replaced !== value) changed = true;
    }
    let newTargetId = entry.targetId;
    if (entry.targetId === tempId) {
      newTargetId = realId;
      changed = true;
    }
    if (changed) {
      await tx.store.put({ ...entry, payload: newPayload, targetId: newTargetId });
    }
  }
  await tx.done;
}
