import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, it } from 'vitest';
import { createApp } from '../src/server/index';
import { readContent } from '../src/server/content';

it('GET /api/animals menyajikan content/animals.json (FR-M14)', async () => {
  const { animals } = readContent();
  const server = createServer(createApp(animals)).listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/animals`);
    const body = (await res.json()) as { id: string; fakta: string }[];
    expect(body).toHaveLength(6);
    expect(body.every((a) => a.fakta.length > 0)).toBe(true);
  } finally {
    server.close();
  }
});
