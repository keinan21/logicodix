import { useEffect, useState } from 'react';
import { GAME } from '../../shared/constants';
import { randomChoice } from '../../shared/rng';
import tree from '../assets/home/tree.svg';
import tiger from '../assets/home/tiger.svg';
import seedling from '../assets/home/seedling.svg';
import turtle from '../assets/home/turtle.svg';
import palm from '../assets/home/palm.svg';
import './Home.css';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AnimalCard } from '../components/AnimalCard';
import { nicknameSchema, animalIdSchema } from '../../shared/schema';
import type { AnimalId } from '../../shared/schema';
import { ANIMAL_ASSETS } from '../components/animalAssets';

const ANIMAL_IDS: AnimalId[] = ['orangutan', 'harimau', 'gajah', 'penyu', 'badak', 'burung'];

/**
 * Layar Beranda (DESIGN §3 screen 1; FR-M01, M02, M03, M14).
 * Nickname tanpa akun; disimpan di sessionStorage; pilihan hewan tersimpan bersama nickname.
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
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title">
          Balap Fakta
          <br />
          Lingkungan
        </h1>
        <p className="home-intro">Jawab benar, hewanmu melaju. Siapa paling cepat sampai finish?</p>
        <div className="home-scenery" aria-hidden="true">
          {[tree, tiger, seedling, turtle, palm].map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </div>
        <p className="home-summary">
          {GAME.MAX_PLAYERS} pemain · {GAME.STEPS_TO_FINISH} jawaban benar untuk finish · evaluasi
          AI di akhir
        </p>
      </section>
      <div className="home-form-column">
        <form
          className="home-form"
          onSubmit={(event) => {
            event.preventDefault();
            start('quick');
          }}
        >
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
          <fieldset className="home-runners">
            <legend>Pilih pelarimu</legend>
            <div className="home-animal-grid">
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
          </fieldset>
          <p id="home-fact" className="home-fact" aria-live="polite" aria-atomic="true">
            {ANIMAL_ASSETS[animalId].nama}
            {facts[animalId] ? ` — ${facts[animalId]}` : ''}
          </p>
          {joinError ? (
            <p className="home-error" role="alert">
              {joinError}
            </p>
          ) : null}
          <div className="home-actions">
            <Button type="submit" variant="primary" disabled={!valid}>
              Main
            </Button>
            <Button variant="secondary" onClick={() => start('bot')} disabled={!valid}>
              Lawan bot
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
