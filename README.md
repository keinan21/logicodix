# 🌿 EcoRush — Balapan Edukasi Lingkungan

[![CI](https://github.com/keinan21/logicodix/actions/workflows/ci.yml/badge.svg)](https://github.com/keinan21/logicodix/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-22_LTS-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**EcoRush** adalah game balap multiplayer berbasis web untuk siswa SMP. Setiap soal adalah satu klaim lingkungan — jawab benar, pelarimu melaju; jawab salah, baca penjelasan bersumber. Setelah podium, tiap pemain mendapat **Evaluasi AI** atas pola kesalahannya.

> Dibuat untuk hackathon LOGICODIX 2026 oleh tim Ravly, Keinan, Bagas, dan Dhanxxi.

---

## ✨ Fitur

| Fitur                     | Keterangan                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------- |
| 🏁 Balapan real-time      | Socket.IO · matchmaking otomatis · lawan bot atau manusia                           |
| ❓ 102 soal terverifikasi | Klaim lingkungan dengan 4 pilihan penjelasan · sumber resmi                         |
| ⏸️ Jeda & Keluar          | Pause saat lawan bot · keluar ke beranda kapan saja                                 |
| 🤖 Evaluasi AI            | Gemini Flash merangkum pola kesalahan — bukan menilai benar/salah                   |
| 🔒 Transparan             | Kunci & skor hanya dari server + kunci buatan manusia. Nickname tidak dikirim ke AI |
| 🎵 Audio                  | Musik latar + SFX (CC0 / CC-BY / CC-BY 4.0) · tombol bisu pojok kanan bawah         |
| ♻️ Green IT               | Satu port, tanpa database, tanpa akun tersimpan. Data hilang setelah sesi           |

---

## 🚀 Jalankan Lokal

### Prasyarat

- Node.js 22 LTS atau lebih baru
- npm (sudah bundel bersama Node.js)

### Langkah

```bash
# 1. Clone dan masuk folder
git clone https://github.com/keinan21/logicodix.git
cd logicodix

# 2. Pasang dependensi
npm install

# 3. Salin file konfigurasi
cp .env.example .env

# 4. (Opsional) Isi GEMINI_API_KEY untuk Evaluasi AI live
#    Edit .env, ubah AI_MODE=mock menjadi AI_MODE=live dan isi key-nya

# 5. Jalankan
npm start          # satu port: web + Socket.IO → http://localhost:3000
```

Untuk development dengan hot-reload:

```bash
npm run dev        # Vite (5173) + server (3000) secara bersamaan
```

### Variabel Lingkungan (`.env`)

| Variabel         | Default                 | Keterangan                                                     |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| `PORT`           | `3000`                  | Port server                                                    |
| `AI_MODE`        | `mock`                  | `live` (Gemini), `contoh` (pregenerated), `mock` (teks statis) |
| `GEMINI_API_KEY` | –                       | Kunci API Gemini. Jangan di-commit                             |
| `GEMINI_MODEL`   | `gemini-3.1-flash-lite` | Model Gemini yang dipakai                                      |
| `SEED`           | acak                    | Kunci seed untuk debugging deterministik                       |

### Demo Multiplayer Lokal

```bash
# Buka 2+ tab browser di URL yang sama
http://localhost:3000

# Klik "Main" di tiap tab → matchmaking otomatis
# Atau "Lawan bot" untuk solo
```

Pemain di jaringan yang sama: buka `http://<IP-laptop>:3000` (IP dicetak server saat start).

### Troubleshoot

| Gejala                                 | Solusi                                                         |
| -------------------------------------- | -------------------------------------------------------------- |
| `Error: not enough verified questions` | Jalankan `npm run check` — validasi konten gagal               |
| HP tidak bisa buka game                | Pastikan laptop & HP di WiFi yang sama, cek firewall port 3000 |
| Evaluasi selalu "bukan AI"             | Cek `AI_MODE` di `.env` dan isi `GEMINI_API_KEY`               |
| Soal yang muncul itu-itu saja          | Jangan set `SEED` — biarkan acak per sesi                      |

---

## 🏗️ Arsitektur

```
src/shared/   schema (zod), game (murni), bots, rng, constants
src/server/   Express 5 + Socket.IO 4 · matchmaking · room · evaluate/
src/client/   React + Vite · screens · components · socket.ts · styles.css
content/      questions/ (102 soal) · tips.json · animals.json · contoh/
tests/        Vitest unit + integrasi · scripts/ load-test · check-content
docs/         ARCHITECTURE.md · FRONTEND.md · frd/ · DESIGN.md · ASSETS.md
```

**Prinsip inti:**

- Benar/salah, langkah, waktu, dan peringkat **hanya dihitung server** dari kunci buatan manusia.
- Kunci & penjelasan **tidak dikirim ke browser** sebelum soal dijawab (FR-K11).
- Nickname & data peserta lain **tidak pernah ke AI atau log** (FR-H06).
- Semua parameter angka hanya di `src/shared/constants.ts`.

Dokumentasi teknikal lengkap: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (backend) dan [`docs/FRONTEND.md`](docs/FRONTEND.md) (frontend).

---

## 🤖 Evaluasi AI & Privasi

- **Yang dikirim ke AI:** ID soal, jenis, pilihan pemain, kunci, penjelasan tim, tipe misinformasi, topik. Nickname **tidak dikirim.**
- Keluaran AI diperiksa otomatis (`evaluate/check.ts`). Gagal → fallback "Ringkasan otomatis (bukan AI)".
- Timeout 8 detik. Bila gagal, alur tetap berjalan dan diberi label jelas.
- Data room hanya di memori, dihapus setelah sesi. Tanpa akun, tanpa DB.

---

## 📊 Hasil Uji Beban

5 room × 4 peserta (20 koneksi WebSocket simultan) via `npm run load`:

| Metrik                      | Hasil        | Batas       |
| --------------------------- | ------------ | ----------- |
| Room selesai                | 5 / 5 (100%) | —           |
| Latensi `room:state` p95    | 151 ms       | —           |
| Latensi `race:feedback` p95 | 7 ms         | —           |
| Latensi gabungan p95        | **149 ms**   | ≤ 250 ms ✅ |

---

## 🧪 Perintah Lain

```bash
npm test              # Vitest: 143 tes unit + integrasi
npm run check         # tsc + Prettier + validasi konten
npm run e2e           # Playwright end-to-end (butuh npx playwright install sekali)
npm run load          # uji beban: 5 room × 4 peserta simultan
npm run check-content # validasi bank soal tanpa menjalankan server
```

---

## 📋 Bank Soal

`content/questions/` berisi **102 soal terverifikasi** klaim lingkungan dengan format:

```json
{
  "id": "uuid",
  "status": "terverifikasi",
  "kind": "claim",
  "stem": "Pertanyaan...",
  "claim": "Klaim yang diklaim...",
  "options": ["A", "B", "C", "D"],
  "answerIndex": 0,
  "explanation": "Penjelasan jawaban benar...",
  "sources": [{ "judul": "...", "url": "...", "lembaga": "..." }],
  "topic": "air",
  "misinfoType": "salah-konteks"
}
```

Agen AI hanya boleh membuat soal `status: "draf"`. Verifikasi hanya oleh manusia. Lihat [`AGENTS.md`](AGENTS.md).

---

## 🎨 Lisensi Aset

| Aset                              | Sumber                      | Lisensi             |
| --------------------------------- | --------------------------- | ------------------- |
| Hewan & dekorasi                  | Google Noto Emoji SVG       | Apache 2.0          |
| Tipografi (Plus Jakarta Sans)     | Gumpita Rahayu / Tokotype   | OFL 1.1             |
| Tipografi (Fredoka)               | —                           | OFL 1.1             |
| UI pack                           | DEMO Cozy UI Pack — dobo_ui | Lisensi DEMO gratis |
| UI pack                           | Kenney UI Pack Adventure    | CC0                 |
| Musik — Town Theme RPG            | cynicmusic (OpenGameArt)    | CC0                 |
| Musik — Platformer Music Pack     | CodeManu (OpenGameArt)      | CC-BY 3.0           |
| SFX — Cute, Cozy & Magical UI SFX | Nomagician Music            | CC BY 4.0           |

Detail lengkap di [`docs/ASSETS.md`](docs/ASSETS.md) dan [`docs/licenses/`](docs/licenses/).
