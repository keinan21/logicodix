/**
 * sound.ts — efek suara permainan dari paket "Cute, Cozy & Magical UI SFX"
 * oleh Nomagician Music (CC BY 4.0). File ada di src/client/assets/sfx.
 * Daftar pemicu ada di docs/ASSETS.md § Suara.
 */

import tickFile from './assets/sfx/tick.mp3';
import startFile from './assets/sfx/start.mp3';
import correctFile from './assets/sfx/correct.mp3';
import wrongFile from './assets/sfx/wrong.mp3';
import finishFile from './assets/sfx/finish.mp3';
import selectFile from './assets/sfx/select.mp3';

export type SoundName = 'start' | 'tick' | 'correct' | 'wrong' | 'finish' | 'select';

const SOURCE: Record<SoundName, string> = {
  tick: tickFile,
  start: startFile,
  correct: correctFile,
  wrong: wrongFile,
  finish: finishFile,
  select: selectFile,
};

/** Volume efek suara; musik latar memakai nilai jauh lebih rendah (music.ts). */
const VOLUME = 0.7;

const STORAGE_KEY = 'sfx-muted';

/** Satu elemen audio per efek, dibuat saat pertama dipakai lalu dipakai ulang. */
const players = new Map<SoundName, HTMLAudioElement>();

/** Preferensi bisu disimpan lokal; default berbunyi. */
export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    /* Storage bisa diblokir (mode privat); abaikan. */
  }
}

function player(name: SoundName): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  let el = players.get(name);
  if (el === undefined) {
    el = new Audio(SOURCE[name]);
    el.preload = 'auto';
    el.volume = VOLUME;
    players.set(name, el);
  }
  return el;
}

/**
 * Audio baru boleh berbunyi setelah interaksi pengguna (kebijakan autoplay).
 * Dipanggil dari listener pointerdown pertama di main.tsx; sekalian memuat file
 * yang ada supaya bunyi pertama tidak telat.
 */
export function primeAudio(): void {
  for (const name of Object.keys(SOURCE) as SoundName[]) {
    player(name)?.load();
  }
}

/**
 * Bunyikan efek. Aman dipanggil kapan saja: diam jika dibisukan, browser tidak
 * mendukung audio, atau sedang di luar browser (SSR/tes).
 */
export function playSound(name: SoundName): void {
  if (isSoundMuted()) return;
  const el = player(name);
  if (el === null) return;
  try {
    el.currentTime = 0;
  } catch {
    /* Sebagian browser menolak seek sebelum metadata siap; mulai dari awal saja. */
  }
  void el.play().catch(() => {
    /* Autoplay ditolak atau file belum siap: tidak apa-apa, coba lagi pada pemicu berikutnya. */
  });
}
