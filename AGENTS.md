# AGENTS.md

Aturan untuk semua agen AI pengoding (OpenCode, Codex, Copilot, Claude, dan lainnya) di repo ini. File ini satu-satunya sumber aturan agen. `CLAUDE.md` dan `.github/copilot-instructions.md` hanya menunjuk ke sini.  
Versi 0.3 · 2026-11-05 · Keputusan: D-62, D-65

## 1. Baca dulu

| Untuk | Baca |
|---|---|
| Apa yang harus dibuat | Issue tugas, lalu requirement FR yang disebut di `docs/frd/` |
| Istilah | `docs/CONTEXT.md`. Pakai istilahnya, hindari daftar _Avoid_. |
| Di mana dan bagaimana kode ditulis | `docs/ARCHITECTURE.md` (§3 folder, §6 kontrak socket, §12 bug) |
| Tampilan | `docs/DESIGN.md` + frame Figma yang disebut di issue |
| Alur kerja tim | `docs/WORKFLOW.md` |
| Keputusan dan alasannya | `docs/01-decisions.md` |

Kalau dokumen bertentangan: FRD dan D-xx menang atas ARCHITECTURE/DESIGN, dan ARCHITECTURE/DESIGN menang atas kebiasaanmu sendiri.

## 2. Aturan produk yang tidak boleh dilanggar

1. Benar/salah, langkah, waktu, dan peringkat dihitung **hanya di server** dari kunci buatan manusia (`src/shared/game.ts`). AI tidak pernah memengaruhinya.
2. Kunci, penjelasan, dan sumber **tidak dikirim ke browser** sebelum soal dijawab (FR-K11).
3. Nickname, ID koneksi, dan data peserta lain **tidak pernah** dikirim ke AI atau ditulis ke log (FR-H06, NFR-09).
4. Semua angka parameter hanya ada di `src/shared/constants.ts`.
5. Semua teks dari AI melewati `evaluate/check.ts`. Kalau gagal, tampilkan ringkasan otomatis berlabel "bukan AI".
6. Acak dan waktu hanya lewat `rng.ts` dan argumen. Jangan memakai `Math.random()` atau `Date.now()` di logika game.
7. Teks UI dalam bahasa Indonesia, sesuai DESIGN.md §7.
8. Warna, jarak, dan font hanya dari token CSS (DESIGN.md §2). Jangan menulis hex langsung.

## 3. Langkah kerja per tugas

1. Pastikan berada di branch `<peran>/<T-xx>-<slug>` yang dibuat dari `main` terbaru, bukan di `main`.
2. Baca issue, FR terkait, dan bagian ARCHITECTURE/DESIGN yang relevan.
3. Tulis tes yang gagal untuk perilaku baru di `tests/`.
4. Implementasikan dengan perubahan sekecil mungkin. Jangan menambah fitur yang tidak diminta FR (YAGNI).
5. Jalankan `npm run check && npm test` sampai lulus.
6. Commit dengan format `<type>(<area>): <ringkasan> (<FR-xx>)`.
7. Push branch, lalu buka PR dengan template, `Closes #<issue>`, dan screenshot kalau mengubah tampilan.
8. Laporkan ke manusia: apa yang diubah, cara mengetes, dan apa yang belum selesai.

Untuk bug, ikuti `docs/ARCHITECTURE.md` §12: ambil log/seed, ulangi, tulis tes yang gagal, lalu perbaiki.

## 4. Boleh dan dilarang

**Boleh:** membuat branch, commit, push branch sendiri, membuka PR, me-merge PR sesuai WORKFLOW §4, menambah dependency (sebutkan alasannya di PR), dan mengubah CI.

**Dilarang keras:**
- `git push --force` atau `--force-with-lease`, di branch mana pun
- push langsung ke `main`
- commit rahasia: `.env`, API key, token. Pakai `.env.example` dengan nilai kosong
- mengubah `status` soal menjadi `terverifikasi`, atau mengisi `reviewedBy`/`reviewedAt`. Agen hanya boleh membuat draf soal dengan `status: "draf"` (D-58)
- mengarang sumber, angka, atau kutipan lembaga. Kalau sumber belum ada, tulis `TODO-SUMBER` dan biarkan status `draf`
- melewati, menghapus, atau melemahkan tes supaya CI hijau
- menyelesaikan konflik di folder milik orang lain atau di `src/shared/` tanpa bertanya (lihat §6)

## 5. Peran reviewer

Kalau kamu dijalankan sebagai **reviewer PR**, pakai prompt ini:

```
Kamu reviewer PR #<nomor> di repo ini. Jangan mengubah kode.
1. Baca AGENTS.md, issue yang ditutup PR, dan FR yang disebut.
2. Baca diff lengkap (gh pr diff <nomor>) dan cek CI (gh pr checks <nomor>).
3. Periksa: (a) FR terpenuhi sesuai acceptance criteria, (b) aturan §2 dan §4 tidak dilanggar,
   (c) ada tes untuk perilaku baru, (d) tidak ada kode mati, duplikasi, atau fitur di luar FR,
   (e) teks UI bahasa Indonesia dan token desain dipakai, (f) tidak ada rahasia.
4. Tulis satu review: baris pertama "VERDICT: APPROVE" atau "VERDICT: REQUEST_CHANGES",
   lalu daftar temuan: file:baris — masalah — saran. Maksimal 10 temuan, yang paling penting dulu.
   Kirim dengan: gh pr review <nomor> --comment --body-file review.md
5. APPROVE hanya kalau tidak ada temuan berat dan CI hijau.
6. Wajib minta manusia melihat dulu kalau PR mengubah content/, src/shared/schema.ts, atau .github/workflows/.
```

Merge (`gh pr merge <nomor> --squash --delete-branch`) hanya boleh setelah VERDICT terakhir APPROVE untuk commit terbaru dan CI hijau.

## 6. Konflik

- Update branch dengan `git fetch origin && git merge origin/main`. Jangan rebase.
- Konflik hanya di folder milik peranmu (WORKFLOW §8): selesaikan, lalu jalankan `npm run check && npm test`.
- Konflik di folder orang lain atau di `src/shared/`: **berhenti**. Tulis file mana yang konflik dan dua versinya, lalu minta manusia memutuskan.

## 7. Kalau ragu

Berhenti dan bertanya kalau tugas meminta sesuatu yang bertentangan dengan §2 atau §4, butuh mengubah kontrak `schema.ts` di luar issue, atau FR-nya ambigu. Lebih baik satu pertanyaan daripada PR yang harus dibuang.
