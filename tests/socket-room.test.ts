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
  it('Nikoo kembali dari hasil ke beranda lalu masuk balapan baru dengan nama sama', async () => {
    const client = connect(baseUrl, { transports: ['websocket'] });
    clients.push(client);
    let state: RoomState | undefined;
    const states: RoomState[] = [];
    client.on('room:state', (raw: unknown) => {
      state = roomStateSchema.parse(raw);
      states.push(state);
    });
    await new Promise<void>((resolve) => client.once('connect', resolve));
    const payload = { nickname: 'Nikoo', animalId: 'gajah', mode: 'bot' };
    client.emit('queue:join', payload);
    await waitFor(() => state?.phase === 'racing', 5000);
    const oldRoom = state!.roomId;
    for (let i = 0; i < 5; i++) {
      const question = content.verified.find((q) => q.stem === state!.activeQuestion?.stem)!;
      const answerIndex = state!.activeQuestion!.options.indexOf(
        question.options[question.answerIndex]!,
      );
      client.emit('race:answer', { questionIndex: i, choice: 'ABCD'[answerIndex] });
      await waitFor(() => state!.questionIndex === i + 1, 3000);
    }
    client.emit('room:leave');
    states.length = 0;
    client.emit('queue:join', payload);
    await waitFor(() => state?.phase === 'racing' && state.roomId !== oldRoom, 5000);
    await delay(1500);
    expect(states.every((s) => s.roomId !== oldRoom)).toBe(true);
    expect(state!.questionIndex).toBe(0);
    expect(state!.participants.find((p) => p.id === client.id)?.steps).toBe(0);
    client.close();
  }, 15000);
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

  it('quick match memancarkan status antrean saat pemain bergabung dan batal (FR-M05, FR-M07)', async () => {
    const c1 = connect(baseUrl, { transports: ['websocket'] });
    const c2 = connect(baseUrl, { transports: ['websocket'] });
    clients.push(c1, c2);

    const statuses1: { menungguS: number; ditemukan: number }[] = [];
    const statuses2: { menungguS: number; ditemukan: number }[] = [];
    c1.on('queue:status', (s: { menungguS: number; ditemukan: number }) => statuses1.push(s));
    c2.on('queue:status', (s: { menungguS: number; ditemukan: number }) => statuses2.push(s));

    await Promise.all([
      new Promise<void>((res) => c1.once('connect', () => res())),
      new Promise<void>((res) => c2.once('connect', () => res())),
    ]);

    c1.emit('queue:join', { nickname: 'PemainSatu', animalId: 'orangutan', mode: 'quick' });
    await waitFor(() => statuses1.length >= 1, 3000);
    expect(statuses1[statuses1.length - 1]!.ditemukan).toBe(1);

    c2.emit('queue:join', { nickname: 'PemainDua', animalId: 'harimau', mode: 'quick' });
    await waitFor(
      () => statuses1.some((s) => s.ditemukan === 2) && statuses2.some((s) => s.ditemukan === 2),
      3000,
    );
    expect(statuses1[statuses1.length - 1]!.ditemukan).toBe(2);
    expect(statuses2[statuses2.length - 1]!.ditemukan).toBe(2);

    // c2 batal antre
    c2.emit('queue:leave');
    await waitFor(() => statuses1[statuses1.length - 1]!.ditemukan === 1, 3000);
    expect(statuses1[statuses1.length - 1]!.ditemukan).toBe(1);

    c1.emit('queue:leave');
    c1.close();
    c2.close();
  }, 10_000);

  it('session:resume memulihkan balapan saat socket tersambung kembali (FR-B11)', async () => {
    const client1 = connect(baseUrl, { transports: ['websocket'] });
    clients.push(client1);

    await new Promise<void>((res) => client1.once('connect', () => res()));
    const publicId = client1.id!;
    let token = '';
    client1.on('session:token', (payload: { token: string }) => {
      token = payload.token;
    });

    let firstState: RoomState | null = null;
    client1.on('room:state', (raw: unknown) => {
      const parsed = roomStateSchema.safeParse(raw);
      if (parsed.success && parsed.data.phase === 'racing' && !firstState) {
        firstState = parsed.data;
      }
    });

    client1.emit('queue:join', { nickname: 'Pemulih', animalId: 'gajah', mode: 'bot' });
    await waitFor(() => firstState !== null, 10_000);
    const activeStem = firstState!.activeQuestion?.stem;
    expect(activeStem).toBeDefined();
    expect(token).not.toBe('');
    expect(token).not.toBe(publicId);
    expect(JSON.stringify(firstState)).not.toContain(token);

    // client1 putus koneksi
    client1.disconnect();

    // Sambung socket baru dalam 10 detik dan minta resume
    const client2 = connect(baseUrl, { transports: ['websocket'] });
    clients.push(client2);
    await new Promise<void>((res) => client2.once('connect', () => res()));

    let resumedState: RoomState | null = null;
    client2.on('room:state', (raw: unknown) => {
      const parsed = roomStateSchema.safeParse(raw);
      if (parsed.success) resumedState = parsed.data;
    });

    const rejected = new Promise<{ code: string }>((resolve) => client2.once('error', resolve));
    client2.emit('session:resume', { token: publicId });
    expect((await rejected).code).toBe('session-not-found');
    expect(resumedState).toBeNull();
    client2.emit('session:resume', { token });
    await waitFor(() => resumedState !== null, 5000);

    expect(resumedState!.phase).toBe('racing');
    expect(resumedState!.activeQuestion?.stem).toBe(activeStem);
    const me = resumedState!.participants.find((p) => p.id === client2.id);
    expect(me).toBeDefined();
    expect(me?.nickname).toBe('Pemulih');

    client2.close();
  }, 20_000);
});
