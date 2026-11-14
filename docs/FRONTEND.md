# FRONTEND.md — EcoRush Client

Dokumen referensi untuk juri dan kontributor baru. Dibaca setelah
`ARCHITECTURE.md` dan `DESIGN.md`.

---

## 1. Stack

| Teknologi                         | Peran                                              |
| --------------------------------- | -------------------------------------------------- |
| React 18 (`useSyncExternalStore`) | UI                                                 |
| Vite                              | Bundler + dev server                               |
| TypeScript strict                 | Semua file `.ts` / `.tsx`                          |
| Socket.IO client                  | Koneksi real-time ke server                        |
| CSS custom properties             | Token desain — **tanpa Tailwind, tanpa CSS-in-JS** |
| Zod                               | Validasi payload socket sebelum masuk reducer      |

---

## 2. Struktur folder

```
src/client/
├── App.tsx              # State machine layar; satu-satunya tempat routing
├── main.tsx             # Mount React; primeAudio() setelah interaksi pertama
├── socket.ts            # Store global + hook useRoom()
├── music.ts             # Musik latar (loop, fade)
├── sound.ts             # Efek suara SFX
├── styles.css           # Token CSS global
├── vite-env.d.ts
├── screens/
│   ├── Home.tsx / .css
│   ├── Queue.tsx / .css
│   ├── Lobby.tsx / .css
│   ├── Race.tsx / .css
│   ├── Podium.tsx / .css
│   ├── Evaluation.tsx / .css
│   ├── Error.tsx / .css
│   └── RaceResultDialog.tsx
├── components/
│   ├── AIPanel.tsx
│   ├── AnswerOption.tsx
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Chip.tsx
│   ├── CountdownRing.tsx
│   ├── EvalItem.tsx
│   ├── FeedbackSheet.tsx / .css
│   ├── Input.tsx
│   ├── Lane.tsx / .css
│   ├── QuestionCard.tsx / .css
│   ├── ResultRow.tsx
│   ├── SoundToggle.tsx
│   ├── AnimalCard.tsx
│   └── animalAssets.ts
├── assets/
│   ├── fonts/           # Fredoka.woff2, PlusJakartaSans.ttf (NFR-02: lokal)
│   ├── music/           # town-theme.mp3, race-mushroom-theme.mp3
│   ├── sfx/             # tick, start, correct, wrong, finish, select (.mp3)
│   ├── home/            # SVG dekorasi beranda
│   └── kenney/          # Ikon UI
└── previews/            # Sandbox komponen (dev only)
```

---

## 3. Routing / alur layar

Tidak ada React Router. `App.tsx` memegang dua variabel:

- `phase` — dari `session.state.phase` (dikirim server): `'lobby' | 'racing' | 'finished'`
- `route` — state lokal React: `'home' | 'queue' | 'evaluation' | 'result'`

Layar yang ditampilkan ditentukan oleh urutan `if` di `App.tsx`:

```
Error ──────────────── koneksi putus / sesi kedaluwarsa
 │
Home ←──────────────── session.state === null && route === 'home'
 │  join()
Queue ───────────────── route === 'queue' && session.state === null
 │  server kirim room:state phase='lobby'
Lobby ───────────────── phase === 'lobby'
 │  server kirim phase='racing'
Race ────────────────── phase === 'racing' && route !== 'result'
 │  pemain selesai / raceEnd tiba
Podium ──────────────── route === 'result'  ATAU  phase === 'finished'
 │  onViewEvaluation()
Evaluation ─────────── route === 'evaluation'
```

Musik ikut berubah otomatis: `setMusic('race')` saat `phase === 'racing'`,
`setMusic('menu')` untuk semua layar lainnya.

---

## 4. `useRoom()` — satu hook untuk semua layar

**File:** `src/client/socket.ts`

### 4.1 `RoomSession` — antarmuka store

