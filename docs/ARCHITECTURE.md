# ARCHITECTURE

Status: Draft  
Version: 0.2 (menggantikan strawman v0.1 di `archive/ARCHITECTURE-strawman.md`)  
Depends on: PRD.md v0.7; frd/00–04; 01-decisions.md (D-49, D-55–D-62); CONTEXT.md  
Last updated: 2026-11-14

Dokumen ini menjelaskan cara aplikasi dibangun. Aturan game ada di FRD, dan keputusan dicatat di `01-decisions.md`. Kalau ada yang bertentangan, FRD dan D-xx yang dipakai.

## 1. Prinsip

1. **Satu bahasa, satu paket, satu port.** TypeScript dari ujung ke ujung, satu `package.json`, dan satu server yang menyajikan web dan Socket.IO.
2. **Server yang menentukan.** Benar/salah, langkah, waktu, dan peringkat dihitung di server. Browser hanya menampilkan state yang dikirim server.
3. **Aturan game adalah fungsi murni.** `src/shared/game.ts` tidak tahu soal socket, waktu sungguhan, atau acak sungguhan. Semua bisa dites tanpa browser.
4. **Satu skema, banyak pemakaian (DRY).** Skema zod di `src/shared/schema.ts` dipakai untuk pesan socket, validasi bank soal, dan cek keluaran AI.
5. **Tambah hanya kalau FRD meminta (YAGNI).** Tidak ada database, akun, state library, game engine, atau microservice.
6. **Bisa diulang.** Setiap room punya seed. Dengan seed yang sama, urutan soal, urutan pilihan, dan jawaban bot sama persis.

## 2. Stack

| Bagian            | Pilihan                                      | Alasan                                                     |
| ----------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Bahasa            | TypeScript (strict)                          | Tipe menangkap kesalahan kode buatan AI sebelum dijalankan |
| Runtime           | Node 22 LTS                                  | Satu runtime untuk server, tes, dan skrip                  |
| Web               | React + Vite                                 | Paling umum, cepat di-build, banyak contoh                 |
| Styling           | CSS biasa + variabel CSS                     | Tanpa alat tambahan; token warna dipakai DESIGN            |
| Server            | Express 5                                    | Paling dikenal; hanya menyajikan file web dan `/health`    |
| Real-time         | Socket.IO 4                                  | Room, reconnect (FR-B11), dan fallback sudah tersedia      |
| Validasi          | zod 4                                        | Satu skema untuk tipe dan validasi saat runtime            |
| AI                | `@google/genai`, model Gemini Flash termurah | Tier gratis (D-62); nama model dicek saat setup            |
| Filter kata kasar | `obscenity` + `@sideid/id-profanity-filter`  | Inggris dan Indonesia, keduanya MIT                        |
| Tes               | Vitest, Playwright                           | Unit untuk aturan game, satu tes ujung ke ujung            |
| Format            | Prettier + `tsc --noEmit`                    | Tanpa ESLint dulu; tambahkan hanya kalau ada masalah nyata |

Versi terakhir yang dicek di npm pada 2026-11-04: obscenity 0.4.6, @sideid/id-profanity-filter 1.13.0, socket.io 4.8.4, express 5.3.0, zod 4.6.7, @google/genai 2.32.0. Versi dikunci di `package-lock.json`, dan hanya rilis yang berumur lebih dari 2 minggu yang dipasang. Karena itu `@google/genai` 2.32.0 (rilis 29 Okt) baru boleh dipasang mulai 12 Nov. Sebelum itu, pakai rilis sebelumnya.

## 3. Struktur folder

