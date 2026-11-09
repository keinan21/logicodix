import { useSyncExternalStore } from 'react';
import { io, type Socket } from 'socket.io-client';
import { z } from 'zod';
import {
  evalReadySchema,
  raceEndSchema,
  raceFeedbackSchema,
  roomStateSchema,
} from '../shared/schema';
import type {
  EvalReady,
  JoinQueuePayload,
  RaceAnswerPayload,
  RaceEnd,
  RaceFeedback,
  RoomState,
} from '../shared/schema';

/**
 * socket.ts — satu koneksi, satu store, satu hook useRoom() (ARCHITECTURE §3, §4).
 * Client HANYA menampilkan state dari server; tidak pernah menyimpan kunci.
 *
 * Semua event S→C masuk ke reducer murni `sessionReducer` supaya bisa dites tanpa socket
 * (AGENTS §3: tulis tes untuk perilaku baru).
 */

export type ClientScreen = 'home' | 'queue' | 'lobby' | 'race' | 'podium' | 'evaluation';

export interface SessionError {
  code: string;
  pesan: string;
}

export interface RoomSession {
  /** State room dari server; null = belum/tidak di room. */
  state: RoomState | null;
  /** Feedback jawaban terakhir (kunci hanya ada di sini, bukan di state — FR-K11). */
  feedback: RaceFeedback | null;
  /** Waktu client saat feedback diterima; dipakai layar untuk masa tahan tampilan. */
  feedbackAtMs: number | null;
  raceEnd: RaceEnd | null;
  /** Peringkat sementara setelah pemain ini selesai menjawab (balapan masih berjalan). */
  standings: RaceEnd | null;
  evaluation: EvalReady | null;
  /** Pesan `error` dari server (nickname ditolak, payload tidak valid, dll). */
  error: SessionError | null;
  /** Jumlah pemain yang sudah ditemukan menurut server (FR-M05). */
  waitingS: number;
  found: number;
  connected: boolean;
  everConnected: boolean;
  /** ID socket saat ini = id peserta di room:state. */
  myId: string | null;
}

export const initialSession: RoomSession = {
  state: null,
  feedback: null,
  feedbackAtMs: null,
  raceEnd: null,
  standings: null,
  evaluation: null,
  error: null,
  waitingS: 0,
  found: 0,
  connected: false,
  everConnected: false,
  myId: null,
};

export type SessionEvent =
  | { type: 'connection'; connected: boolean; myId: string | null }
  | { type: 'state'; state: RoomState }
  | { type: 'feedback'; feedback: RaceFeedback; atMs: number }
  | { type: 'race-end'; raceEnd: RaceEnd }
  | { type: 'standings'; standings: RaceEnd }
  | { type: 'evaluation'; evaluation: EvalReady }
  | { type: 'error'; error: SessionError }
  | { type: 'queue-status'; waitingS: number; found: number }
  | { type: 'reset' };

/**
 * Reducer event socket. Murni: tanpa socket, tanpa jam, tanpa acak.
 * `state` dari room baru menghapus sisa balapan sebelumnya.
 */
