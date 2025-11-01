import ShortcutsConfigUpdate from '../src/modules/update/shortcuts_update.js';
import { api } from './_helpers/apiClient.js';

function uniqueName(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
}


// 无需 beforeAll 校验，已内置默认 baseURL

function expectNoWarning(items) {
  for (const it of items) {
    expect(it).not.toHaveProperty('warning');
  }
}

function toItemArrayFromMap(mapObj) {
  return Object.entries(mapObj || {}).map(([name, keys]) => ({ name, keys }));
}

function sortItems(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

test('GET /api/shortcuts/:targetOS returns items without warning', async () => {
  const { status, json } = await api('GET', '/api/shortcuts/windows');
  expect(status).toBe(200);
  expect(json?.data?.items).toBeDefined();
  expectNoWarning(json.data.items);
  const names = json.data.items.map(x => x.name);
  expect(names.length).toBeGreaterThan(0);
});

test('POST createShortcut then GET shows new item and no warning', async () => {
  const name = uniqueName('MyTest');
  const create = await api('POST', '/api/shortcuts/windows', { name, keys: ['ControlLeft','AltLeft','KeyM'] });
  expect(create.status).toBe(201);
  expect(create.json?.data?.name).toBe(name);
  expect(create.json?.data?.keys).toEqual(['ControlLeft','AltLeft','KeyM']);

  const get = await api('GET', '/api/shortcuts/windows');
  const items = get.json.data.items;
  expect(items.some(x => x.name === name)).toBe(true);
  expectNoWarning(items);
});

test('POST duplicate shortcut returns 400', async () => {
  const name = uniqueName('DupTest');
  await api('POST', '/api/shortcuts/windows', { name, keys: ['KeyA'] });
  const dup = await api('POST', '/api/shortcuts/windows', { name, keys: ['KeyB'] });
  expect(dup.status).toBe(400);
});

test('PATCH updateShortcut can rename and change keys', async () => {
  const oldName = uniqueName('OldName');
  const newName = uniqueName('NewName');
  await api('POST', '/api/shortcuts/windows', { name: oldName, keys: ['KeyX'] });

  const upd = await api('PATCH', `/api/shortcuts/windows/${encodeURIComponent(oldName)}`, { newName, keys: ['ControlLeft','KeyN'] });
  expect(upd.status).toBe(200);
  expect(upd.json?.data?.name).toBe(newName);
  expect(upd.json?.data?.keys).toEqual(['ControlLeft','KeyN']);

  const get = await api('GET', '/api/shortcuts/windows');
  const items = get.json.data.items;
  expect(items.some(x => x.name === newName)).toBe(true);
  expect(items.some(x => x.name === oldName)).toBe(false);
  expectNoWarning(items);
});

test('DELETE deleteShortcut removes item', async () => {
  const name = uniqueName('ToDelete');
  await api('POST', '/api/shortcuts/windows', { name, keys: ['KeyD'] });
  const del = await api('DELETE', `/api/shortcuts/windows/${encodeURIComponent(name)}`);
  expect(del.status).toBe(200);

  const get = await api('GET', '/api/shortcuts/windows');
  const names = get.json.data.items.map(x => x.name);
  expect(names.includes(name)).toBe(false);
});

test('POST resetShortcuts returns factory defaults from ShortcutsConfigUpdate after modifications', async () => {
  // 1) Load factory defaults via updater（本地仅用于计算期望值）
  const updater = new ShortcutsConfigUpdate();
  const defaults = updater._defaultConfig;
  expect(defaults).toBeDefined();
  const expectedItems = toItemArrayFromMap(defaults.shortcuts.windows);

  // 2) Add a temporary custom shortcut to windows
  const tempName = uniqueName('TmpCustom');
  const tempKeys = ['ControlLeft', 'AltLeft', 'KeyZ'];
  const created = await api('POST', '/api/shortcuts/windows', { name: tempName, keys: tempKeys });
  expect(created.status).toBe(201);

  // Sanity: it appears in GET
  const get1 = await api('GET', '/api/shortcuts/windows');
  const hasTmp = get1.json.data.items.some(x => x.name === tempName);
  expect(hasTmp).toBe(true);

  // 3) Reset and compare with factory defaults (order-insensitive)
  const reset = await api('POST', '/api/shortcuts/windows/reset');
  expect(reset.status).toBe(200);
  const resetItems = reset.json?.data?.items || [];
  expect(resetItems.length).toBeGreaterThan(0);
  expectNoWarning(resetItems);

  const a = sortItems(resetItems);
  const b = sortItems(expectedItems);
  expect(a).toEqual(b);

  // 4) GET again should reflect defaults persisted by reset
  const getAfter = await api('GET', '/api/shortcuts/windows');
  const itemsAfter = getAfter.json?.data?.items || [];
  expect(sortItems(itemsAfter)).toEqual(b);
});
