# LOGICODIX 2026 — EcoRush

Game balap multiplayer berbasis web untuk siswa SMP: setiap soal adalah satu klaim lingkungan
(Benar/Salah via 4 pilihan penjelasan). Jawaban benar memajukan hewan pelari; jawaban salah
membuat hewan diam + penjelasan bersumber terkunci 5 detik. Finish di jawaban benar ke-5.
Setelah podium, tiap pemain mendapat **Evaluasi AI** atas pola kesalahannya.

> **Status:** MVP lengkap (T-01 sampai T-22). Seluruh alur dari Beranda, Antrean Quick Match, Balapan lawan bot/manusia, Reconnect, Podium, hingga Evaluasi AI & Fallback berfungsi penuh. Konten bank soal saat ini 12 draf menunggu verifikasi sumber resmi oleh tim C + D (D-58). Server produksi mensyaratkan ≥10 soal terverifikasi (FR-K01); server demo/uji dapat memakai soal draf/dummy.

## Jalankan

```bash
bun install
bun run dev        # Vite (5173, proxy socket) + server (3000)
bun run build      # build web ke dist/
bun start          # satu port: web + Socket.IO (untuk demo & juri, NFR-07)
```

Perintah lain: `bun test` (Vitest), `bun run check` (tsc + Prettier + validator konten),
`bun run check-content`, `bun run load` (5 room × 4 peserta), `bun run e2e` (Playwright; butuh `npx playwright install chrome` sekali).

Evaluasi AI live: `.env` tidak dibaca otomatis. Set lewat env shell, mis.
`AI_MODE=live GEMINI_API_KEY=... bun start` (model bawaan `gemini-3.1-flash-lite`, ganti dengan `GEMINI_MODEL`).
Cek key tanpa menjalankan game: `GEMINI_API_KEY=... bun run ai-live`. Tanpa key, mode `live` turun ke `contoh`.

Tanpa soal terverifikasi, `bun start` menolak jalan (FR-K01). Untuk demo/uji lokal pakai `bun run start:dummy` (port 3000, soal dummy).

Demo: buka 2+ jendela browser di `http://localhost:3000` + mode "Lawan bot" (D-49 localhost-first).

## Deploy

Server ini Express + Socket.IO **satu port**: menyajikan `dist/` sekaligus WebSocket. Tanpa DB;
semua room di memori, jadi restart menghapus room aktif.

### A. Satu server (Render/Railway/Fly/VPS)

- Build: `npm install && npm run build`
- Start: `npm start` (`NODE_ENV=production`, butuh devDependencies `tsx`/`vite` — jangan `--omit=dev`)
- Health check: `/health`
- Env: `PORT`, `AI_MODE`, `GEMINI_API_KEY`, `GEMINI_MODEL`. `CLIENT_ORIGIN` dikosongkan (same-origin).

### B. Frontend terpisah (Vercel/Netlify) + backend Node

Vercel/Netlify dipakai hanya untuk `dist/` statis; WebSocket tetap di backend Node.

1. Backend (Render/Railway): set `CLIENT_ORIGIN=https://<domain-frontend>` supaya CORS API dan
   Socket.IO mengizinkan origin itu.
2. Frontend: build dengan `VITE_SERVER_URL=https://<domain-backend> npm run build`, lalu unggah
   `dist/`. `VITE_SERVER_URL` dibaca saat build (`src/client/server-url.ts`); kosong = same-origin.

WebSocket di belakang Nginx wajib teruskan upgrade:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_read_timeout 3600;
}
```

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

## Hasil Uji Beban (NFR-03, NFR-04)

Uji beban simultan 5 room × 4 peserta (20 koneksi WebSocket bersamaan) dijalankan melalui `bun run load` (`scripts/load-test.ts`):

- **Room selesai:** 5 / 5 (100%)
- **Koneksi aktif simultan:** 20 peserta (4 peserta per room)
- **Latensi room:state:** p50 141 ms, p95 151 ms
- **Latensi race:feedback:** p50 6 ms, p95 7 ms
- **Latensi gabungan (keseluruhan):** p50 8 ms, **p95 149 ms** (ambang batas: ≤ 250 ms), p99 151 ms
- **Hasil:** **LULUS (PASS)** — memenuhi persyaratan NFR-03 dan NFR-04.

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

- **Hewan & Dekorasi Lingkungan:** Menggunakan Google Noto Emoji SVG (lisensi Apache 2.0). Salinan lisensi lengkap tersedia di `docs/licenses/noto-emoji-LICENSE`. Pengunduhan dan pemetaan berkas tercatat rinci di `docs/ASSETS.md`.
- **Tipografi:** Plus Jakarta Sans oleh Gumpita Rahayu / Tokotype (lisensi SIL Open Font License 1.1). Salinan lisensi tersedia di `docs/licenses/plus-jakarta-sans-OFL.txt`.
- Seluruh aset visual mematuhi prinsip _Green IT_ (hanya SVG/vektor ringan, tanpa foto resolusi tinggi, hanya palet mode terang ramah kontras).