```ts
interface RoomSession {
  state: RoomState | null; // State room dari server; null = belum di room
  feedback: RaceFeedback | null; // Umpan balik jawaban terakhir (kunci hanya di sini, FR-K11)
  feedbackAtMs: number | null; // Waktu client saat feedback diterima (ms)
  raceEnd: RaceEnd | null; // Peringkat final (dari race:end)
  standings: RaceEnd | null; // Peringkat sementara (dari race:standings)
  evaluation: EvalReady | null; // Data evaluasi (dari eval:ready)
  error: SessionError | null; // Pesan error dari server
  waitingS: number; // Lama menunggu di antrean (detik)
  found: number; // Jumlah pemain ditemukan (FR-M05)
  connected: boolean; // Status koneksi socket saat ini
  everConnected: boolean; // Pernah terhubung (untuk layar reconnecting)
  myId: string | null; // ID socket = ID peserta di room:state
}
```

Kunci jawaban (`answerIndex`, `explanation`) hanya masuk lewat `feedback`
setelah pemain menjawab — tidak pernah ada di `state` (FR-K11).

### 4.2 `sessionReducer` — reducer murni

```ts
function sessionReducer(session: RoomSession, event: SessionEvent): RoomSession;
```

Semua event Socket.IO (S→C) diproses di sini sebelum disimpan ke store.
Reducer murni: tanpa socket, tanpa `Date.now()`, tanpa efek samping —
bisa dites tanpa server (AGENTS §3).

| Event          | Efek utama                                                            |
| -------------- | --------------------------------------------------------------------- |
| `connection`   | Update `connected`, `myId`                                            |
| `state`        | Simpan `RoomState`; room baru → bersihkan feedback/raceEnd/evaluation |
| `feedback`     | Simpan `RaceFeedback` + `feedbackAtMs`                                |
| `race-end`     | Simpan `raceEnd` dan `standings`                                      |
| `standings`    | Update `standings` saja (balapan masih berjalan)                      |
| `evaluation`   | Simpan `EvalReady`                                                    |
| `error`        | Simpan `SessionError`                                                 |
| `queue-status` | Update `waitingS`, `found`                                            |
| `reset`        | Bersihkan semua data room; koneksi tetap hidup                        |
| `answer-start` | Bersihkan `error`                                                     |

### 4.3 Cara komponen menggunakan hook

```tsx
import { useRoom } from '../socket';

function MyScreen() {
  const { session, answer, leaveRoom } = useRoom();

  // Baca state langsung
  const me = session.state?.participants.find((p) => p.id === session.myId);

  // Kirim jawaban ke server
  const handleAnswer = (letter: 'A' | 'B' | 'C' | 'D') => {
    answer({ questionIndex: session.state!.questionIndex, choice: letter });
  };
}
```

Fungsi yang dikembalikan `useRoom()`:

| Fungsi               | Deskripsi                                        |
| -------------------- | ------------------------------------------------ |
| `joinQueue(payload)` | Kirim `queue:join`; reset state room             |
| `leaveQueue()`       | Kirim `queue:leave`; kembali ke `initialSession` |
| `answer(payload)`    | Kirim `race:answer`                              |
| `pause(paused)`      | Kirim `race:pause` (solo vs bot saja)            |
| `leaveRoom()`        | Kirim `room:leave`; reset state room             |
| `resume(token)`      | Kirim `session:resume` (reconnect)               |
| `reset()`            | Reset state lokal tanpa emit                     |

---

## 5. Layar per layar

### Home (`screens/Home.tsx`)

**Ditampilkan:** kondisi `session.state === null && route === 'home'`

**State dibaca:** `session.error?.pesan` (error join dari server)

**Yang tampil:**

- Logo EcoRush
- Input nickname (validasi `nicknameSchema`, disimpan ke `sessionStorage`)
- Grid pilih hewan (`AnimalCard` × 6; pilihan disimpan ke `sessionStorage`)
- Fakta hewan dari `/api/animals`
- Tombol **Main** (mode `quick`) dan **Lawan bot** (mode `bot`)

---

### Queue (`screens/Queue.tsx`)

**Ditampilkan:** `route === 'queue' && session.state === null && session.error === null`

