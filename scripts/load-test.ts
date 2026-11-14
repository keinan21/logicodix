/**
 * scripts/load-test.ts — uji beban 5 room × 4 peserta secara simultan (NFR-03, NFR-04).
 * Mengukur latensi p95 room:state dan race:feedback.
 *
 * Jalankan:
 *   bun run load
 * atau dengan variabel env:
 *   LOAD_URL=http://localhost:3000 LOAD_ROOMS=5 LOAD_MAX_P95_MS=200 bun run load
 */

import { io, type Socket } from 'socket.io-client';
import { pathToFileURL } from 'node:url';
import type { AddressInfo } from 'node:net';
import { start } from '../src/server/index';
import { readContent } from '../src/server/content';
import { DUMMY_QUESTIONS } from './dummy-questions';
import type { RoomState } from '../src/shared/schema';

export interface LoadTestOptions {
  url?: string;
  rooms?: number;
  playersPerRoom?: number;
  maxP95Ms?: number;
  timeoutMs?: number;
  silent?: boolean;
}

export interface LatencyMetric {
  type: 'state' | 'feedback';
  ms: number;
  socketIdx: number;
}

export interface LoadTestResult {
  roomsCompleted: number;
  totalConnections: number;
  samples: LatencyMetric[];
  stateLatencies: number[];
  feedbackLatencies: number[];
  p50: number;
  p95: number;
  p99: number;
  max: number;
  passed: boolean;
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx]!;
}

async function isServerRunning(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function runLoadTest(options: LoadTestOptions = {}): Promise<LoadTestResult> {
  const rooms = options.rooms ?? Number(process.env.LOAD_ROOMS ?? 5);
  const playersPerRoom = options.playersPerRoom ?? Number(process.env.LOAD_PLAYERS_PER_ROOM ?? 4);
  const maxP95Ms = options.maxP95Ms ?? Number(process.env.LOAD_MAX_P95_MS ?? 250);
  const timeoutMs = options.timeoutMs ?? 15_000;
  const silent = options.silent ?? false;
  let targetUrl = options.url ?? process.env.LOAD_URL ?? 'http://localhost:3000';

  let embeddedServer: ReturnType<typeof start> | null = null;
  if (!(await isServerRunning(targetUrl))) {
    if (!silent) {
      console.log(`Server di ${targetUrl} belum aktif. Menjalankan server uji internal...`);
    }
    const content = { ...readContent(), verified: DUMMY_QUESTIONS };
    embeddedServer = start(0, { content });
    const address = embeddedServer.address() as AddressInfo;
    targetUrl = `http://127.0.0.1:${address.port}`;
  }

  const totalSockets = rooms * playersPerRoom;
  const sockets: Socket[] = [];
  const samples: LatencyMetric[] = [];
  const stateLatencies: number[] = [];
  const feedbackLatencies: number[] = [];
  const detectedRooms = new Set<string>();

  try {
    // 1. Sambungkan seluruh socket secara bersamaan (koneksi simultan)
    for (let i = 0; i < totalSockets; i++) {
      const s = io(targetUrl, { transports: ['websocket'] });
      sockets.push(s);
    }

    await Promise.all(
      sockets.map(
        (s) =>
          new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Koneksi socket timeout')), 5000);
            s.once('connect', () => {
              clearTimeout(timer);
              resolve();
            });
            s.once('connect_error', (err) => {
              clearTimeout(timer);
              reject(err);
            });
          }),
      ),
    );

    if (!silent) {
      console.log(
        `[load-test] ${totalSockets} koneksi terhubung simultan ke ${targetUrl} (target: ${rooms} room)`,
      );
    }

    // 2. Siapkan listener dan ukur latensi room:state serta race:feedback
    const completedFeedbacks: Promise<void>[] = [];

    sockets.forEach((s, idx) => {
      let answered = false;
      const tJoin = Date.now();

      s.once('room:state', (st: RoomState) => {
        const ms = Date.now() - tJoin;
        samples.push({ type: 'state', ms, socketIdx: idx });
        stateLatencies.push(ms);
        detectedRooms.add(st.roomId);
      });

      const feedbackPromise = new Promise<void>((resolve) => {
        s.on('room:state', (st: RoomState) => {
          if (st.phase === 'racing' && st.activeQuestion && !answered) {
            answered = true;
            const tAnswer = Date.now();
            s.once('race:feedback', () => {
              const ms = Date.now() - tAnswer;
              samples.push({ type: 'feedback', ms, socketIdx: idx });
              feedbackLatencies.push(ms);
              resolve();
            });
            s.emit('race:answer', { questionIndex: st.questionIndex, choice: 'A' });
          }
        });
        // Batas tunggu feedback per socket
        setTimeout(resolve, timeoutMs - 2000);
      });

      completedFeedbacks.push(feedbackPromise);
    });

    // 3. Masukkan semua pemain ke antrean quick match secara serentak
    sockets.forEach((s, idx) => {
      s.emit('queue:join', {
        nickname: `Load${idx}`,
        animalId: 'orangutan',
        mode: 'quick',
      });
    });

    // 4. Tunggu balapan dan respons feedback
    await Promise.all(completedFeedbacks);
  } finally {
    for (const s of sockets) {
      s.removeAllListeners();
      s.disconnect();
    }
    if (embeddedServer) {
      embeddedServer.close();
    }
  }

  const allMs = samples.map((s) => s.ms).sort((a, b) => a - b);
  stateLatencies.sort((a, b) => a - b);
  feedbackLatencies.sort((a, b) => a - b);

  const p50 = percentile(allMs, 50);
  const p95 = percentile(allMs, 95);
  const p99 = percentile(allMs, 99);
  const max = allMs.length > 0 ? allMs[allMs.length - 1]! : 0;
  const passed = p95 <= maxP95Ms && detectedRooms.size >= rooms;

  if (!silent) {
    console.log('\n--- HASIL UJI BEBAN (NFR-03, NFR-04) ---');
    console.log(`Room selesai: ${detectedRooms.size} / ${rooms}`);
    console.log(`Koneksi aktif: ${totalSockets} (${playersPerRoom} per room)`);
    console.log(`Total sampel latensi: ${samples.length}`);
    console.log(
      `room:state    -> sampel: ${stateLatencies.length}, p50: ${percentile(stateLatencies, 50)}ms, p95: ${percentile(stateLatencies, 95)}ms`,
    );
    console.log(
      `race:feedback -> sampel: ${feedbackLatencies.length}, p50: ${percentile(feedbackLatencies, 50)}ms, p95: ${percentile(feedbackLatencies, 95)}ms`,
    );
    console.log(
      `Keseluruhan   -> p50: ${p50}ms, p95: ${p95}ms, p99: ${p99}ms, max: ${max}ms (ambang p95: ${maxP95Ms}ms)`,
    );
    console.log(`Status        -> ${passed ? 'LULUS (PASS)' : 'GAGAL (FAIL)'}`);
    console.log('----------------------------------------\n');
  }

  return {
    roomsCompleted: detectedRooms.size,
    totalConnections: totalSockets,
    samples,
    stateLatencies,
    feedbackLatencies,
    p50,
    p95,
    p99,
    max,
    passed,
  };
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  runLoadTest()
    .then((result) => {
      if (!result.passed) {
        console.error(
          `Uji beban gagal: p95 (${result.p95}ms) melebihi ambang batas atau room kurang.`,
        );
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Uji beban error:', err);
      process.exit(1);
    });
}
