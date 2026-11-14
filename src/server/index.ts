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
import { assertVerifiedMinimum, loadContent, type BankContent } from './content';
import { Matchmaking } from './matchmaking';
import { Room } from './room';
import { logEvent } from './log';
import { checkNickname } from './nickname';
import {
  joinQueuePayloadSchema,
  racePausePayloadSchema,
  sessionResumePayloadSchema,
} from '../shared/schema';
import { createEvaluator, selectMode } from './evaluate';
import { createRNGSeed } from '../shared/rng';
import type { Animal } from '../shared/schema';

const PORT = Number(process.env.PORT ?? 3000);
const DEBUG_PANEL = process.env.DEBUG_PANEL === 'true';

export function createApp(animals: Animal[] = []) {
  const app = express();
  app.use(express.json());
  app.get('/api/animals', (_req, res) => {
    res.json(animals);
  });
  app.get('/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });
  return app;
}

export interface StartOptions {
  /**
   * Bank soal pengganti. Dipakai scripts/e2e-server.ts supaya tes Playwright memakai fixture
   * sendiri tanpa mengubah content/. Gate FR-K01 tetap dijalankan untuk bank yang dipakai.
   */
  content?: BankContent;
}

/** Mulai server. Melempar bila konten tidak valid (ARCHITECTURE §9). */
export function start(port = PORT, options: StartOptions = {}): HttpServer {
  // Gate konten: server menolak start bila validasi gagal (FR-K01).
  const content = options.content ?? loadContent();
  assertVerifiedMinimum(content);
  logEvent(
    undefined,
    undefined,
    'server.start',
    undefined,
    'info',
    `konten termuat: ${content.verified.length} soal terverifikasi`,
  );

  const app = createApp(content.animals);
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
  let seedCounter = fixedSeed ?? Date.now() >>> 0;

  const rooms = new Map<string, Room>();
  const roomBySocket = new Map<string, string>();

  const removeRoom = (roomId: string) => {
    rooms.delete(roomId);
    for (const [socketId, rid] of roomBySocket) {
      if (rid === roomId) roomBySocket.delete(socketId);
    }
  };

  const matchmaking = new Matchmaking(
    (req) => {
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
    },
    (socketId, status) => {
      io.to(socketId).emit('queue:status', status);
    },
  );

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
      // Satu socket hanya boleh berada di SATU room. Tanpa ini, join ganda (klik dobel atau
      // dua tab) membuat dua room berjalan paralel dan client menerima dua aliran room:state:
      // soal berganti sendiri dan langkah peserta tampak tertukar.
      const previousRoomId = roomBySocket.get(socket.id);
      if (previousRoomId !== undefined) {
        rooms.get(previousRoomId)?.leave(socket.id);
        socket.leave(previousRoomId);
        roomBySocket.delete(socket.id);
      }
      matchmaking.join(socket.id, { ...parsed.data, nickname: checked.nickname }, Date.now());
    });

    socket.on('queue:leave', () => {
      matchmaking.leave(socket.id, Date.now());
    });

    socket.on('race:answer', (raw: unknown) => {
      const roomId = roomBySocket.get(socket.id);
      if (!roomId) return;
      rooms.get(roomId)?.answer(socket.id, raw);
    });

    socket.on('race:pause', (raw: unknown) => {
      const parsed = racePausePayloadSchema.safeParse(raw);
      const roomId = roomBySocket.get(socket.id);
      if (!parsed.success || !roomId) return;
      rooms.get(roomId)?.setPaused(socket.id, parsed.data.paused);
    });

    socket.on('room:leave', () => {
      const roomId = roomBySocket.get(socket.id);
      if (!roomId) return;
      rooms.get(roomId)?.quit(socket.id);
      socket.leave(roomId);
      roomBySocket.delete(socket.id);
    });

    socket.on('session:resume', (raw: unknown) => {
      const parsed = sessionResumePayloadSchema.safeParse(raw);
      if (!parsed.success) {
        socket.emit('error', { code: 'invalid-payload', pesan: 'Payload resume tidak valid.' });
        return;
      }
      const token = parsed.data.token;
      let targetRoom: Room | undefined;
      let targetRoomId: string | undefined;
      for (const [rid, r] of rooms) {
        if (r.hasParticipant(token)) {
          targetRoom = r;
          targetRoomId = rid;
          break;
        }
      }
      if (!targetRoom || !targetRoomId) {
        socket.emit('error', { code: 'session-not-found', pesan: 'Sesi balapan tidak ditemukan.' });
        return;
      }
      const ok = targetRoom.resume(socket.id, token);
      if (ok) {
        roomBySocket.set(socket.id, targetRoomId);
        socket.join(targetRoomId);
      } else {
        socket.emit('error', {
          code: 'resume-expired',
          pesan: 'Batas waktu reconnect telah habis.',
        });
      }
    });

    socket.on('disconnect', () => {
      matchmaking.leave(socket.id, Date.now());
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

  let closing = false;
  const originalClose = server.close.bind(server);
  server.close = function (cb?: (err?: Error) => void) {
    if (closing) return originalClose(cb);
    closing = true;
    matchmaking.shutdown();
    for (const room of rooms.values()) {
      room.destroy();
    }
    rooms.clear();
    io.disconnectSockets(true);
    if (typeof (server as any).closeAllConnections === 'function') {
      (server as any).closeAllConnections();
    }
    return originalClose(cb);
  };

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
