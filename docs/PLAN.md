# PLAN

Status: Draft  
Version: 0.2 (menggantikan strawman v0.1 di `archive/PLAN-strawman.md`)  
Depends on: PRD.md v0.7; frd/00–04; ARCHITECTURE.md v0.2; DESIGN.md v0.2; 01-decisions.md (bagian lama §10, D-29, D-64)  
Last updated: 2026-11-05

## 1. Tim

| Peran            | Orang (handle GitHub)             | Pegang                                                                        |
| ---------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| A — Frontend     | KurniaRadhit (Nikoo)              | `src/client/`: layar, socket hook, animasi lintasan                           |
| B — Backend & AI | RavLyr (Ravly Ramdhani)           | Repo, CI, `src/shared/`, `src/server/`, Gemini key                            |
| C — Konten       | rakyan                            | `content/`: 12 soal, tips, fakta hewan, skenario mode contoh                  |
| D — UI & QA      | keinan21 (Muhammad Yusuf Sintara) | Token CSS dan komponen dari Figma, aksesibilitas, verifikator soal, QA, video |

- **Waktu kerja fleksibel.** Patokan perencanaan sekitar 3 jam/orang/hari (D-29), tetapi boleh dikebut dalam satu hari. Yang mengikat adalah **tanggal milestone** di §3, bukan jam harian.
- Cadangan 20% untuk bug: hari 12 Nov sengaja ringan.

## 2. Sebelum kickoff (5–6 Nov, tanpa menulis kode aplikasi)

Tergantung aturan panitia soal persiapan sebelum kickoff ([OPEN], tanyakan ke panitia).

| ID   | Tugas                                                                      | Pemilik            | Selesai |
| ---- | -------------------------------------------------------------------------- | ------------------ | ------- |
| P-01 | Desain Figma lewat agen MCP (`design/figma-agent-guide.md`), lalu undang D | Pemilik file Figma | 6 Nov   |
| P-02 | Draf 12 soal (8 klaim, 4 pengetahuan) dengan sumber resmi (FRD 04)         | C                  | 7 Nov   |
| P-03 | Verifikasi 12 soal oleh orang kedua                                        | D                  | 9 Nov   |
| P-04 | Fakta singkat 6 hewan beserta sumber (FR-M14)                              | C                  | 7 Nov   |
| P-05 | Buat repo kosong, proteksi `main`, board GitHub Projects, label            | B                  | 6 Nov   |
| P-06 | API key Gemini dan cek nama model Flash termurah                           | B                  | 6 Nov   |
| P-07 | Storyboard video (`design/video-storyboard.md`) dibaca semua anggota       | Semua              | 6 Nov   |
| P-08 | Tanya panitia: persiapan sebelum kickoff dan mekanisme submit              | Ketua              | 6 Nov   |

## 3. Jadwal dan tugas (7–14 Nov)

Setiap tugas menjadi satu issue. Kolom FR menunjukkan requirement yang diselesaikan.

### 7 Nov — Kerangka berjalan

| ID                                                                               | Tugas                                                                    | Pemilik | FR            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------- | ------------- |
| T-01                                                                             | Kerangka repo sesuai ARCHITECTURE §3, `npm run dev/start/check/test`, CI | B       | NFR-07        |
| T-02                                                                             | `schema.ts`, `constants.ts`, `rng.ts`                                    | B       | –             |
| T-03                                                                             | `game.ts` + tes unit (jawab, lock, finish, soal habis, peringkat)        | B       | B03–B10       |
| T-04                                                                             | Token CSS, font, komponen dasar (Button, AnswerOption, Chip)             | D       | DESIGN §2, §4 |
| T-05                                                                             | Layar Beranda (nickname, pilih hewan) tanpa server                       | A       | M01, M03, M14 |
| T-06                                                                             | `questions.json` versi awal + `check-content`                            | C       | K01–K10       |
| **Milestone:** `npm run dev` membuka Beranda, CI hijau, dan tes `game.ts` lulus. |

### 8–9 Nov — Balapan lawan bot

| ID                                                                                           | Tugas                                                | Pemilik | FR               |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------- | ---------------- |
| T-07                                                                                         | `room.ts`, timer, event socket, `bots.ts`            | B       | B01–B14, M08–M10 |
| T-08                                                                                         | `nickname.ts` + filter kata kasar                    | B       | M01–M02, M04     |
| T-09                                                                                         | Layar Lobby dan Balapan + `useRoom()`                | A       | M11, B02–B09     |
| T-10                                                                                         | Komponen Lane, QuestionCard, CountdownRing + animasi | D       | DESIGN §5–6      |
| T-11                                                                                         | `tips.json` + aset hewan Noto + `docs/ASSETS.md`     | C       | K09, D-61        |
| **Milestone (9 Nov):** satu balapan penuh lawan 3 bot bisa dimainkan dari awal sampai akhir. |

### 10 Nov — Multiplayer dan uji main

