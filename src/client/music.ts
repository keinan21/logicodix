/**
 * music.ts — musik latar (loop) untuk Beranda/Antre/Lobby/Podium/Evaluasi dan Balapan.
 *
 * Dua trek MP3 di src/client/assets/music (lihat docs/ASSETS.md):
 *   - town-theme.mp3 — "Town Theme RPG" oleh cynicmusic, CC0.
 *   - race-mushroom-theme.mp3 — "Mushroom Theme" dari Platformer Game Music Pack
 *     oleh CodeManu, CC-BY 3.0 (https://opengameart.org/content/platformer-game-music-pack).
 *
 * Musik baru mulai setelah interaksi pertama (kebijakan autoplay browser), dipudarkan
 * masuk/keluar supaya perpindahan layar tidak terasa mendadak, dan ikut tombol bisu
 * yang sama dengan efek suara.
 */

import townTrack from './assets/music/town-theme.mp3';
import raceTrack from './assets/music/race-mushroom-theme.mp3';
import { isSoundMuted } from './sound';

export type MusicTrack = 'menu' | 'race';

const SOURCE: Record<MusicTrack, string> = {
  menu: townTrack,
  race: raceTrack,
};

/** Volume latar sengaja rendah supaya efek suara tetap terdengar. */
const VOLUME = 0.18;
const FADE_MS = 900;
const FADE_STEP_MS = 40;

let audio: HTMLAudioElement | null = null;
let track: MusicTrack | null = null;
let primed = false;
let fadeId: number | null = null;

function element(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (audio === null) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
  }
  return audio;
}

function stopFade(): void {
  if (fadeId !== null && typeof window !== 'undefined') {
    window.clearInterval(fadeId);
    fadeId = null;
  }
}

/** Naik/turunkan volume bertahap; berhenti memutar saat mencapai nol. */
function fadeTo(target: number): void {
  const el = element();
  if (el === null) return;
  stopFade();
  if (Math.abs(el.volume - target) < 0.01) {
    el.volume = target;
    if (target === 0) el.pause();
    return;
  }

  const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP_MS));
  const delta = (target - el.volume) / steps;
  fadeId = window.setInterval(() => {
    const next = el.volume + delta;
    const reached = delta >= 0 ? next >= target : next <= target;
    if (reached) {
      el.volume = target;
      stopFade();
      if (target === 0) el.pause();
      return;
    }
    el.volume = Math.min(1, Math.max(0, next));
  }, FADE_STEP_MS);
}

function startTrack(next: MusicTrack): void {
  const el = element();
  if (el === null || !primed || isSoundMuted()) return;

  const src = SOURCE[next];
  if (el.getAttribute('src') !== src) {
    el.setAttribute('src', src);
    el.load();
  }
  if (el.paused) {
    el.volume = 0;
    void el
      .play()
      .then(() => fadeTo(VOLUME))
      .catch(() => {
        /* Autoplay ditolak: diam sampai interaksi berikutnya. */
      });
  } else {
    fadeTo(VOLUME);
  }
}

/**
 * Pilih musik sesuai layar. `null` memudarkan musik sampai berhenti.
 * Pemanggilan sebelum interaksi pertama hanya mengingat pilihan.
 */
export function setMusic(next: MusicTrack | null): void {
  if (next === track) {
    if (next !== null && primed) startTrack(next);
    return;
  }
  track = next;
  if (next === null) {
    fadeTo(0);
    return;
  }
  startTrack(next);
}

/** Dipanggil sekali setelah interaksi pertama: mulai trek yang sudah dipilih. */
export function primeMusic(): void {
  primed = true;
  if (track !== null) startTrack(track);
}

/** Tombol bisu: musik ikut berhenti/berjalan bersama efek suara. */
export function handleMuteChange(muted: boolean): void {
  if (muted) {
    fadeTo(0);
    return;
  }
  if (track !== null) startTrack(track);
}
