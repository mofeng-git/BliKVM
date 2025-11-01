import { readJson, writeJsonAtomic } from '../../common/atomic-file.js';
import { createApiObj, ApiCode } from '../../common/api.js';
import ShortcutsConfigUpdate from '../../modules/update/shortcuts_update.js';
import { UTF8, SHORTCUTS_PATH } from '../../common/constants.js';
import { isValidKeyCode } from '../../common/keycodes.js';
// Compute config path relative to project root (web_server/)
// Avoid import.meta for Jest compatibility

const TargetOS = {
  WINDOWS: 'windows',
  MACOS: 'macos',
  LINUX: 'linux',
  ANDROID: 'android',
  IOS: 'ios',
};

// ---------- Shared atomic utils ----------
const loadData = async () => (await readJson(SHORTCUTS_PATH)) || { shortcuts: {} };

function normalizeOS(os) {
  const v = String(os || '').toLowerCase();
  if (v in TargetOS) return v;
  // allow direct 'windows'/'macos'/...
  if (Object.values(TargetOS).includes(v)) return v;
  return null;
}

// GET /api/shortcuts/:targetOS
async function getShortcuts(req, res, next) {
  try {
    const os = normalizeOS(req.params.targetOS);
    if (!os) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = 'Invalid targetOS';
      return res.status(400).json(ret);
    }
    const db = await loadData();
    const items = Object.entries(db.shortcuts[os] || {}).map(([name, keys]) => ({ name, keys }));
    const ret = createApiObj();
    ret.code = ApiCode.OK;
    ret.data = { items, targetOS: os };
    res.json(ret);
  } catch (e) { next(e); }
}

// POST /api/shortcuts/:targetOS
async function createShortcut(req, res, next) {
  try {
    const os = normalizeOS(req.params.targetOS);
    if (!os) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = 'Invalid targetOS';
      return res.status(400).json(ret);
    }
    const { name, keys } = req.body || {};
    if (!name || !Array.isArray(keys) || !keys.length) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = 'Invalid payload';
      return res.status(400).json(ret);
    }
    // Validate each key is in whitelist
    const invalid = keys.some((k) => !isValidKeyCode(k));
    if (invalid) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = 'Invalid payload: keys contains unsupported key code';
      return res.status(400).json(ret);
    }
    const result = await writeJsonAtomic(SHORTCUTS_PATH, (db) => {
      db.shortcuts = db.shortcuts || {};
      db.shortcuts[os] = db.shortcuts[os] || {};
      if (db.shortcuts[os][name]) return { conflict: true };
      db.shortcuts[os][name] = keys;
      return { ok: true };
    });
    if (result.conflict) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = `Shortcut "${name}" already exists`;
      return res.status(400).json(ret);
    }
    const ret = createApiObj();
    ret.code = ApiCode.OK;
    ret.data = { name, keys };
    res.status(201).json(ret);
  } catch (e) { next(e); }
}

// PATCH /api/shortcuts/:targetOS/:name
async function updateShortcut(req, res, next) {
  try {
    const os = normalizeOS(req.params.targetOS);
    const name = req.params.name;
    if (!os || !name) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = 'Invalid params';
      return res.status(400).json(ret);
    }
    const { newName, keys } = req.body || {};
    if (Array.isArray(keys) && keys.length) {
      const invalid = keys.some((k) => !isValidKeyCode(k));
      if (invalid) {
        const ret = createApiObj();
        ret.code = ApiCode.INVALID_INPUT_PARAM;
        ret.msg = 'Invalid payload: keys contains unsupported key code';
        return res.status(400).json(ret);
      }
    }

    const result = await writeJsonAtomic(SHORTCUTS_PATH, (db) => {
      db.shortcuts = db.shortcuts || {};
      const bucket = db.shortcuts[os] || {};
      if (!bucket[name]) return { notFound: true };
      let finalName = name;
      if (newName && newName !== name) {
        if (bucket[newName]) return { conflict: true };
        bucket[newName] = bucket[name];
        delete bucket[name];
        finalName = newName;
      }
      if (Array.isArray(keys) && keys.length) {
        bucket[finalName] = keys;
      }
      db.shortcuts[os] = bucket;
      return { ok: true, finalName, keys: bucket[finalName] };
    });

    

    if (result.notFound) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = `Shortcut "${name}" not found`;
      return res.status(404).json(ret);
    }
    if (result.conflict) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = `Shortcut "${req.body?.newName}" already exists`;
      return res.status(400).json(ret);
    }
    const ret = createApiObj();
    ret.code = ApiCode.OK;
    ret.data = { name: result.finalName, keys: result.keys };
    res.json(ret);
  } catch (e) { next(e); }
}

// DELETE /api/shortcuts/:targetOS/:name
async function deleteShortcut(req, res, next) {
  try {
    const os = normalizeOS(req.params.targetOS);
    const name = req.params.name;
    if (!os || !name) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = 'Invalid params';
      return res.status(400).json(ret);
    }

    const result = await writeJsonAtomic(SHORTCUTS_PATH, (db) => {
      db.shortcuts = db.shortcuts || {};
      const bucket = db.shortcuts[os] || {};
      if (!bucket[name]) return { notFound: true };
      delete bucket[name];
      db.shortcuts[os] = bucket;
      return { ok: true };
    });

    if (result.notFound) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = `Shortcut "${name}" not found`;
      return res.status(404).json(ret);
    }
    const ret = createApiObj();
    ret.code = ApiCode.OK;
    ret.data = { message: 'Shortcut deleted successfully' };
    res.json(ret);
  } catch (e) { next(e); }
}

// POST /api/shortcuts/:targetOS/reset
async function resetShortcuts(req, res, next) {
  try {
    const os = normalizeOS(req.params.targetOS);
    if (!os) {
      const ret = createApiObj();
      ret.code = ApiCode.INVALID_INPUT_PARAM;
      ret.msg = 'Invalid targetOS';
      return res.status(400).json(ret);
    }
    // Source defaults from ShortcutsConfigUpdate to ensure a single truth
    const updater = new ShortcutsConfigUpdate();
    const defaults = updater._defaultConfig || { shortcuts: {} };
    const base = defaults.shortcuts && defaults.shortcuts[os] ? defaults.shortcuts[os] : {};

    await writeJsonAtomic(SHORTCUTS_PATH, (db) => {
      db.shortcuts = db.shortcuts || {};
      db.shortcuts[os] = base;
    });

  const items = Object.entries(base).map(([name, keys]) => ({ name, keys }));
  const ret = createApiObj();
  ret.code = ApiCode.OK;
  ret.data = { message: 'Reset to default shortcuts', items };
  res.json(ret);
  } catch (e) { next(e); }
}

export { getShortcuts, createShortcut, updateShortcut, deleteShortcut, resetShortcuts, TargetOS };
