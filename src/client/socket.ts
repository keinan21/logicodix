import { useMemo } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  EvalReady,
  JoinQueuePayload,
  RaceAnswerPayload,
  RaceEnd,
  RaceFeedback,
  RoomState,
} from '../shared/schema';

/**
 * socket.ts — satu koneksi, satu hook useRoom() (ARCHITECTURE §3, §4).
 * Client HANYA menampilkan state dari server; tidak pernah menyimpan kunci.
 */

export type ClientScreen = 'home' | 'queue' | 'lobby' | 'race' | 'podium' | 'evaluation';

export interface RoomSession {
  state: RoomState | null;
  feedback: RaceFeedback | null;
  raceEnd: RaceEnd | null;
  evaluation: EvalReady | null;
  error: { code: string; pesan: string } | null;
  waitingS: number;
  found: number;
}

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    // Sama-origin: server menyajikan web + socket di satu port (ARCHITECTURE §1).
    socketInstance = io({ autoConnect: true, reconnection: true });
  }
  return socketInstance;
}

/**
 * Hook akses room. Skeleton: menyimpan event S→C ke state.
 * TODO(T-09/T-13): reconnect ≤10 dtk dengan session:resume (FR-B11), status koneksi di layar Antre.
 */
export function useRoom() {
  const session = useMemo<RoomSession>(
    () => ({
      state: null,
      feedback: null,
      raceEnd: null,
      evaluation: null,
      error: null,
      waitingS: 0,
      found: 0,
    }),
    [],
  );

  const joinQueue = (payload: JoinQueuePayload) => {
    getSocket().emit('queue:join', payload);
  };

  const leaveQueue = () => {
    getSocket().emit('queue:leave');
  };

  const answer = (payload: RaceAnswerPayload) => {
    getSocket().emit('race:answer', payload);
  };

  const resume = (token: string) => {
    getSocket().emit('session:resume', { token });
  };

  return { session, joinQueue, leaveQueue, answer, resume, socket: getSocket() };
}

export { getSocket };
