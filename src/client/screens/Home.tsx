import { useEffect, useState } from 'react';
import { GAME } from '../../shared/constants';
import tree from '../assets/home/tree.svg';
import tiger from '../assets/home/tiger.svg';
import seedling from '../assets/home/seedling.svg';
import turtle from '../assets/home/turtle.svg';
import palm from '../assets/home/palm.svg';
import './Home.css';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AnimalCard } from '../components/AnimalCard';
import { useRoom } from '../socket';
import { nicknameSchema, animalIdSchema } from '../../shared/schema';
import type { AnimalId } from '../../shared/schema';

const ANIMAL_IDS: AnimalId[] = ['orangutan', 'harimau', 'gajah', 'penyu', 'badak', 'burung'];

/** TODO(T-11): ganti dengan konten dari content/animals.json via server (FR-M14). */
const ANIMAL_PLACEHOLDERS: Record<AnimalId, { nama: string; fakta: string }> = {
  orangutan: { nama: 'Orangutan', fakta: 'TODO(P-04): fakta singkat + sumber resmi' },
  harimau: { nama: 'Harimau', fakta: 'TODO(P-04): fakta singkat + sumber resmi' },
  gajah: { nama: 'Gajah', fakta: 'TODO(P-04): fakta singkat + sumber resmi' },
  penyu: { nama: 'Penyu', fakta: 'TODO(P-04): fakta singkat + sumber resmi' },
  badak: { nama: 'Badak', fakta: 'TODO(P-04): fakta singkat + sumber resmi' },
  burung: { nama: 'Burung', fakta: 'TODO(P-04): fakta singkat + sumber resmi' },
};

/**
 * Layar Beranda (DESIGN §3 screen 1; FR-M01, M02, M03, M14).
 * Nickname tanpa akun; disimpan di sessionStorage; pilihan hewan tersimpan bersama nickname.
 */
export function HomeScreen({
  onJoin,
}: {
  onJoin: (nickname: string, animalId: AnimalId, mode: 'quick' | 'bot') => void;
}) {
  const { joinQueue } = useRoom();
  const [nickname, setNickname] = useState(() => sessionStorage.getItem('nickname') ?? '');
  const [animalId, setAnimalId] = useState<AnimalId>(() => {
    const saved = sessionStorage.getItem('animalId');
    return saved && animalIdSchema.safeParse(saved).success ? (saved as AnimalId) : 'orangutan';
  });
  const [touched, setTouched] = useState(false);

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

  const start = (mode: 'quick' | 'bot') => {
    if (!valid) {
      setTouched(true);
      return;
    }
    // TODO(T-09): kirim via socket queue:join; untuk scaffold panggil hook langsung.
    joinQueue({ nickname, animalId, mode });
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
                  nama={ANIMAL_PLACEHOLDERS[id].nama}
                  fakta={ANIMAL_PLACEHOLDERS[id].fakta}
                  selected={animalId === id}
                  onSelect={setAnimalId}
                  compact
                />
              ))}
            </div>
          </fieldset>
          <p id="home-fact" className="home-fact" aria-live="polite" aria-atomic="true">
            {ANIMAL_PLACEHOLDERS[animalId].nama} — TODO-SUMBER: fakta hewan sedang disiapkan.
          </p>
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
