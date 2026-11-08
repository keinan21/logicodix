/**
 * src/server/index.ts — Express 5 + Socket.IO 4, SATU port (ARCHITECTURE §1, §9, §10).
 * Server menolak start bila content/ tidak lolos validasi (pesan menyebut ID soal + field).
 */

import express from 'express';
import { createServer, type Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { join } from 'node:path';
import { networkInterfaces } from 'node:os';
import { pathToFileURL } from 'node:url';
import { loadContent } from './content';
import { Matchmaking } from './matchmaking';
import { Room } from './room';
import { logEvent } from './log';
import { checkNickname } from './nickname';
import { joinQueuePayloadSchema, sessionResumePayloadSchema } from '../shared/schema';
import { createEvaluator, selectMode } from './evaluate';
import { createRNGSeed } from '../shared/rng';

const PORT = Number(process.env.PORT ?? 3000);
const DEBUG_PANEL = process.env.DEBUG_PANEL === 'true';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.get('/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });
  return app;
}

/** Mulai server. Melempar bila konten tidak valid (ARCHITECTURE §9). */
export function start(port = PORT): HttpServer {
  // Gate konten: server menolak start bila validasi gagal (FR-K01).
  const content = loadContent();
  logEvent(
    undefined,
    undefined,
    'server.start',
    undefined,
    'info',
    `konten termuat: ${content.verified.length} soal terverifikasi`,
  );

  const app = createApp();
  const server = createServer(app);
  const io = new SocketIOServer(server);

  // Evaluasi AI: pilih mode; live tanpa key → contoh otomatis (ARCHITECTURE §7).
  const { mode } = selectMode({
    AI_MODE: process.env.AI_MODE,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });
  const evaluate = createEvaluator({
    mode,
    geminiApiKey: process.env.GEMINI_API_KEY || undefined,
    geminiModel: process.env.GEMINI_MODEL || undefined,
    tips: content.tips,
    contoh: content.contoh,
  });

  // Seed debugging: SEED env mengunci acak semua room (ARCHITECTURE §9).
  const fixedSeed = process.env.SEED ? Number(process.env.SEED) : undefined;
  let seedCounter = fixedSeed ?? 1;

  const rooms = new Map<string, Room>();
  const roomBySocket = new Map<string, string>();

  const removeRoom = (roomId: string) => {
    rooms.delete(roomId);
    for (const [socketId, rid] of roomBySocket) {
      if (rid === roomId) roomBySocket.delete(socketId);
    }
  };

  const matchmaking = new Matchmaking((req) => {
    const roomId = `room-${seedCounter.toString(36)}-${Date.now().toString(36)}`;
    const seed = createRNGSeed(seedCounter++);
    const room = new Room({
      roomId,
      seed,
      humans: req.humanPlayers.map((p) => ({
        id: p.socketId,
        nickname: p.nickname,
        animalId: p.animalId,
      })),
      botCount: req.botCount,
      questions: content.verified,
      emit: (event, payload) => io.to(roomId).emit(event, payload),
      emitTo: (socketId, event, payload) => io.to(socketId).emit(event, payload),
      onEmpty: removeRoom,
      evaluator: (evalReq, roomSeed) => evaluate.evaluate(evalReq, roomSeed),
      now: () => Date.now(),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (t) => clearTimeout(t),
    });
    rooms.set(roomId, room);
    for (const h of req.humanPlayers) {
      roomBySocket.set(h.socketId, roomId);
      io.sockets.sockets.get(h.socketId)?.join(roomId);
    }
    room.start();
  });

  io.on('connection', (socket: Socket) => {
    logEvent(undefined, undefined, 'socket.connect', undefined, 'info', 'koneksi baru');

    socket.on('queue:join', (raw: unknown) => {
      const parsed = joinQueuePayloadSchema.safeParse(raw);
      if (!parsed.success) {
        socket.emit('error', { code: 'invalid-payload', pesan: 'Payload queue:join tidak valid.' });
        return;
      }
      // Filter kata kasar + format nickname di server (FR-M02, FR-M01)
      const checked = checkNickname(parsed.data.nickname);
      if (!checked.ok) {
        socket.emit('error', { code: 'nickname-invalid', pesan: checked.reason });
        return;
      }
      matchmaking.join(socket.id, { ...parsed.data, nickname: checked.nickname }, Date.now());
      socket.emit('queue:status', { menungguS: 0, ditemukan: 1 });
    });

    socket.on('queue:leave', () => {
      matchmaking.leave(socket.id, Date.now());
    });

    socket.on('race:answer', (raw: unknown) => {
      const roomId = roomBySocket.get(socket.id);
      if (!roomId) return;
      rooms.get(roomId)?.answer(socket.id, raw);
    });

    socket.on('session:resume', (raw: unknown) => {
      const parsed = sessionResumePayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      const roomId = roomBySocket.get(socket.id);
      if (roomId) rooms.get(roomId)?.resume(socket.id, parsed.data.token);
    });

    socket.on('disconnect', () => {
      const roomId = roomBySocket.get(socket.id);
      if (roomId) rooms.get(roomId)?.leave(socket.id);
    });
  });

  // Sajikan web build di port yang sama saat produksi (ARCHITECTURE §1, §10).
  app.use(express.static(join(process.cwd(), 'dist')));

  server.listen(port, () => {
    const localIp = getLocalIp();
    // eslint-disable-next-line no-console
    console.log(
      `Server di http://localhost:${port}${localIp ? ` — juga http://${localIp}:${port}` : ''}`,
    );
    if (DEBUG_PANEL) {
      logEvent(
        undefined,
        undefined,
        'server.debug',
        undefined,
        'info',
        'DEBUG_PANEL aktif: ?debug=1',
      );
    }
  });

  return server;
}

function getLocalIp(): string | null {
  const nets = networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const iface of list ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return null;
}

// Jalankan hanya bila file ini dieksekusi langsung (tsx src/server/index.ts), bukan saat diimpor tes.
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  start();
}