```
.
├── package.json          # satu-satunya; scripts di §10
├── .env.example          # daftar variabel di §9, tanpa nilai rahasia
├── content/
│   ├── questions.json    # bank soal (FRD 04)
│   ├── tips.json         # tips tetap per tipe & topik (FR-K09)
│   ├── animals.json      # 6 hewan: id, nama, fakta, sumber (FR-M14)
│   └── contoh/           # evaluasi pregenerated untuk mode contoh (FR-H11)
├── src/
│   ├── shared/           # dipakai client dan server
│   │   ├── schema.ts     # semua skema zod + tipe turunannya
│   │   ├── game.ts       # fungsi murni: jawab, langkah, finish, peringkat
│   │   ├── bots.ts       # profil bot + keputusan bot dari seed
│   │   ├── rng.ts        # acak dengan seed
│   │   └── constants.ts  # parameter frd/00 §2, satu-satunya tempat angka
│   ├── server/
│   │   ├── index.ts      # Express + Socket.IO, satu port
│   │   ├── matchmaking.ts# antrean dan pembentukan room
│   │   ├── room.ts       # satu room: timer, state, kirim event
│   │   ├── content.ts    # muat dan validasi content/ saat start
│   │   ├── nickname.ts   # aturan nickname + filter kata kasar
│   │   ├── evaluate/     # index.ts (pilih mode), live.ts, contoh.ts, mock.ts, check.ts
│   │   └── log.ts        # log JSON, tanpa nickname
│   └── client/
│       ├── main.tsx, App.tsx
│       ├── socket.ts     # satu koneksi, satu hook useRoom()
│       ├── screens/      # Home, Queue, Lobby, Race, Podium, Evaluation
│       ├── components/
│       ├── assets/animals/   # SVG hewan (§8)
│       └── styles.css
├── tests/                # unit (Vitest) + e2e (Playwright)
├── scripts/
│   ├── load-test.ts      # 5 room bersamaan (NFR-03)
│   └── check-content.ts  # validasi bank soal tanpa menyalakan server
└── docs/                 # PRD, FRD, ARCHITECTURE, DESIGN, PLAN, ASSETS.md, …
```

Satu file mengurus satu hal. Kalau sebuah file melewati sekitar 300 baris, pecah.

## 4. Alur data

```
Browser (React)                    Server (Node)
  Home ──join{nickname,animal}──▶  nickname.ts ─▶ matchmaking.ts
                                                      │ 4 pemain / 10 dtk
  Lobby ◀──room:state────────────  room.ts ◀──────────┘ (+bot.ts)
  Race  ──answer{qIndex,choice}─▶  room.ts ─▶ game.ts (murni) ─▶ state baru
        ◀──room:state / feedback─  (kunci & penjelasan hanya setelah menjawab)
  Podium◀──race:end──────────────  game.ts rank()
  Eval  ◀──eval:ready────────────  evaluate/ (live│contoh│mock) ─▶ check.ts
                                         └─ gagal ─▶ ringkasan otomatis
```

- `room.ts` memegang satu-satunya timer (lobby 3 dtk, lock 5 dtk, batas 4 menit, putus 10 dtk) dan memanggil `game.ts` untuk setiap perubahan.
- Waktu dan acak dimasukkan sebagai argumen ke `game.ts`, jadi tes bisa memakai waktu palsu.
- Bot berjalan di server sebagai pemain biasa yang aksinya dijadwalkan dari seed (FR-B14).

## 5. State room

```
waiting ─▶ lobby ─▶ racing ─▶ finished ─▶ (dihapus)
              │         │
              │         ├─▶ paused ─▶ racing  (hanya 1 manusia, via race:pause)
              └─────────┴─▶ (dihapus) bila semua manusia keluar (FR-M12, FR-B13)
```

Status peserta: `racing`, `locked`, `finished`, `outOfQuestions`, `left`. Hanya `game.ts` yang boleh mengubah status, dan transisi yang tidak sah melempar error yang tertangkap di tes.

Balapan berakhir saat podium 1/2/3 terisi (`GAME.PODIUM_SIZE = 3`) **atau** waktu habis. Peserta yang belum finis saat balapan berakhir mendapat status `left` atau `outOfQuestions` dan ditampilkan "Kalah" di podium.

