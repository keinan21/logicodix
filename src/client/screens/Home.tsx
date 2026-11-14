import { useEffect, useState, type CSSProperties } from 'react';
import { GAME } from '../../shared/constants';
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

/** Konten hewan sementara hingga konten lengkap dari server di-load (FR-M14). */
const ANIMAL_PLACEHOLDERS: Record<AnimalId, { nama: string; fakta: string }> = {
  orangutan: { nama: 'Orangutan', fakta: 'Kupu-kupu makan daun mertil setiap harinya.' },
  harimau: { nama: 'Harimau', fakta: 'Harimau adalah pemangsa top di hutan.' },
  gajah: {
    nama: 'Gajah',
    fakta: 'Gajah terbuat dari tus ivory yang hanya boleh dipakai untuk tus yang jatuh.',
  },
  penyu: { nama: 'Penyu', fakta: 'Penyu dapat mempertahankan napas saat air.' },
  badak: { nama: 'Badak', fakta: 'Badak berkulit tebal untuk melindungi dari serangan.' },
  burung: { nama: 'Burung', fakta: 'Burung bisa melihat warna lebih banyak dari manusia.' },
};

const SCENERY = [tree, tiger, seedling, turtle, palm];

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
        <p className="home-note home-intro">
          Jawab benar, hewanmu melaju. Siapa paling cepat sampai finish?
        </p>
        <div className="home-emo" aria-hidden="true">
          {SCENERY.map((src, i) => (
            <img key={src} src={src} alt="" style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
        <p className="home-note home-summary">
          {GAME.MAX_PLAYERS} pemain · {GAME.STEPS_TO_FINISH} jawaban benar untuk finish · evaluasi
          AI di akhir
        </p>
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
              nama={ANIMAL_PLACEHOLDERS[id].nama}
              fakta={ANIMAL_PLACEHOLDERS[id].fakta}
              selected={animalId === id}
              onSelect={setAnimalId}
              compact
            />
          ))}
        </div>
        <div className="home-fact" aria-live="polite" aria-atomic="true">
          <img src={ANIMAL_ASSETS[animalId].src} alt="" />
          <span>
            {ANIMAL_PLACEHOLDERS[animalId].nama} — {ANIMAL_PLACEHOLDERS[animalId].fakta}
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
      </section>
    </main>
  );
}