**State dibaca:** `waitingS` (hitung mundur lokal di App), `session.found`

**Yang tampil:** Animasi menunggu, lama tunggu, jumlah pemain ditemukan, tombol Batal.

---

### Lobby (`screens/Lobby.tsx`)

**Ditampilkan:** `phase === 'lobby'`

**State dibaca:** `session.state` (daftar peserta, `lobbyCountdownS`)

**Yang tampil:** Daftar peserta dengan ikon hewan, hitung mundur mulai balapan
(`CountdownRing`), tombol Keluar.

---

### Race (`screens/Race.tsx`)

**Ditampilkan:** `phase === 'racing' && route !== 'result'`

**State dibaca:**

- `session.state` → `participants`, `activeQuestion`, `timeLeftS`, `questionIndex`, `paused`
- `session.feedback` + `session.feedbackAtMs` → tahan tampilan feedback
- `session.raceEnd` → memunculkan `RaceResultDialog`
- `session.error` (kode `invalid-answer`) → reset pilihan

**Yang tampil:**

- Header: tombol Keluar, sisa waktu (`formatClock`), tombol Jeda (solo vs bot)
- Lintasan: satu `Lane` per peserta
- `QuestionCard` + 4 `AnswerOption` (A–D; shortcut keyboard 1–4 / A–D)
- `FeedbackSheet` setelah menjawab (tahan 8 dtk jika benar, sampai lock habis jika salah)
- `RaceResultDialog` saat balapan selesai / jeda / konfirmasi keluar

---

### Podium (`screens/Podium.tsx`)

**Ditampilkan:** `route === 'result'` atau `phase === 'finished'`

**State dibaca:** `session.raceEnd` (final) atau `session.standings` (sementara, balapan masih jalan)

**Yang tampil:** Tangga juara, `ResultRow` per pemain, tombol Evaluasi / Main lagi / Ke beranda.
Prop `provisional={true}` jika `raceEnd === null` (balapan masih berjalan untuk pemain lain).

---

### Evaluation (`screens/Evaluation.tsx`)

**Ditampilkan:** `route === 'evaluation'`

**State dibaca:** `session.evaluation` (dari `eval:ready`)

**Yang tampil:**

- Daftar soal yang dijawab (`EvalItem`; salah → terbuka otomatis, FR-H02)
- Panel AI (`AIPanel`) dengan `Badge` asal teks
- Daftar sumber terverifikasi ("Baca lebih lanjut")
- Tombol Kembali ke hasil / Main lagi / Ke beranda

---

## 6. Komponen utama

### `Lane`

Props: `participant: ParticipantPublic`, `steps: number`, `correct?: boolean`

Menampilkan satu lintasan balapan: label nickname (warna slot), 6 posisi, hewan SVG
yang melompat maju (`motion-step`), tunas per langkah, garis finish kotak-kotak.
`correct={true}` memunculkan kilatan ✓ di atas pelari.

---

### `FeedbackSheet`

Props: `feedback: RaceFeedback`, `holdS: number`, `remainingS: number`, `onSkip?: () => void`

Panel umpan balik di bawah layar Race. Menampilkan hasil (✓/✗), penjelasan, sumber,
dan bar waktu tahan. `onSkip` hanya ada saat jawaban benar (FR-B04 — pengguna bisa
melewati masa baca).

---

### `AnswerOption`

Props: `letter`, `text`, `state: AnswerOptionState`, `disabled?`, `onSelect?`, `order?`

```ts
type AnswerOptionState = 'default' | 'hover' | 'selected-waiting' | 'correct' | 'wrong' | 'dimmed';
```

Status tidak dibedakan dengan warna saja — selalu ada ikon ✓/✗ dan teks
visually-hidden "Benar"/"Salah" (aksesibilitas DESIGN §6, §8).

---

### `AIPanel`

Props: `content`, `badge: EvalBadge | null`, `loading?: boolean`