## 6. Kontrak socket

Semua payload divalidasi zod di kedua sisi. Payload yang tidak lolos ditolak dan dicatat di log.

| Arah | Event            | Isi                                                                                                         |
| ---- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| C→S  | `queue:join`     | nickname, animalId, mode (`quick` / `bot`)                                                                  |
| C→S  | `queue:leave`    | –                                                                                                           |
| C→S  | `race:answer`    | questionIndex, choice (A–D)                                                                                 |
| C→S  | `race:pause`     | `{paused: boolean}` — jeda/lanjut; hanya diterima bila room berisi tepat satu manusia (lawan bot)           |
| C→S  | `room:leave`     | – — pemain keluar di tengah balapan; server tandai `left`, room dihapus bila semua manusia keluar           |
| C→S  | `session:resume` | token sesi (reconnect ≤ 10 dtk)                                                                             |
| S→C  | `queue:status`   | lama menunggu, jumlah pemain ditemukan                                                                      |
| S→C  | `room:state`     | fase, peserta (nickname, animalId, isBot, langkah, status), sisa waktu, soal aktif **tanpa kunci**, `paused?` |
| S→C  | `race:feedback`  | benar/salah; bila salah: kunci, penjelasan, sumber, akhir lock                                              |
| S→C  | `race:standings` | peringkat sementara, hanya ke pemain yang sudah tidak bisa menjawab (dipakai tombol "lihat hasil sekarang") |
| S→C  | `race:end`       | peringkat akhir                                                                                             |
| S→C  | `eval:ready`     | daftar soal + bagian AI + badge                                                                             |
| S→C  | `error`          | kode + pesan bahasa Indonesia                                                                               |

Pilihan jawaban peserta lain tidak pernah dikirim (FR-B06).

`race:pause` ditolak server bila room punya lebih dari satu manusia. Saat dijeda, semua timer dibekukan dan `raceEndsAtMs` digeser sebesar durasi jeda.

## 7. Modul AI

- `evaluate/index.ts` memilih mode dari `AI_MODE` (`live`, `contoh`, `mock`). Kalau `live` tetapi API key kosong, server otomatis memakai `contoh` dan menulis peringatan di log.
- **Input** (FR-H06): untuk setiap soal yang dijawab, kirim ID, jenis, pilihan, kunci, penjelasan, tipe, dan topik. Nickname tidak pernah dikirim.
- **Prompt**: satu template di `evaluate/prompt.ts`, bahasa Indonesia, meminta JSON `{pattern, tip}` atau `{motivation}` untuk kasus semua benar. Mode JSON Gemini dipakai dengan skema dari zod.
- **Cek keluaran** (`check.ts`, FR-H08): skema dan panjang, hanya tipe/topik dari input, tanpa URL, tanpa angka yang tidak ada di input, dan tanpa menyebut huruf kunci yang berbeda. Satu cek gagal berarti hasil dibuang.
- **Batas waktu** 8 detik dengan `AbortController` (FR-H07).
- **Cache** (FR-H10): `Map` di memori dengan kunci daftar (ID soal, pilihan) yang diurutkan. Tanpa nickname, dan hilang saat server mati.
- **Fallback** (FR-H09): `summary.ts` menghitung tipe/topik terbanyak salah dan mengambil tips dari `tips.json`.
- Ganti penyedia cukup dengan mengganti `live.ts`, karena semua mode punya tanda tangan fungsi yang sama.

## 8. Aset hewan

- **Sumber:** Google Noto Emoji (github.com/googlefonts/noto-emoji). Gambar dan tool di repo itu berlisensi Apache 2.0, dan font berlisensi OFL 1.1 (dicek di README repo, 2026-11-04).
- **File yang dipakai:**

