import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Matchmaking, type RoomRequest } from '../src/server/matchmaking';

describe('Matchmaking (FR-M05, FR-M06, FR-M07, FR-M08)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('pemain masuk antrean memancarkan queue:status ke semua pemain dalam antrean (FR-M05)', () => {
    const statuses: { socketId: string; status: { menungguS: number; ditemukan: number } }[] = [];
    const mm = new Matchmaking(
      () => {},
      (socketId, status) => statuses.push({ socketId, status }),
    );

    mm.join('s1', { nickname: 'P1', animalId: 'orangutan', mode: 'quick' }, 1000);

    expect(statuses).toEqual([{ socketId: 's1', status: { menungguS: 0, ditemukan: 1 } }]);

    statuses.length = 0;
    mm.join('s2', { nickname: 'P2', animalId: 'harimau', mode: 'quick' }, 2000);

    // Keduanya mendapat info 2 pemain ditemukan
    expect(statuses).toEqual([
      { socketId: 's1', status: { menungguS: 1, ditemukan: 2 } },
      { socketId: 's2', status: { menungguS: 0, ditemukan: 2 } },
    ]);
  });

  it('pemain keluar antrean memperbarui status pemain yang tersisa (FR-M07)', () => {
    const statuses: { socketId: string; status: { menungguS: number; ditemukan: number } }[] = [];
    const mm = new Matchmaking(
      () => {},
      (socketId, status) => statuses.push({ socketId, status }),
    );

    mm.join('s1', { nickname: 'P1', animalId: 'orangutan', mode: 'quick' }, 1000);
    mm.join('s2', { nickname: 'P2', animalId: 'harimau', mode: 'quick' }, 2000);

    statuses.length = 0;
    mm.leave('s1', 3000);

    expect(statuses).toEqual([{ socketId: 's2', status: { menungguS: 1, ditemukan: 1 } }]);
  });

  it('4 pemain langsung membentuk room dengan 0 bot (FR-M06)', () => {
    let createdRoom: RoomRequest | null = null;
    const mm = new Matchmaking((req) => {
      createdRoom = req;
    });

    mm.join('s1', { nickname: 'P1', animalId: 'orangutan', mode: 'quick' }, 1000);
    mm.join('s2', { nickname: 'P2', animalId: 'harimau', mode: 'quick' }, 1100);
    mm.join('s3', { nickname: 'P3', animalId: 'gajah', mode: 'quick' }, 1200);
    expect(createdRoom).toBeNull();

    mm.join('s4', { nickname: 'P4', animalId: 'penyu', mode: 'quick' }, 1300);
    expect(createdRoom).not.toBeNull();
    expect(createdRoom!.humanPlayers.map((p) => p.socketId)).toEqual(['s1', 's2', 's3', 's4']);
    expect(createdRoom!.botCount).toBe(0);
  });

  it('mode bot langsung membentuk room 1 manusia + 3 bot tanpa antrean (FR-M08)', () => {
    let createdRoom: RoomRequest | null = null;
    const mm = new Matchmaking((req) => {
      createdRoom = req;
    });

    mm.join('s1', { nickname: 'Solo', animalId: 'badak', mode: 'bot' }, 1000);

    expect(createdRoom).not.toBeNull();
    expect(createdRoom!.humanPlayers[0]!.nickname).toBe('Solo');
    expect(createdRoom!.botCount).toBe(3);
  });

  it('timeout 10 detik membentuk room dengan sisa slot diisi bot (FR-M06)', () => {
    let createdRoom: RoomRequest | null = null;
    const mm = new Matchmaking((req) => {
      createdRoom = req;
    });

    mm.join('s1', { nickname: 'P1', animalId: 'orangutan', mode: 'quick' }, 1000);
    mm.join('s2', { nickname: 'P2', animalId: 'harimau', mode: 'quick' }, 3000);

    expect(createdRoom).toBeNull();
    vi.advanceTimersByTime(9999);
    expect(createdRoom).toBeNull();

    vi.advanceTimersByTime(1);
    expect(createdRoom).not.toBeNull();
    expect(createdRoom!.humanPlayers.map((p) => p.socketId)).toEqual(['s1', 's2']);
    expect(createdRoom!.botCount).toBe(2);
  });

  it('kedatangan pemain baru tidak mengulang hitungan 10 detik (FR-M06)', () => {
    let createdRoom: RoomRequest | null = null;
    const mm = new Matchmaking((req) => {
      createdRoom = req;
    });

    // P1 masuk di t=0
    mm.join('s1', { nickname: 'P1', animalId: 'orangutan', mode: 'quick' }, 0);

    // Maju 7 detik
    vi.advanceTimersByTime(7000);

    // P2 masuk di t=7000 (tidak boleh mereset timer ke 10 detik dari sekarang)
    mm.join('s2', { nickname: 'P2', animalId: 'harimau', mode: 'quick' }, 7000);

    // Maju 3 detik lagi (total 10 detik sejak P1)
    vi.advanceTimersByTime(3000);

    // Room harus sudah terbentuk
    expect(createdRoom).not.toBeNull();
    expect(createdRoom!.humanPlayers.map((p) => p.socketId)).toEqual(['s1', 's2']);
    expect(createdRoom!.botCount).toBe(2);
  });
});