Panel ungu di halaman Evaluasi. Menampilkan `motivation`, `pattern`, dan `tip`
dari AI, atau teks fallback "Ringkasan otomatis (bukan AI)" jika AI gagal (AGENTS §2.5).
Selalu menyertakan `Badge` asal teks setelah konten siap (FR-H05).

---

### `Badge`

Props: `kind: 'ai' | 'auto-summary' | 'example-ai' | 'bot'`

| `kind`         | Teks                          |
| -------------- | ----------------------------- |
| `ai`           | Dibuat oleh AI                |
| `auto-summary` | Ringkasan otomatis (bukan AI) |
| `example-ai`   | Contoh AI (dibuat sebelumnya) |
| `bot`          | BOT                           |

---

### `EvalItem`

Props: `questionNumber`, `stem`, `claim?`, `chosenText?`, `answerText?`,
`chosenLetter?`, `answerLetter?`, `explanation?`, `sources?`, `wrong`, `open`, `onToggle`

Satu baris soal di halaman Evaluasi. Dapat dibuka/tutup. Soal salah terbuka
otomatis dan menampilkan pilihan pemain, kunci, penjelasan, dan sumber (FR-H02).

---

### `RaceResultDialog` (`screens/RaceResultDialog.tsx`)

Props: `title`, `text`, `actions`, `onCancel?`

Dialog overlay saat balapan selesai, pemain ingin keluar, atau balapan dijeda.
Dirender di dalam Race sehingga lintasan tetap terlihat di latar.

---

### `SoundToggle`

Tombol bisu pojok kanan bawah (selalu terlihat). Mematikan/menyalakan efek suara
dan musik latar sekaligus. Pilihan disimpan di `localStorage`.

---

## 7. Token CSS (`styles.css`)

Semua nilai visual hanya boleh dipakai lewat token ini. **Dilarang menulis hex
langsung di komponen** (AGENTS §2.8).

### Warna utama

| Token                          | Nilai                          | Kegunaan                  |
| ------------------------------ | ------------------------------ | ------------------------- |
| `--color-forest-900`           | `#24502a`                      | Teks gelap, border tebal  |
| `--color-forest-700`           | `#2f7a3c`                      | Tautan, aksen hijau       |
| `--color-forest-500`           | `#4f9e42`                      | Tombol primer (atas)      |
| `--color-sun-500`              | `#ffd23f`                      | Aksen kuning / klaim soal |
| `--color-ok-600 / ok-100`      | `#24793d / #dff3d3`            | Umpan balik benar         |
| `--color-err-600 / err-100`    | `#b23b27 / #fbe0cf`            | Umpan balik salah         |
| `--color-ai-600 / ai-100`      | `#6a4fe0 / #efeaff`            | Panel AI (ungu)           |
| `--color-bg` / `--color-cream` | `#fffeeb`                      | Latar halaman             |
| `--color-ink`                  | `#552f1c`                      | Teks utama                |
| `--color-muted`                | `#7b5a45`                      | Teks sekunder             |
| `--color-slot-1..4`            | merah / hijau / biru / cokelat | Warna slot pemain         |
| `--color-bot`                  | `#6b756e`                      | Label bot                 |

### Tipografi

| Token            | Spesifikasi                             |
| ---------------- | --------------------------------------- |
| `--text-display` | 700 34px/1.1 (desktop: 56px)            |
| `--text-title`   | 600 21px/1.3 (desktop: 24px)            |
| `--text-body`    | 400 16px/1.55                           |
| `--text-small`   | 400 14px/1.45                           |
| `--text-label`   | 600 13px/1.25                           |
| `--text-button`  | 600 18px/1.2                            |
| `--font-family`  | Fredoka → Plus Jakarta Sans → system-ui |

Font disimpan lokal di repo (NFR-02): `Fredoka.woff2`, `PlusJakartaSans.ttf`.

### Spacing

`--space-1` (4px) · `--space-2` (8px) · `--space-3` (12px) · `--space-4` (16px) · `--space-6` (24px) · `--space-8` (32px)

### Radius

`--radius-sm` (8px) · `--radius-md` (12px) · `--radius-lg` (18px) · `--radius-pill` (999px)

