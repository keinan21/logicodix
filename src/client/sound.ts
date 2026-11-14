/**
 * sound.ts — efek suara ringan permainan.
 *
 * Semua bunyi disintesis langsung dengan Web Audio API: tidak ada file audio yang
 * diunduh, jadi tetap kecil, bebas lisensi, dan bekerja offline (NFR-02).
 * Daftar pemicu ada di docs/ASSETS.md § Suara.
 */

export type SoundName = 'start' | 'tick' | 'correct' | 'wrong' | 'finish';

const STORAGE_KEY = 'sfx-muted';

let context: AudioContext | null = null;
let master: GainNode | null = null;

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

/**
 * AudioContext baru boleh dibuat setelah interaksi pengguna.
 * Dipanggil dari listener pointerdown pertama di main.tsx.
 */
export function primeAudio(): void {
  ensureContext();
}

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (context === null) {
    context = new Ctor();
    master = context.createGain();
    master.gain.value = 0.55;
    master.connect(context.destination);
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

interface ToneOptions {
  type?: OscillatorType;
  gain?: number;
  /** Frekuensi akhir untuk glissando pendek (mis. bunyi "salah"). */
  slideTo?: number;
}

/** Satu nada pendek dengan serangan cepat dan ekor eksponensial (tanpa klik). */
function tone(freq: number, at: number, duration: number, options: ToneOptions = {}): void {
  if (context === null || master === null) return;
  const osc = context.createOscillator();
  const gain = context.createGain();
  const peak = options.gain ?? 0.12;

  osc.type = options.type ?? 'triangle';
  osc.frequency.setValueAtTime(freq, at);
  if (options.slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(options.slideTo, at + duration);
  }

  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  osc.connect(gain).connect(master);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

/**
 * Bunyikan efek. Aman dipanggil kapan saja: diam jika dibisukan, browser tidak
 * mendukung Web Audio, atau sedang di luar browser (SSR/tes).
 */
export function playSound(name: SoundName): void {
  if (isSoundMuted()) return;
  const ctx = ensureContext();
  if (ctx === null) return;
  const t = ctx.currentTime + 0.02;

  switch (name) {
    // Hitung mundur lobby 3-2-1 (satu bunyi per detik).
    case 'tick':
      tone(880, t, 0.07, { type: 'sine', gain: 0.06 });
      break;
    // Balapan dimulai: tiga nada naik.
    case 'start':
      tone(392, t, 0.12, { gain: 0.11 });
      tone(523, t + 0.09, 0.12, { gain: 0.11 });
      tone(784, t + 0.18, 0.3, { gain: 0.12 });
      break;
    // Jawaban benar: arpeggio cepat C-E-G.
    case 'correct':
      tone(660, t, 0.16, { gain: 0.11 });
      tone(880, t + 0.075, 0.16, { gain: 0.11 });
      tone(1174, t + 0.15, 0.22, { gain: 0.1 });
      break;
    // Jawaban salah: dua nada turun dengan gelombang kasar.
    case 'wrong':
      tone(233, t, 0.2, { type: 'sawtooth', gain: 0.06, slideTo: 175 });
      tone(196, t + 0.12, 0.28, { type: 'sawtooth', gain: 0.05, slideTo: 147 });
      break;
    // Sampai finish / balapan usai: fanfare empat nada.
    case 'finish':
      tone(523, t, 0.22, { gain: 0.11 });
      tone(659, t + 0.1, 0.22, { gain: 0.11 });
      tone(784, t + 0.2, 0.24, { gain: 0.11 });
      tone(1046, t + 0.3, 0.42, { gain: 0.12 });
      tone(1568, t + 0.34, 0.36, { type: 'sine', gain: 0.04 });
      break;
  }
}
