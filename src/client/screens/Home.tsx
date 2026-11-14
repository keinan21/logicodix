import { useEffect, useState, type CSSProperties } from 'react';
import { randomChoice } from '../../shared/rng';
import tree from '../assets/home/tree.svg';
import tiger from '../assets/home/tiger.svg';
import seedling from '../assets/home/seedling.svg';
import turtle from '../assets/home/turtle.svg';
import palm from '../assets/home/palm.svg';
import './Home.css';
import { Input } from '../components/Input';
import { AnimalCard } from '../components/AnimalCard';
import { ANIMAL_ASSETS } from '../components/animalAssets';
import { nicknameSchema, animalIdSchema } from '../../shared/schema';
import type { AnimalId } from '../../shared/schema';

const ANIMAL_IDS: AnimalId[] = ['orangutan', 'harimau', 'gajah', 'penyu', 'badak', 'burung'];

const SCENERY = [tree, tiger, seedling, turtle, palm];

/**
 * Layar Beranda (DESIGN §3 screen 1; FR-M01, M02, M03, M14).
 * Nickname tanpa akun; disimpan di sessionStorage; pilihan hewan tersimpan bersama nickname.
 * Fakta hewan diambil dari server (`/api/animals`); teks cadangan kosong sampai data tiba.
 */
export function HomeScreen({
  onJoin,
  joinError = null,
}: {
  onJoin: (nickname: string, animalId: AnimalId, mode: 'quick' | 'bot') => void;
  /** Pesan penolakan dari server, mis. filter kata kasar (FR-M02). */
  joinError?: string | null;
}) {
  const [nickname, setNickname] = useState(() => sessionStorage.getItem('nickname') ?? '');
  const [animalId, setAnimalId] = useState<AnimalId>(() => {
    const saved = sessionStorage.getItem('animalId');
    return saved && animalIdSchema.safeParse(saved).success
      ? (saved as AnimalId)
      : randomChoice(crypto.getRandomValues(new Uint32Array(1))[0] ?? 1, ANIMAL_IDS).value;
  });
  const [touched, setTouched] = useState(false);
  const [facts, setFacts] = useState<Partial<Record<AnimalId, string>>>({});

  useEffect(() => {
    let active = true;
    fetch('/api/animals')
      .then((r) => (r.ok ? (r.json() as Promise<{ id: AnimalId; fakta: string }[]>) : []))
      .then((list) => {
        if (active) setFacts(Object.fromEntries(list.map((a) => [a.id, a.fakta])));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const nicknameError = nicknameSchema.safeParse(nickname).success
    ? undefined
    : 'Nickname 2–16 karakter, hanya huruf, angka, dan spasi';

  const valid = nicknameSchema.safeParse(nickname).success;

  useEffect(() => {
    if (valid) {
      sessionStorage.setItem('nickname', nickname);
      sessionStorage.setItem('animalId', animalId);
    }
  }, [nickname, animalId, valid]);

  /**
   * Satu pintu keluar: `onJoin` milik App yang mengirim `queue:join`.
   * Jangan emit di sini juga — dua emit berarti satu socket masuk dua room sekaligus,
   * dan client lalu menerima dua aliran room:state (soal berganti sendiri, langkah tertukar).
   */
  const start = (mode: 'quick' | 'bot') => {
    if (!valid) {
      setTouched(true);
      return;
    }
    onJoin(nickname, animalId, mode);
  };

  return (
    <main className="home">
      <div className="home-hero">
        <div className="home-plank">
          <h1>
            Balap Fakta <span>Lingkungan</span>
          </h1>
        </div>
        <div className="home-emo" aria-hidden="true">
          {SCENERY.map((src, i) => (
            <img key={src} src={src} alt="" style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
      </div>

      <section className="home-card" aria-label="Masuk permainan">
        <h2>Siap di garis start?</h2>
        <Input
          label="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && nicknameError ? nicknameError : undefined}
          placeholder="2–16 huruf, angka, spasi"
          maxLength={16}
          autoComplete="nickname"
        />
        <div className="home-lbl" id="pelari">
          Pilih pelarimu
        </div>
        <div className="home-grid" role="radiogroup" aria-labelledby="pelari">
          {ANIMAL_IDS.map((id) => (
            <AnimalCard
              key={id}
              animalId={id}
              nama={ANIMAL_ASSETS[id].nama}
              fakta={facts[id] ?? ''}
              selected={animalId === id}
              onSelect={setAnimalId}
              compact
            />
          ))}
        </div>
        <div className="home-fact" aria-live="polite" aria-atomic="true">
          <img src={ANIMAL_ASSETS[animalId].src} alt="" />
          <span className="home-fact-text">
            <span className="home-fact-name">{ANIMAL_ASSETS[animalId].nama}</span>
            {facts[animalId] ? ` — ${facts[animalId]}` : ''}
            <span className="home-fact-source">Sumber diisi dari folder konten.</span>
          </span>
        </div>
        {joinError ? (
          <p className="home-error" role="alert">
            {joinError}
          </p>
        ) : null}
        <div className="home-btns">
          <button
            type="button"
            className="home-cta"
            disabled={!valid}
            onClick={() => start('quick')}
          >
            Main
          </button>
          <button
            type="button"
            className="home-cta home-cta-danger"
            disabled={!valid}
            onClick={() => start('bot')}
          >
            Lawan bot
          </button>
        </div>
        {valid ? (
          <p className="home-status">
            {ANIMAL_ASSETS[animalId].nama} milik {nickname} bersiap mencari pemain…
          </p>
        ) : null}
      </section>
    </main>
  );
}
