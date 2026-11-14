import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runLoadTest } from '../scripts/load-test';
import { start } from '../src/server/index';
import { readContent } from '../src/server/content';
import { DUMMY_QUESTIONS } from '../scripts/dummy-questions';
import type { AddressInfo } from 'node:net';

describe('Uji Beban 5 Room Simultan (NFR-03, NFR-04)', () => {
  let server: ReturnType<typeof start>;
  let url = '';

  beforeAll(async () => {
    const content = { ...readContent(), verified: DUMMY_QUESTIONS };
    server = start(0, { content });
    const address = server.address() as AddressInfo;
    url = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    server?.close();
  });

  it('menjalankan 5 room × 4 peserta secara simultan dan latensi p95 memenuhi ambang batas NFR-04', async () => {
    const result = await runLoadTest({
      url,
      rooms: 5,
      playersPerRoom: 4,
      maxP95Ms: 250,
      silent: true,
    });

    expect(result.roomsCompleted).toBe(5);
    expect(result.totalConnections).toBe(20);
    expect(result.samples.length).toBeGreaterThanOrEqual(20);
    expect(result.p95).toBeLessThanOrEqual(250);
    expect(result.passed).toBe(true);
  }, 30_000);
});
