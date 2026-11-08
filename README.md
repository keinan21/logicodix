# LOGICODIX 2026 — Balap Fakta Lingkungan

Game balap multiplayer berbasis web untuk siswa SMP: setiap soal adalah satu klaim lingkungan
(Benar/Salah via 4 pilihan penjelasan). Jawaban benar memajukan hewan pelari; jawaban salah
membuat hewan diam + penjelasan bersumber terkunci 5 detik. Finish di jawaban benar ke-5.
Setelah podium, tiap pemain mendapat **Evaluasi AI** atas pola kesalahannya.

> **Status:** scaffolding awal (T-01). Konten soal semuanya `draf` — belum terverifikasi.
> Server **sengaja menolak start** sampai ≥10 soal `terverifikasi` (FR-K01).

## Jalankan

```bash
bun install
bun run dev        # Vite (5173, proxy socket) + server (3000)
bun run build      # build web ke dist/
bun start          # satu port: web + Socket.IO (untuk demo & juri, NFR-07)
```

Perintah lain: `bun test` (Vitest), `bun run check` (tsc + Prettier + validator konten),
`bun run check-content`, `bun run load` (5 room × 4 peserta), `bun run e2e` (Playwright, nanti).

Demo: buka 2+ jendela browser di `http://localhost:3000` + mode "Lawan bot" (D-49 localhost-first).

## Aturan utama (wajib dibaca sebelum kontribusi)

- **Kebenaran & peringkat hanya di server**, dari kunci buatan manusia (`src/shared/game.ts`).
  AI tidak pernah menentukan benar/salah, langkah, atau peringkat (AGENTS.md §2.1).
- **Kunci, penjelasan, sumber tidak dikirim ke browser sebelum soal dijawab** (FR-K11).
  Payload soal sebelum menjawab hanya `stem`, `claim`, `options`.
- **Nickname, ID koneksi, data peserta lain tidak pernah ke AI atau log** (FR-H06, NFR-09).
- Semua angka parameter hanya di `src/shared/constants.ts`.
- Acak & waktu hanya lewat `src/shared/rng.ts` dan argumen. Tidak ada `Math.random()` /
  `Date.now()` di logika game.
- Teks UI bahasa Indonesia; warna/jarak/font hanya dari token CSS di `src/client/styles.css`.
- Agen hanya boleh membuat soal `status: "draf"`. Verifikasi (`terverifikasi`, `reviewedBy`,
  `reviewedAt`, sumber) hanya oleh manusia C + D (D-58). Tidak boleh mengarang sumber —
  kalau belum ada, tulis `TODO-SUMBER`.

## Evaluasi AI & privasi (transparansi untuk juri, FRD 03 §5)

- AI dipakai **hanya** setelah balapan, untuk menulis pola kesalahan + tips (maks 400/200 karakter).
- Yang dikirim ke AI: ID soal, jenis soal, pilihan pemain, kunci, penjelasan buatan tim,
  tipe misinformasi, topik. **Nickname tidak dikirim.**
- Keluaran AI diperiksa otomatis (`evaluate/check.ts`): tanpa URL, tanpa angka asing,
  tanpa kunci berbeda, hanya tipe/topik dari input. Gagal → dibuang.
- Bila AI gagal/timeout (8 dtk)/invalid → **Ringkasan otomatis (bukan AI)** dari server.
- Mode: `AI_MODE=live|contoh|mock` (default `mock`). `contoh` memakai evaluasi pregenerated
  untuk demo video. Cache di memori tanpa nickname (FR-H10).
- Data room hanya di memori server, dihapus setelah balapan (D-48). Tanpa akun, tanpa DB.

## Struktur (ARCHITECTURE §3)

```
src/shared/   schema (zod), game (murni), bots, rng, constants — dipakai client+server
src/server/   Express 5 + Socket.IO 4 (satu port), matchmaking, room, content, nickname, evaluate/
src/client/   React + Vite: screens, components, socket.ts (useRoom), styles.css (token)
content/      questions/ (satu file per soal), tips.json, animals.json, official-sources.json, contoh/
tests/        Vitest unit + integrasi room    scripts/  check-content, load-test
```

## Konten

`content/questions/` berisi 12 soal **draf** (8 klaim × 4 tipe misinformasi, 4 pengetahuan)
menunggu verifikasi sumber resmi oleh C + D. Lihat `content/README.md`.

## Lisensi aset

Hewan dari Google Noto Emoji (Apache 2.0 / OFL 1.1) — pengunduhan SVG dicatat di
`docs/ASSETS.md` (TODO T-11). Font Plus Jakarta Sans TODO T-04.
