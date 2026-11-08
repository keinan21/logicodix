import { useEffect, useState } from 'react';
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
    <main className="screen">
      <div className="screen-inner" style={{ maxWidth: 560 }}>
        <h1 style={{ font: 'var(--text-display)', color: 'var(--color-forest-900)', margin: 0 }}>
          Balap Fakta Lingkungan
        </h1>
        <p style={{ margin: 0, color: 'var(--color-muted)' }}>
          Jawab klaim lingkungan Benar atau Salah. Jawaban benar memajukan hewanmu. Finish duluan =
          menang.
        </p>

        <div
          className="card"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
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
          {touched && !valid ? (
            <p
              role="alert"
              style={{ margin: 0, color: 'var(--color-err-600)', font: 'var(--text-small)' }}
            >
              {nicknameError}
            </p>
          ) : null}

          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend
              style={{
                font: 'var(--text-label)',
                color: 'var(--color-muted)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Pilih pelarimu
            </legend>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 'var(--space-2)',
              }}
            >
              {ANIMAL_IDS.map((id) => (
                <AnimalCard
                  key={id}
                  animalId={id}
                  nama={ANIMAL_PLACEHOLDERS[id].nama}
                  fakta={ANIMAL_PLACEHOLDERS[id].fakta}
                  selected={animalId === id}
                  onSelect={setAnimalId}
                />
              ))}
            </div>
          </fieldset>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => start('quick')} aria-disabled={!valid}>
              Main
            </Button>
            <Button variant="secondary" onClick={() => start('bot')} aria-disabled={!valid}>
              Lawan bot
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