| Hewan                | Emoji | Kode Unicode |
| -------------------- | ----- | ------------ |
| Orangutan            | 🦧    | U+1F9A7      |
| Harimau              | 🐅    | U+1F405      |
| Gajah                | 🐘    | U+1F418      |
| Penyu                | 🐢    | U+1F422      |
| Badak                | 🦏    | U+1F98F      |
| Burung (kakatua/beo) | 🦜    | U+1F99C      |

- **Cara mengambil (sekali, oleh satu orang):**
  1. Buka repo Noto Emoji dan cari folder SVG-nya. Nama file biasanya `emoji_u<kode>.svg`, misalnya `emoji_u1f418.svg`. Saya belum bisa membuka folder itu dari lingkungan saya, jadi path persisnya dicek saat mengunduh.
  2. Simpan ke `src/client/assets/animals/<id>.svg` dengan id `orangutan`, `harimau`, `gajah`, `penyu`, `badak`, `burung`.
  3. Salin teks lisensi Apache 2.0 ke `docs/licenses/noto-emoji-LICENSE`.
  4. Tambahkan baris ke `docs/ASSETS.md` berisi nama file, sumber (URL dan commit), lisensi, dan perubahan yang dilakukan.
- **Arah gerak:** hewan dibalik dengan `transform: scaleX(-1)` bila menghadap ke kiri, supaya menghadap finish di kanan. Daftar hewan yang perlu dibalik ada di `animals.json` (`flip: true`).
- **Aturan aset lain:** setiap aset (latar, ikon, suara) wajib punya baris di `docs/ASSETS.md`. Aset yang lisensinya tidak jelas tidak boleh masuk repo.

## 9. Konfigurasi

| Variabel         | Default          | Arti                                                       |
| ---------------- | ---------------- | ---------------------------------------------------------- |
| `PORT`           | 3000             | Port server                                                |
| `AI_MODE`        | `mock`           | `live`, `contoh`, atau `mock`                              |
| `GEMINI_API_KEY` | –                | Hanya di `.env` server, tidak pernah di-commit (NFR-08)    |
| `GEMINI_MODEL`   | dicek saat setup | Model Flash termurah                                       |
| `SEED`           | acak             | Kalau diisi, semua room memakai seed ini (untuk debugging) |
| `DEBUG_PANEL`    | `false`          | Mengaktifkan `?debug=1`                                    |

Server menolak start bila `content/` tidak lolos validasi, dengan pesan yang menyebut ID soal dan field yang salah.

## 10. Perintah

| Perintah        | Isi                                                                    |
| --------------- | ---------------------------------------------------------------------- |
| `npm install`   | Pasang dependensi                                                      |
| `npm run dev`   | Vite + server dengan reload; web diproksikan ke server                 |
| `npm start`     | Build lalu jalankan di satu port (dipakai untuk demo dan juri, NFR-07) |
| `npm test`      | Vitest                                                                 |
| `npm run e2e`   | Playwright: satu balapan penuh melawan 3 bot                           |
| `npm run check` | `tsc --noEmit` + Prettier + `check-content`                            |
| `npm run load`  | 5 room × 4 peserta bersamaan; mencetak latensi p95 (NFR-03, NFR-04)    |

Pemain lain di WiFi yang sama membuka `http://<IP-laptop>:3000`. IP ini dicetak server saat start.

## 11. Tes

- **Unit (wajib, paling banyak):** `game.ts` (benar/salah, lock, finish, soal habis, semua aturan peringkat FR-B10), `bots.ts` (seed sama, hasil sama), `nickname.ts`, `check.ts` (satu contoh keluaran buruk per aturan FR-H08), `summary.ts`, dan validasi `content/`.
- **E2E:** satu skenario Playwright: isi nickname, pilih hewan, Lawan bot, jawab sampai balapan berakhir, podium, Evaluasi dengan `AI_MODE=mock`.
- **Beban:** `npm run load` sekali sebelum freeze 13 Nov. Hasilnya dicatat di README.
- CI (GitHub Actions) menjalankan `npm run check` dan `npm test` di setiap PR.

