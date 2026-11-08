/**
 * scripts/load-test.ts — beban 5 room × 4 peserta (NFR-03, NFR-04).
 * Mencetak latensi p95 room:state. Jalankan saat server aktif: bun run load
 */

import { io, type Socket } from 'socket.io-client';

const URL = process.env.LOAD_URL ?? 'http://localhost:3000';
const ROOMS = 5;
const BOTS_PER_ROOM = 4; // mode bot: 1 manusia + 3 bot, tetapi kita simulasi 4 koneksi

interface LatencySample {
  room: number;
  ms: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx]!;
}

async function runRoom(roomIdx: number): Promise<LatencySample[]> {
  const samples: LatencySample[] = [];
  const sockets: Socket[] = [];

  for (let i = 0; i < BOTS_PER_ROOM; i++) {
    const socket = io(URL, { transports: ['websocket'] });
    sockets.push(socket);

    await new Promise<void>((resolve) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', () => resolve());
    });

    const t0 = Date.now();
    await new Promise<void>((resolve) => {
      socket.once('room:state', () => {
        samples.push({ room: roomIdx, ms: Date.now() - t0 });
        resolve();
      });
      socket.emit('queue:join', {
        nickname: `Load${roomIdx}_${i}`,
        animalId: 'orangutan',
        mode: 'bot',
      });
      // Beri waktu; bila tidak ada respons, sampel diabaikan.
      setTimeout(resolve, 3000);
    });
  }

  for (const s of sockets) s.disconnect();
  return samples;
}

async function main(): Promise<void> {
  const all: LatencySample[] = [];
  for (let r = 0; r < ROOMS; r++) {
    // TODO(T-20): jalankan room paralel dengan controlled concurrency; ukur juga latensi race:feedback.
    const samples = await runRoom(r);
    all.push(...samples);
  }

  const latencies = all.map((s) => s.ms).sort((a, b) => a - b);
  console.log(
    `sampel: ${latencies.length}, p50: ${percentile(latencies, 50)}ms, p95: ${percentile(latencies, 95)}ms`,
  );
  console.log('TODO(T-20): catat hasil di README + tambahkan assert ambang NFR-04.');
}

main().catch((err) => {
  console.error('load-test gagal:', err);
  process.exit(1);
});
