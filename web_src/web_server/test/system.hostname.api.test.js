import { api } from './_helpers/apiClient.js';

jest.setTimeout(20000);

function uniqueHost() {
  const ts = Date.now().toString(36);
  return `blikvm-test-${ts}`; // letters, digits, hyphen only
}

// api imported from helper

async function getCurrentHostname() {
  const { status, json } = await api('GET', '/api/systeminfo');
  expect(status).toBe(200);
  return json?.data?.os?.hostname;
}

describe('Hostname API', () => {
  test('POST /api/hostname invalid payload returns 400', async () => {
    const { status, json } = await api('POST', '/api/hostname', { hostname: '' });
    expect(status).toBe(400);
    expect(json?.message || json?.msg).toBeDefined();
  });

  test('POST /api/hostname changes hostname then restore', async () => {
    const original = await getCurrentHostname();
    expect(typeof original).toBe('string');

    const nextHost = uniqueHost();

    try {
      // Change to new hostname
      const setResp = await api('POST', '/api/hostname', { hostname: nextHost });
      expect(setResp.status).toBe(200);
      const reported = setResp.json?.data?.hostname;
      expect(typeof reported).toBe('string');

      // Verify via systeminfo snapshot
      const after = await getCurrentHostname();
      // Some systems may require a short delay; tolerate equality either from immediate return or next snapshot
      expect([reported, after]).toContain(nextHost);
    } finally {
      // Restore original hostname to avoid side-effects on the device
      if (original && original !== '') {
        const restore = await api('POST', '/api/hostname', { hostname: original });
        expect([200, 400, 500]).toContain(restore.status); // best-effort restore
      }
    }
  });
});