export function sessionReducer(session: RoomSession, event: SessionEvent): RoomSession {
  switch (event.type) {
    case 'connection':
      return {
        ...session,
        connected: event.connected,
        everConnected: session.everConnected || event.connected,
        myId: event.myId,
      };
    case 'state': {
      const newRoom = session.state !== null && session.state.roomId !== event.state.roomId;
      if (!newRoom) return { ...session, state: event.state, error: null };
      return {
        ...session,
        state: event.state,
        feedback: null,
        feedbackAtMs: null,
        raceEnd: null,
        standings: null,
        evaluation: null,
        error: null,
      };
    }
    case 'feedback':
      return { ...session, feedback: event.feedback, feedbackAtMs: event.atMs };
    case 'race-end':
      return { ...session, raceEnd: event.raceEnd, standings: event.raceEnd };
    case 'standings':
      return { ...session, standings: event.standings };
    case 'evaluation':
      return { ...session, evaluation: event.evaluation };
    case 'error':
      return { ...session, error: event.error };
    case 'queue-status':
      return { ...session, waitingS: event.waitingS, found: event.found };
    case 'reset':
      // Koneksi tetap hidup; hanya data room yang dibuang (FR-H13 "Main lagi").
      return {
        ...initialSession,
        connected: session.connected,
        everConnected: session.everConnected,
        myId: session.myId,
      };
    default:
      return session;
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let session: RoomSession = initialSession;
const listeners = new Set<() => void>();

function dispatch(event: SessionEvent): void {
  session = sessionReducer(session, event);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureSocket();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): RoomSession {
  return session;
}

/** `queue:status` belum punya skema di shared/schema.ts; validasi minimal di sisi client. */
const queueStatusSchema = z.object({
  menungguS: z.number().int().min(0),
  ditemukan: z.number().int().min(0),
});

const errorPayloadSchema = z.object({
  code: z.string(),
  pesan: z.string(),
});

let socketInstance: Socket | null = null;

function ensureSocket(): Socket {
  if (socketInstance) return socketInstance;
  // Sama-origin: server menyajikan web + socket di satu port (ARCHITECTURE §1).
  const socket = io({ autoConnect: true, reconnection: true });
  socketInstance = socket;

  socket.on('connect', () => {
    dispatch({ type: 'connection', connected: true, myId: socket.id ?? null });
  });
  socket.on('disconnect', () => {
    dispatch({ type: 'connection', connected: false, myId: null });
  });
  socket.on('connect_error', () => {
    dispatch({ type: 'connection', connected: false, myId: null });
  });

  socket.on('room:state', (raw: unknown) => {
    const parsed = roomStateSchema.safeParse(raw);
    if (parsed.success) dispatch({ type: 'state', state: parsed.data });
  });
  socket.on('race:feedback', (raw: unknown) => {
    const parsed = raceFeedbackSchema.safeParse(raw);
    if (parsed.success) {
      dispatch({ type: 'feedback', feedback: parsed.data, atMs: Date.now() });
    }
  });
  socket.on('race:end', (raw: unknown) => {
    const parsed = raceEndSchema.safeParse(raw);
    if (parsed.success) dispatch({ type: 'race-end', raceEnd: parsed.data });
  });
  socket.on('race:standings', (raw: unknown) => {
    const parsed = raceEndSchema.safeParse(raw);
    if (parsed.success) dispatch({ type: 'standings', standings: parsed.data });
  });
  socket.on('eval:ready', (raw: unknown) => {
    const parsed = evalReadySchema.safeParse(raw);
    if (parsed.success) dispatch({ type: 'evaluation', evaluation: parsed.data });
  });
  socket.on('queue:status', (raw: unknown) => {
    const parsed = queueStatusSchema.safeParse(raw);
    if (parsed.success) {
      dispatch({
        type: 'queue-status',
        waitingS: parsed.data.menungguS,
        found: parsed.data.ditemukan,
      });
    }
  });
  socket.on('error', (raw: unknown) => {
    const parsed = errorPayloadSchema.safeParse(raw);
    if (parsed.success) dispatch({ type: 'error', error: parsed.data });
  });

  return socket;
}

/**
 * Hook akses room. Satu sumber kebenaran untuk semua layar.
 * TODO(T-12): `session:resume` belum bisa memulihkan room karena server memetakan socket ID
 * baru ke room lama; sampai itu ada, reconnect hanya menampilkan status "mencoba menyambung".
 */
export function useRoom() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const joinQueue = (payload: JoinQueuePayload) => {
    ensureSocket().emit('queue:join', payload);
  };

  const leaveQueue = () => {
    ensureSocket().emit('queue:leave');
  };

  const answer = (payload: RaceAnswerPayload) => {
    ensureSocket().emit('race:answer', payload);
  };

  const resume = (token: string) => {
    ensureSocket().emit('session:resume', { token });
  };

  const reset = () => {
    dispatch({ type: 'reset' });
  };

  return { session: current, joinQueue, leaveQueue, answer, resume, reset };
}

function getSocket(): Socket {
  return ensureSocket();
}

export { getSocket };
