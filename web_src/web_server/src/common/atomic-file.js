// Shared atomic file helpers with per-file in-process lock
import fs from 'fs';
import path from 'path';

const fsp = fs.promises;

// Per-path mutex (in-process)
const queues = new Map();
async function withLock(key, fn) {
  let q = queues.get(key);
  if (!q) { q = { busy: false, waiters: [] }; queues.set(key, q); }
  if (q.busy) await new Promise((resolve) => q.waiters.push(resolve));
  q.busy = true;
  try { return await fn(); } finally {
    q.busy = false;
    const next = q.waiters.shift();
    if (next) next();
  }
}

export async function readJson(filePath, defaultValue = null) {
  try {
    const txt = await fsp.readFile(filePath, 'utf8');
    try { return JSON.parse(txt); } catch { return defaultValue; }
  } catch (e) {
    if (e && e.code === 'ENOENT') return defaultValue;
    throw e;
  }
}

async function writeTextAtomic(filePath, data, { encoding = 'utf8', durable = false } = {}) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmp = path.join(dir, `${base}.tmp-${process.pid}-${Date.now()}`);
  await fsp.mkdir(dir, { recursive: true });
  const fh = await fsp.open(tmp, 'w');
  try {
    await fh.writeFile(data, { encoding });
    if (durable) await fh.datasync();
  } finally {
    await fh.close();
  }
  await fsp.rename(tmp, filePath);
  if (durable) {
    try {
      const dirfh = await fsp.open(dir, 'r');
      try { await dirfh.sync(); } finally { await dirfh.close(); }
    } catch {}
  }
}

// Overload: writeJsonAtomic(filePath, obj, opts?)
//           writeJsonAtomic(filePath, updaterFn, opts?) where updaterFn(draft)->result
export async function writeJsonAtomic(filePath, objOrUpdater, opts = {}) {
  if (typeof objOrUpdater === 'function') {
    // Read-modify-write under lock
    return withLock(filePath, async () => {
      const draft = (await readJson(filePath)) || {};
      const result = await objOrUpdater(draft);
      const data = JSON.stringify(draft, null, 2);
      await writeTextAtomic(filePath, data, opts);
      return result;
    });
  } else {
    // Direct atomic write (still under lock to serialize with updater case)
    return withLock(filePath, async () => {
      const data = typeof objOrUpdater === 'string' ? objOrUpdater : JSON.stringify(objOrUpdater, null, 2);
      await writeTextAtomic(filePath, data, opts);
      return true;
    });
  }
}