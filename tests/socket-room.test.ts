import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { io as connect, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readContent } from '../src/server/content';
import { start } from '../src/server/index';
import { DUMMY_QUESTIONS } from '../scripts/dummy-questions';
import { roomStateSchema, type RoomState } from '../src/shared/schema';

/**
 * Regresi bug "soal berganti sendiri / langkah tertukar": satu socket yang mengirim
 * `queue:join` dua kali (klik dobel, dua tab) membuat dua room berjalan paralel, dan client
 * menerima dua aliran room:state yang saling menimpa.
 *
 * Tes ini menjalankan server sungguhan di port acak dan memastikan satu socket hanya
 * menerima state dari satu room.
 */

const content = { ...readContent(), verified: DUMMY_QUESTIONS };

let server: ReturnType<typeof start> | null = null;
let baseUrl = '';
const clients: ClientSocket[] = [];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(cond: () => boolean, ms: number): Promise<void> {
  const deadline = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > deadline) throw new Error('menunggu kondisi melebihi batas waktu');
    await delay(50);
  }
}

beforeAll(async () => {
  server = start(0, { content });
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  for (const client of clients) client.close();
  await delay(100);
  server?.close();
});

describe('satu socket satu room (regresi tampilan soal tertukar)', () => {
  it('queue:join ganda tidak membuat dua room berjalan paralel', async () => {
    const client = connect(baseUrl, { transports: ['websocket'] });
    clients.push(client);
    const states: RoomState[] = [];
    client.on('room:state', (raw: unknown) => {
      const parsed = roomStateSchema.safeParse(raw);
      if (parsed.success) states.push(parsed.data);
    });

    await new Promise<void>((resolve) => client.once('connect', () => resolve()));
    const payload = { nickname: 'Raka', animalId: 'harimau', mode: 'bot' };
    client.emit('queue:join', payload);
    client.emit('queue:join', payload);

    await waitFor(() => states.some((s) => s.phase === 'racing'), 10_000);
    // Beri waktu room lama (kalau ada) untuk mengirim state sisa.
    await delay(1200);

    const racing = states.filter((s) => s.phase === 'racing');
    expect(racing.length).toBeGreaterThan(0);
    // Satu room saja: tidak ada dua bank soal yang bergantian.
    expect(new Set(racing.map((s) => s.roomId)).size).toBe(1);
    // Tanpa menjawab, soal dan indeks tidak boleh berubah sendiri.
    expect(new Set(racing.map((s) => s.questionIndex)).size).toBe(1);
    expect(new Set(racing.map((s) => s.activeQuestion?.stem)).size).toBe(1);

    client.close();
  }, 20_000);
});