| ID                                                                 | Tugas                                                   | Pemilik            | FR                    |
| ------------------------------------------------------------------ | ------------------------------------------------------- | ------------------ | --------------------- |
| T-12                                                               | Antrean quick match + bot pengisi + reconnect           | B                  | M05–M07, M12, B11–B13 |
| T-13                                                               | Layar Antre + status koneksi                            | A                  | M05, M07              |
| T-14                                                               | Uji main bersama: 4 HP di satu WiFi, catat bug ke issue | Semua (D memimpin) | –                     |
| **Milestone:** 4 orang bermain di satu room dari HP masing-masing. |

### 11 Nov — Evaluasi AI

| ID                                                                                     | Tugas                                                                       | Pemilik | FR      |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------- | ------- |
| T-15                                                                                   | `evaluate/` (live, contoh, mock, check, summary, cache)                     | B       | H06–H11 |
| T-16                                                                                   | Layar Podium dan Evaluasi + badge                                           | A       | H01–H05 |
| T-17                                                                                   | 3 skenario sintetis + evaluasi mode contoh + cek 20 jawaban sintetis (D-33) | C       | H11     |
| T-18                                                                                   | Uji aksesibilitas (keyboard, kontras, reduced motion)                       | D       | NFR-05  |
| **Milestone:** alur lengkap dari Beranda sampai Evaluasi, dengan AI live dan fallback. |

### 12 Nov — Polish dan cadangan

| ID   | Tugas                                          | Pemilik | FR             |
| ---- | ---------------------------------------------- | ------- | -------------- |
| T-19 | Tes Playwright satu balapan penuh              | A       | –              |
| T-20 | `load-test.ts` 5 room + perbaikan performa     | B       | NFR-03, NFR-04 |
| T-21 | Polish UI, suara (kalau sempat), layout laptop | A, D    | DESIGN §9      |
| T-22 | Gladi rekam video sesuai storyboard            | D       | –              |

### 13 Nov — Freeze dan video

| ID   | Tugas                                                          | Pemilik       |
| ---- | -------------------------------------------------------------- | ------------- |
| T-23 | Feature freeze pukul 12.00; setelahnya hanya perbaikan bug     | Semua         |
| T-24 | Uji beban final, hasilnya dicatat di README                    | B             |
| T-25 | Rekam dan sunting video 3–5 menit                              | D (dibantu C) |
| T-26 | README: cara menjalankan, penggunaan AI, privasi, lisensi aset | B, C          |

### 14 Nov — Submit

| T-27 | Cek akhir di laptop bersih dengan README, unggah video, submit repo | Semua |

## 4. Batas potong

Kalau milestone terlambat, potong dengan urutan ini: **suara → animasi parallax dan pohon → kerapian layout laptop**.

**MVP utama yang tidak boleh dipotong:** balapan lawan bot, quick match, 12 soal terverifikasi, Evaluasi AI + ringkasan otomatis, mode contoh, dan jalan dengan satu perintah. Room privat sejak awal di luar MVP.

Aturan keputusan: kalau milestone 9 Nov belum tercapai pada 10 Nov malam, multiplayer dikerjakan setelah Evaluasi AI. Video tetap bisa menunjukkan balapan lawan bot.

## 5. Cara kerja

- Issue dan board GitHub Projects dengan kolom To do, In progress, Review, Done. Satu issue per tugas T-xx, berlabel peran dan FR.
- Aturan branch, PR, review, dan konflik ada di WORKFLOW.md dan AGENTS.md (dokumen berikutnya), termasuk aturan untuk agen AI.
- Stand-up singkat lewat chat setiap malam: selesai apa, besok apa, dan apa yang menghambat.

## 6. Definisi selesai (setiap tugas)

- Memenuhi acceptance criteria FR yang disebut.
- `npm run check && npm test` lulus di CI.
- Di-review dan di-approve satu anggota lain sebelum merge.
- Ada screenshot kalau tugasnya mengubah tampilan.

## 7. Risiko

| Risiko                                 | Tanda                          | Tindakan                                                |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------- |
| B kelebihan beban (server + AI + repo) | T-07 belum selesai 9 Nov siang | A mengambil T-08; C membantu T-15 bagian `summary.ts`   |
| Soal belum terverifikasi               | P-03 belum selesai 9 Nov       | Pakai minimal 10 soal (FRD 04), sisanya menyusul        |
| Kuota Gemini habis atau model berubah  | Error 429 di log               | Mode contoh untuk video dan demo                        |
| Akun AI pengoding diblokir atau limit  | Agen tidak bisa dipakai        | Siapkan akun cadangan yang sah (Copilot student, Codex) |
| WiFi lomba bermasalah                  | HP tidak bisa membuka game     | Demo di satu laptop dengan beberapa jendela + Lawan bot |

## 8. Terbuka

- [OPEN] Aturan panitia soal persiapan sebelum kickoff dan mekanisme submit (P-08).
- [OPEN] Nama game.