### Bayangan

`--shadow-card` · `--shadow-btn` · `--shadow-btn-hover` · `--shadow-btn-press`

### Motion

| Token               | Durasi | Kegunaan                     |
| ------------------- | ------ | ---------------------------- |
| `--motion-fast`     | 150ms  | Hover, transisi cepat        |
| `--motion-step`     | 400ms  | Pelari melompat satu langkah |
| `--motion-run`      | 900ms  | Animasi berlari              |
| `--motion-check`    | 1000ms | Kilatan ✓                    |
| `--motion-bob`      | 600ms  | Goyang hewan di lobby        |
| `--motion-parallax` | 30s    | Langit bergerak di beranda   |

Semua animasi dihormati oleh `prefers-reduced-motion` (DESIGN §8).

---

## 8. Musik dan SFX

### `music.ts` — musik latar loop

```ts
// Pilih trek. null = fade keluar sampai berhenti.
setMusic('menu' | 'race' | null);

// Panggil sekali setelah interaksi pertama (kebijakan autoplay browser).
primeMusic();
```

| Trek   | File                                  | Fase                                   |
| ------ | ------------------------------------- | -------------------------------------- |
| `menu` | `town-theme.mp3` (CC0)                | Home, Queue, Lobby, Podium, Evaluation |
| `race` | `race-mushroom-theme.mp3` (CC-BY 3.0) | Race                                   |

Perpindahan trek dilakukan dengan fade 900 ms (`FADE_MS`) agar tidak mendadak.
Volume latar sengaja rendah (`VOLUME = 0.18`) agar SFX tetap terdengar.

### `sound.ts` — efek suara SFX

```ts
playSound('start' | 'tick' | 'correct' | 'wrong' | 'finish' | 'select');
primeAudio(); // panggil sekali setelah interaksi; memuat semua file
```

| Suara     | Pemicu                                   |
| --------- | ---------------------------------------- |
| `start`   | Transisi ke fase `racing`                |
| `correct` | Jawaban benar (dari `race:feedback`)     |
| `wrong`   | Jawaban salah (dari `race:feedback`)     |
| `finish`  | Pemain sendiri atau semua selesai        |
| `select`  | Ganti hewan di beranda                   |
| `tick`    | Tombol bisu dimatikan (konfirmasi nyala) |

### Tombol bisu (`SoundToggle`)

`SoundToggle` mengontrol efek suara dan musik latar sekaligus lewat
`setSoundMuted()` (sound.ts) dan `handleMuteChange()` (music.ts). Pilihan
disimpan di `localStorage` (`sfx-muted`).

---

## 9. Aturan kontribusi FE

1. **Token CSS only** — tidak boleh menulis nilai hex, `rgb()`, atau angka hardcode
   di dalam komponen atau CSS modul. Pakai token dari `styles.css` (AGENTS §2.8).

2. **Teks UI bahasa Indonesia** — semua label, pesan, aria-label, dan placeholder
   ditulis dalam bahasa Indonesia (AGENTS §2.7, DESIGN §7).

3. **Kunci tidak disimpan di state client** — `feedback.answerIndex` dan
   `feedback.explanation` hanya ada di `RoomSession.feedback` setelah pemain
   menjawab; tidak pernah dikirim sebelum menjawab (FR-K11). Komponen tidak boleh
   menyimpan nilai ini ke state lokal yang bertahan melewati soal berikutnya.

4. **Angka parameter dari `constants.ts`** — durasi lock, jumlah langkah, batas
   waktu: hanya dari `src/shared/constants.ts` (AGENTS §2.4).

5. **Acak hanya lewat `rng.ts`** — jangan pakai `Math.random()` di logika game;
   boleh di animasi / dekorasi (AGENTS §2.6).

6. **Tidak ada fitur di luar FR** — YAGNI. Kalau tidak disebut di FR, jangan tambah.

7. **Tes untuk perilaku baru** — terutama untuk `sessionReducer` yang bisa dites
   tanpa socket (AGENTS §3).
