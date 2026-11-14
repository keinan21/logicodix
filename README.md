# 🌿 EcoRush — Balapan Edukasi Lingkungan

[![CI](https://github.com/keinan21/logicodix/actions/workflows/ci.yml/badge.svg)](https://github.com/keinan21/logicodix/actions/workflows/ci.yml)

**EcoRush** adalah game balap multiplayer berbasis web untuk siswa SMP. Setiap soal adalah satu klaim lingkungan — jawab benar, pelarimu melaju; jawab salah, baca penjelasan bersumber. Setelah podium, tiap pemain mendapat **Evaluasi AI** atas pola kesalahannya.

> Dibuat untuk hackathon LOGICODIX 2026 oleh tim Ravly, Keinan, Bagas, dan Dhanxxi.

---

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| 🏁 Balapan real-time | Socket.IO · matchmaking · lawan bot atau manusia |
| 🤖 Evaluasi AI | Gemini Flash merangkum pola kesalahan — bukan menilai benar/salah |
| 🔒 Transparan | Kunci & skor hanya dari server + kunci buatan manusia. Nickname tidak dikirim ke AI |
| 🎵 Audio | Musik latar + SFX (CC0 / CC-BY) · tombol bisu di pojok kanan bawah |
| ♻️ Green IT | Satu port, tanpa database, tanpa akun tersimpan. Data hilang setelah sesi |

---

## 🚀 Jalankan

```bash
npm install
npm run dev        # Vite (5173, proxy socket) + server (3000)
npm run build      # build web ke dist/
npm start          # satu port: web + Socket.IO (untuk demo & juri)
```

Perintah lain:

```bash
npm test                  # Vitest unit + integrasi (143 tes)
npm run check             # tsc + Prettier + validator konten
npm run e2e               # Playwright (butuh npx playwright install sekali)
npm run load              # uji beban: 5 room × 4 peserta simultan
```

### Evaluasi AI live

```bash
AI_MODE=live GEMINI_API_KEY=<key> npm start
```

Model bawaan `gemini-3.1-flash-lite`, ganti dengan `GEMINI_MODEL=...`. Tanpa key, mode `live` turun otomatis ke `contoh`.

### Demo lokal multiplayer

Buka 2+ jendela browser di `http://localhost:3000` → klik **Main** di tiap jendela untuk matchmaking, atau **Lawan bot** untuk solo.

---

## 🏗️ Arsitektur

```
src/shared/   schema (zod), game (murni), bots, rng, constants
src/server/   Express 5 + Socket.IO 4 · matchmaking · room · evaluate/
src/client/   React + Vite · screens · components · socket.ts · styles.css
content/      questions/ · tips.json · animals.json · contoh/
tests/        Vitest unit + integrasi · scripts/ load-test · check-content
```

**Prinsip utama:**
- Benar/salah, langkah, waktu, dan peringkat **hanya dihitung server** dari kunci buatan manusia.
- Kunci & penjelasan **tidak dikirim ke browser** sebelum soal dijawab (FR-K11).
- Nickname & data peserta lain **tidak pernah ke AI atau log** (FR-H06).
- Semua parameter angka hanya di `src/shared/constants.ts`.
- Acak & waktu hanya lewat `rng.ts`. Tidak ada `Math.random()` / `Date.now()` di logika game.

---

## 🤖 Evaluasi AI & Privasi

- Yang dikirim ke AI: ID soal, jenis, pilihan pemain, kunci, penjelasan tim, tipe misinformasi, topik. **Nickname tidak dikirim.**
- Keluaran AI diperiksa otomatis (`evaluate/check.ts`): tanpa URL, tanpa angka asing, tanpa kunci berbeda. Gagal → dibuang → fallback "Ringkasan otomatis (bukan AI)".
- Timeout 8 detik. Bila gagal, alur tetap berjalan dan diberi label jelas.
- Data room hanya di memori, dihapus setelah sesi. Tanpa akun, tanpa DB.

---

## 📊 Hasil Uji Beban

5 room × 4 peserta (20 koneksi WebSocket simultan) via `npm run load`:

| Metrik | Hasil | Batas |
|---|---|---|
| Room selesai | 5 / 5 (100%) | — |
| Latensi `room:state` p95 | 151 ms | — |
| Latensi `race:feedback` p95 | 7 ms | — |
| Latensi gabungan p95 | **149 ms** | ≤ 250 ms ✅ |

---

## 🎨 Lisensi Aset

| Aset | Sumber | Lisensi |
|---|---|---|
| Hewan & dekorasi | Google Noto Emoji SVG | Apache 2.0 |
| Tipografi (Plus Jakarta Sans) | Gumpita Rahayu / Tokotype | OFL 1.1 |
| Tipografi (Fredoka) | — | OFL 1.1 |
| UI pack | DEMO Cozy UI Pack — dobo_ui | Lisensi DEMO gratis |
| UI pack | Kenney UI Pack Adventure | CC0 |
| Musik — Town Theme RPG | cynicmusic (OpenGameArt) | CC0 |
| Musik — Platformer Music Pack | CodeManu (OpenGameArt) | CC-BY 3.0 |
| SFX — Cute, Cozy & Magical UI SFX | Nomagician Music | CC BY 4.0 |

Detail lengkap di [`docs/ASSETS.md`](docs/ASSETS.md) dan [`docs/licenses/`](docs/licenses/).
