# WORKFLOW

Status: Draft  
Version: 0.3 (menggantikan strawman v0.2 di `archive/WORKFLOW-strawman.md`)  
Depends on: 01-decisions.md (D-62, D-64, D-65); PLAN.md v0.2; ARCHITECTURE.md v0.2; AGENTS.md  
Last updated: 2026-11-05

Cara tim bekerja dari issue sampai merge. Aturan yang wajib diikuti agen AI ada di `AGENTS.md`. Dokumen ini untuk manusia dan menjelaskan alasannya.

## 1. Alur satu tugas

```
Issue T-xx ─▶ branch b/T-03-game-logic ─▶ agen menulis tes + kode ─▶ npm run check && npm test
   ─▶ PR (template) ─▶ CI hijau ─▶ agen reviewer: APPROVE / REQUEST_CHANGES
   ─▶ perbaiki sampai APPROVE ─▶ squash merge ─▶ issue tertutup otomatis ─▶ board: Done
```

1. **Ambil issue** dari board, pindahkan ke In progress, dan assign ke dirimu.
2. **Buat branch** dari `main` terbaru: `git switch main && git pull && git switch -c <peran>/<T-xx>-<slug>`. Peran ditulis `a`, `b`, `c`, atau `d`.
3. **Kerjakan dengan agen** sesuai langkah di AGENTS.md §3.
4. **Push dan buka PR** memakai template, lalu tulis `Closes #<nomor issue>` di deskripsi.
5. **Review** oleh agen reviewer (§4). Kalau ada REQUEST_CHANGES, perbaiki di branch yang sama.
6. **Merge** dengan squash setelah APPROVE dan CI hijau. Hapus branch-nya.

## 2. Aturan branch dan `main`

| Aturan      | Isi                                                                         |
| ----------- | --------------------------------------------------------------------------- |
| `main`      | Dikunci: wajib lewat PR, CI wajib hijau, tidak bisa force-push atau dihapus |
| Nama branch | `<peran>/<T-xx>-<slug>`, contoh `a/T-09-race-screen`                        |
| Umur branch | Sependek mungkin, idealnya ≤ 1 hari                                         |
| Merge       | Squash merge saja; judul commit mengikuti §6                                |
| Force-push  | Dilarang di mana pun                                                        |

**Setting GitHub (dikerjakan B saat P-05):**

- Settings → Branches → aturan untuk `main`: Require a pull request; Require status checks (`ci`); Block force pushes; jangan wajibkan jumlah approval, karena review dilakukan agen (§4).
- Settings → General → Pull Requests: hanya izinkan squash merging dan centang auto-delete head branches.
- Settings → Code security: aktifkan secret scanning dan push protection. Kalau repo private dan fitur ini tidak tersedia, langkah gitleaks di CI (§7) jadi pengamannya.

## 3. Pull request

- Satu PR untuk satu tugas T-xx, sekitar ≤ 400 baris berubah di luar `package-lock.json` dan `content/`.
- Wajib memakai template `.github/pull_request_template.md` (lihat `repo-template/`).
- Perubahan tampilan wajib menyertakan screenshot HP 360 px dan laptop.
- Perubahan `src/shared/schema.ts` dibuat sebagai PR tersendiri dan dibuka lebih dulu, karena client dan server sama-sama bergantung padanya.

## 4. Review oleh agen

- Reviewer adalah **sesi agen terpisah** dari agen yang menulis kode. Bisa sesi OpenCode lain, Codex, atau Copilot, memakai prompt reviewer di AGENTS.md §5.
- Reviewer menulis hasil sebagai review/komentar PR dengan putusan **APPROVE** atau **REQUEST_CHANGES**, beserta daftar temuan (file, baris, masalah, saran).
- Merge hanya boleh setelah putusan terakhir APPROVE pada commit terbaru dan CI hijau.
- GitHub tidak mengizinkan akun pembuat PR meng-approve PR-nya sendiri. Karena itu putusan reviewer ditulis sebagai komentar review, dan branch protection tidak mewajibkan approval.
- Manusia boleh ikut me-review kapan saja, dan komentar manusia mengalahkan putusan agen.
- **Wajib dilihat manusia sebelum merge:** PR yang mengubah `content/` (soal, kunci, sumber), `src/shared/schema.ts`, atau `.github/workflows/`.

## 5. Konflik

1. Update branch dengan **merge**, bukan rebase: `git fetch origin && git merge origin/main`.
2. Konflik di folder milikmu boleh diselesaikan sendiri atau oleh agen. Setelah itu jalankan `npm run check && npm test`.
3. Konflik di folder milik orang lain (§8) atau di `src/shared/` diselesaikan bersama pemiliknya. Agen berhenti dan bertanya.
4. Jangan pernah menyelesaikan konflik dengan membuang perubahan orang lain tanpa bertanya.

## 6. Commit

Format Conventional Commits dengan ID FR:

```
<type>(<area>): <ringkasan bahasa Indonesia> (<FR-xx>)
```

- `type`: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `content`, `style`
- `area`: `race`, `match`, `eval`, `content`, `ui`, `server`, `shared`, `ci`
- Contoh: `feat(race): kunci 5 detik setelah salah (FR-B05)`, `content: tambah soal klaim catut otoritas (FR-K03)`

## 7. CI

Satu workflow `ci` di setiap PR dan push ke `main`:

1. `npm ci`
2. `npm run check`: tsc, Prettier, validasi konten
3. `npm test`
4. Secret scan (gitleaks)
5. Mulai 11 Nov: `npm run e2e`

CI merah berarti PR tidak boleh di-merge. Tes tidak boleh di-skip atau dihapus hanya supaya CI hijau.

## 8. Kepemilikan folder

| Folder                                                                  | Pemilik           |
| ----------------------------------------------------------------------- | ----------------- |
| `src/server/`, `src/shared/`, `scripts/`, `.github/workflows/`          | B (@RavLyr)       |
| `src/client/` (kecuali `components/`, `styles.css`)                     | A (@KurniaRadhit) |
| `src/client/components/`, `src/client/styles.css`, `src/client/assets/` | D (@keinan21)     |
| `content/`                                                              | C (@rakyan)       |
| `docs/`                                                                 | Semua             |

Pemilik tercatat di `.github/CODEOWNERS`. Mengubah folder orang lain boleh, tapi beri tahu pemiliknya di PR.

## 9. Rahasia dan data

- API key hanya di `.env` lokal, yang sudah masuk `.gitignore`. Repo hanya berisi `.env.example` dengan nilai kosong.
- Key bocor ke commit → segera **cabut key di Google AI Studio dan buat yang baru**. Menghapus commit tidak cukup.
- Log dan screenshot tidak boleh memuat key, `.env`, atau data pribadi.

## 10. Konten soal

- Agen boleh membuat **draf** soal dengan `status: "draf"`.
- Hanya C (penulis) dan D (verifikator) yang membuka sumber, mencocokkan kunci, lalu mengubah status menjadi `terverifikasi` (FRD 04 FR-K07, D-58).
- Server menolak soal berstatus `draf` masuk room.

## 11. File siap pakai

Folder `repo-template/` berisi file yang tinggal disalin B ke repo saat T-01: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.github/pull_request_template.md`, `.github/CODEOWNERS`, `.github/workflows/ci.yml`, `.gitignore`, `.env.example`.
