/**
 * src/server/matchmaking.ts — antrean quick match + pembentukan room (FR-M05..M08, M12; D-47).
 *
 * Aturan (FR-M06):
 * - 4 pemain di antrean → room langsung terbentuk.
 * - Pemain yang paling lama menunggu sudah 10 detik → room dibentuk dari semua yang menunggu,
 *   slot kosong diisi bot. Kedatangan pemain baru TIDAK mengulang hitungan 10 detik.
 * - Mode "bot" → room langsung: 1 manusia + 3 bot, tanpa antrean (FR-M08).
 * - Batal / tutup tab → keluar antrean (FR-M07).
 */

import { GAME } from '../shared/constants';
import type { JoinQueuePayload } from '../shared/schema';
import { logEvent } from './log';

export interface QueuedPlayer {
  socketId: string;
  nickname: string;
  animalId: string;
  mode: 'quick' | 'bot';
  joinedAtMs: number;
}

export interface RoomRequest {
  humanPlayers: QueuedPlayer[];
  botCount: number;
}

export type RoomHandler = (req: RoomRequest) => void;

export class Matchmaking {
  private queue: QueuedPlayer[] = [];
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private onRoom: RoomHandler;

  constructor(onRoom: RoomHandler) {
    this.onRoom = onRoom;
  }

  /** Masuk antrean (FR-M05). Mengembalikan posisi antre (1-based) untuk ditampilkan. */
  join(socketId: string, payload: JoinQueuePayload, nowMs: number): number {
    this.leave(socketId, nowMs);
    this.queue.push({
      socketId,
      nickname: payload.nickname,
      animalId: payload.animalId,
      mode: payload.mode,
      joinedAtMs: nowMs,
    });

    if (payload.mode === 'bot') {
      // FR-M08: langsung room, tanpa antrean
      this.formRoom([this.queue.pop() as QueuedPlayer], 3);
      return 0;
    }

    if (this.queue.length >= GAME.MAX_PLAYERS) {
      this.formRoom(this.drain(), 0);
      return 0;
    }

    // Timer 10 detik hanya untuk pemain terlama; pemain baru tidak mengulang (FR-M06).
    const first = this.queue[0];
    if (this.timers.size === 0 && first !== undefined) {
      this.armTimeout(first.socketId, nowMs);
    }
    return this.queue.length;
  }

  /** Keluar antrean (FR-M07). */
  leave(socketId: string, _nowMs: number): void {
    const idx = this.queue.findIndex((p) => p.socketId === socketId);
    if (idx >= 0) this.queue.splice(idx, 1);
    const t = this.timers.get(socketId);
    if (t) {
      clearTimeout(t);
      this.timers.delete(socketId);
    }
    // Bila pemain terlama keluar, armed ulang timer untuk pemain terlama berikutnya.
    const next = this.queue[0];
    if (next !== undefined && this.timers.size === 0) {
      this.armTimeout(next.socketId, Date.now());
    }
  }

  private armTimeout(socketId: string, _nowMs: number): void {
    const t = setTimeout(() => {
      this.timers.delete(socketId);
      logEvent(
        undefined,
        undefined,
        'match.timeout',
        undefined,
        'info',
        'antrean 10 dtk habis; room dibentuk dengan bot',
      );
      const players = this.drain();
      if (players.length === 0) return;
      const botCount = GAME.MAX_PLAYERS - players.length;
      this.formRoom(players, botCount);
    }, GAME.QUEUE_TIMEOUT_S * 1000);
    this.timers.set(socketId, t);
  }

  private drain(): QueuedPlayer[] {
    const out = this.queue;
    this.queue = [];
    for (const id of this.timers.keys()) clearTimeout(this.timers.get(id));
    this.timers.clear();
    return out;
  }

  private formRoom(humans: QueuedPlayer[], botCount: number): void {
    if (humans.length === 0 && botCount === 0) return;
    // Profil bot diambil berurutan Kilat → Santai → Teliti (FR-M10) — diimplementasikan Room.
    this.onRoom({ humanPlayers: humans, botCount });
  }

  shutdown(): void {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }
}