## 12. Panduan kalau ada bug

1. **Ambil bukti.** Salin baris log JSON di sekitar error. Setiap baris memuat `roomId`, `seed`, `event`, dan `phase`, tanpa nickname. Untuk masalah tampilan, buka `?debug=1` dan screenshot panel state.
2. **Ulangi.** Jalankan `SEED=<seed dari log> npm run dev` dan Lawan bot. Urutan soal dan perilaku bot akan sama.
3. **Tentukan tempatnya.**
   - Angka salah (langkah, peringkat, lock) → `src/shared/game.ts`.
   - Tidak sinkron atau tidak terkirim → `src/server/room.ts` dan `src/client/socket.ts`.
   - Tampilan → `src/client/screens/`.
   - Evaluasi kosong atau badge salah → `src/server/evaluate/`. Cek log `eval.fallback` dan alasannya.
   - Server tidak mau start → biasanya `content/`. Jalankan `npm run check`.
4. **Tulis tes yang gagal** di `tests/` dengan seed itu, sebelum memperbaiki.
5. **Perbaiki sekecil mungkin**, lalu jalankan `npm run check && npm test`.
6. **Prompt untuk agen AI:** "Ini log-nya: … Seed: … Langkah yang saya lakukan: … Yang terjadi: … Yang seharusnya (FR-xx): … Tulis dulu tes yang gagal di tests/, lalu perbaiki dengan perubahan sekecil mungkin. Jangan mengubah file di luar <folder>."

Masalah yang sering terjadi:

| Gejala                               | Cek dulu                                                                |
| ------------------------------------ | ----------------------------------------------------------------------- |
| HP tidak bisa membuka game           | Laptop dan HP di WiFi yang sama? Firewall laptop mengizinkan port 3000? |
| Evaluasi selalu "Ringkasan otomatis" | `AI_MODE`, `GEMINI_API_KEY`, dan alasan di log `eval.fallback`          |
| Gerak hewan terlambat                | `npm run load`; cek apakah ada `await` di dalam loop room               |
| Tes bot tidak stabil                 | Ada `Math.random()` atau `Date.now()` di luar `rng.ts`/argumen?         |

## 13. Keamanan dan privasi

| NFR                    | Penerapan                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-08 Anti-curang     | `room:state` tidak memuat kunci; `game.ts` menolak jawaban kedua dan jawaban saat `locked`; API key hanya dibaca di `src/server`                           |
| NFR-09 Data pemain     | Semua state di `Map` memori; `log.ts` hanya menerima field yang diizinkan, sehingga nickname tidak bisa masuk log                                          |
| NFR-10 Transparansi AI | Badge dari field `source` di `eval:ready`; README menjelaskan isi yang dikirim ke Gemini dan bahwa tier gratis dapat dipakai Google untuk perbaikan produk |
| FR-M02 Filter          | Dicek di `nickname.ts` di server, bukan di browser                                                                                                         |

## 14. Terbuka

- [OPEN] Nama model Gemini Flash dan batas kuota gratisnya (dicek saat setup).
- [OPEN] Path SVG persis di repo Noto Emoji (§8 langkah 1).
- [OPEN] Siapa pemegang `GEMINI_API_KEY` (dibahas di PLAN).
- Tampilan lintasan, warna slot, dan animasi dibahas di DESIGN.

## 15. Self-review

- Setiap FR yang menyangkut server (FR-M02, M06, B03–B11, H06–H12, K11) punya modul di §3.
- Semua parameter frd/00 §2 hanya ada di `constants.ts`.
- Tidak ada jalur dari `evaluate/` ke `game.ts`, sehingga AI tidak bisa mengubah peringkat.
- **Risiko:** tier gratis Gemini bisa kena batas kuota saat demo. Mitigasinya fallback otomatis dan mode `contoh` untuk video.
