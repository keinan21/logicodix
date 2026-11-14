# DESIGN

Status: Draft  
Version: 0.2 (menggantikan strawman v0.1 di `archive/DESIGN-strawman.md`)  
Depends on: PRD.md v0.7; frd/00–04; ARCHITECTURE.md v0.2; 01-decisions.md (D-61, D-63); CONTEXT.md  
Last updated: 2026-11-05

Dokumen ini berisi aturan tampilan. **Figma adalah acuan visual**, sedangkan dokumen ini memuat aturan yang harus dipenuhi Figma dan kode. Arah visual yang disetujui: `design/mockup-v0.1.png` (HP) dan `design/mockup-v0.1-laptop.png` (laptop).

## 1. Arah visual

- Hutan tropis Indonesia, flat, dan cerah. Semua dibuat dengan CSS/SVG, tanpa foto atau gambar besar (Green IT).
- Pengguna anak SMP, jadi tampilannya ramah tapi tidak kekanak-kanakan: sudut membulat sedang, tanpa font kartun, dan tanpa maskot yang berbicara.
- Hijau adalah warna utama. **Ungu khusus untuk AI**: bagian Evaluasi AI dan tombol "Lihat evaluasi AI", supaya AI langsung terlihat di video.
- Hanya mode terang.

## 2. Token

Nama token sama persis di Figma Variables dan CSS (`color/forest-700` ↔ `--color-forest-700`). Kode hanya boleh memakai token, tidak boleh menulis hex langsung.

### Warna

| Token                 | Hex                                | Pakai untuk                                 | Kontras dengan putih   |
| --------------------- | ---------------------------------- | ------------------------------------------- | ---------------------- |
| `forest-900`          | #123D24                            | Judul                                       | 12+                    |
| `forest-700`          | #1F6B3A                            | Tombol utama, header                        | 6.5                    |
| `forest-500`          | #3E9B5C                            | Border fokus                                | –                      |
| `forest-100`          | #E6F4EA                            | Latar kotak penjelasan, pilihan hewan aktif | –                      |
| `earth-500`           | #A47148                            | Podium, garis lajur                         | 4.2 (hanya teks besar) |
| `earth-300`           | #D9B48A                            | Jalur tanah                                 | –                      |
| `sky-100`             | #DDF1FB                            | Langit                                      | –                      |
| `sun-500`             | #F4B400                            | Chip "Soal klaim" (teks `#3A2A00`)          | –                      |
| `ok-600` / `ok-100`   | #1E7B3C / #DCF3E3                  | Jawaban benar                               | 5.3                    |
| `err-600` / `err-100` | #C2352B / #FBE3E1                  | Jawaban salah                               | 5.5                    |
| `ai-600` / `ai-100`   | #6A4FE0 / #F3F0FF                  | Bagian AI saja                              | 5.5                    |
| `ink`                 | #17221B                            | Teks utama                                  | –                      |
| `muted`               | #56645B                            | Teks sekunder (5.9 di atas `bg`)            | –                      |
| `line`                | #D5DED7                            | Border                                      | –                      |
| `bg`                  | #F6FAF6                            | Latar halaman                               | –                      |
| `bot`                 | #6B756E                            | Label lajur dan badge BOT                   | 4.8                    |
| `slot-1` … `slot-4`   | #B8432A, #1F7A70, #2F5FB3, #8A5A00 | Label lajur pemain                          | 5.4, 5.2, 6.2, 5.9     |

Semua pasangan teks/latar sudah dicek ≥ 4.5 (WCAG AA), kecuali `earth-500` yang hanya untuk angka podium berukuran besar (≥ 24 px bold).

### Tipografi

Plus Jakarta Sans, regular (400) dan bold (700), disimpan di repo (NFR-02).

| Token          | HP       | Laptop   | Pakai                       |
| -------------- | -------- | -------- | --------------------------- |
| `text-display` | 26 / 800 | 52 / 800 | Judul beranda               |
| `text-title`   | 19 / 700 | 22 / 700 | Teks soal                   |
| `text-body`    | 16 / 400 | 16 / 400 | Pilihan, penjelasan, isi AI |
| `text-small`   | 14 / 400 | 14 / 400 | Fakta hewan, sumber, tabel  |
| `text-label`   | 12 / 700 | 13 / 700 | Chip, label lajur, badge    |

Teks isi tidak pernah di bawah 16 px (NFR-05). 12–14 px hanya untuk label pendek.

### Jarak, radius, bayangan

- Jarak kelipatan 4: `space-1`=4, `space-2`=8, `space-3`=12, `space-4`=16, `space-6`=24, `space-8`=32.
- Radius: `radius-sm`=8 (ikon huruf), `radius-md`=12 (pilihan, input), `radius-lg`=16 (kartu), `radius-pill`=999.
- Satu bayangan saja: `shadow-card` = 0 2px 8px rgba(0,0,0,.08).

### Gerak

| Token             | Nilai           | Pakai                                               |
| ----------------- | --------------- | --------------------------------------------------- |
| `motion-fast`     | 150 ms          | Hover, tekan                                        |
| `motion-step`     | 400 ms ease-out | Hewan maju satu langkah, pohon tumbuh               |
| `motion-check`    | 1000 ms         | Ikon ✓ di atas hewan (sesuai "Benar" 1 detik, D-57) |
| `motion-bob`      | 600 ms loop     | Hewan bergoyang                                     |
| `motion-parallax` | 30 s loop       | Latar pohon bergeser                                |

## 3. Layar

Setiap layar dibuat di dua ukuran: HP 360 × 760 dan laptop 1280 × 800.

| #   | Layar    | State yang wajib digambar                                                                                              | FR            |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | Beranda  | default (hewan acak terpilih), nickname tidak valid, nickname ditolak filter                                           | M01, M02, M14 |
| 2   | Antre    | menunggu (lama + jumlah pemain), tombol Batal                                                                          | M05, M07      |
| 3   | Lobby    | 4 peserta + hitung mundur 3-2-1                                                                                        | M11           |
| 4   | Balapan  | menunggu jawaban, benar (✓ di atas hewan), salah (✗/✓ + penjelasan + lingkaran 5 dtk), finish (menonton), soal habis   | B02–B08       |
| 5   | Podium   | normal, pemain sendiri disorot                                                                                         | H01           |
| 6   | Evaluasi | AI sedang menyusun, AI selesai, ringkasan otomatis (bukan AI), semua benar (motivasi + Baca lebih lanjut), mode contoh | H02–H05       |
| 7   | Error    | koneksi putus (mencoba lagi), keluar dari room                                                                         | B11           |

Susunan per layar mengikuti mockup v0.1:

- **HP:** header (nomor soal + sisa waktu), lintasan 4 lajur di sepertiga atas, kartu soal di bawah, dan tombol A–D bertumpuk.
- **Laptop:** lintasan selebar layar, kartu soal maksimal 1000 px di tengah, A–D dalam grid 2×2 dengan petunjuk keyboard. Beranda, Podium, dan Evaluasi memakai dua kolom.

## 4. Komponen

| Komponen        | Variant                                                          |
| --------------- | ---------------------------------------------------------------- |
| `Button`        | primary, secondary, ai; default, hover, pressed, disabled, focus |
| `Input`         | default, focus, error                                            |
| `AnimalCard`    | default, selected, focus                                         |
| `AnswerOption`  | default, hover, selected-waiting, correct, wrong, dimmed, focus  |
| `Lane`          | slot-1…4, bot; langkah 0–5; status racing/finish/out             |
| `QuestionCard`  | klaim, pengetahuan; dengan/tanpa penjelasan                      |
| `Chip`          | klaim, pengetahuan, tipe misinformasi, topik                     |
| `CountdownRing` | 5…1                                                              |
| `Badge`         | AI, ringkasan otomatis, contoh AI, BOT                           |
| `ResultRow`     | normal, me, bot                                                  |
| `EvalItem`      | benar (tertutup), salah (terbuka)                                |
| `AIPanel`       | loading, pattern+tip, motivation, fallback, contoh               |

Satu komponen di Figma sama dengan satu komponen React dengan nama yang sama.

## 5. Adegan balapan

- **Lajur:** 4 jalur tanah (`earth-300`) dengan garis putus `earth-500`. Label nickname di kiri memakai warna slot, atau `bot` untuk bot.
- **Posisi:** 6 titik (start + 5 langkah) dibagi rata sampai garis finish kotak-kotak di kanan.
- **Hewan:** 32 px di HP dan **56 px di laptop**, menghadap kanan. Bergoyang saat balapan, dan melompat maju (`motion-step`) saat benar.
- **Pohon:** setiap langkah menumbuhkan satu tunas 🌱 di belakang hewan, di lajur itu.
- **Latar:** satu baris pohon di atas lajur yang bergeser pelan (`motion-parallax`).
- **Finish:** hewan berhenti di garis finish, dan label lajur menampilkan posisi finish (1, 2, …).
- **Keluar:** hewan menjadi abu-abu 50% dan label "Keluar".

## 6. Umpan balik jawaban

| Hasil | Yang tampil                                                                                                                                                            | Lama         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Benar | Ikon ✓ dalam lingkaran `ok-600` di atas hewan pemain, hewan melompat, dan tunas tumbuh. Tanpa teks.                                                                    | 1 dtk (D-57) |
| Salah | Pilihan pemain: border dan ikon ✗ `err-600`. Kunci: border dan ikon ✓ `ok-600`. Pilihan lain diredupkan. Penjelasan + sumber di bawah, `CountdownRing` di pojok kartu. | 5 dtk (D-57) |

- Ikon selalu punya label tersembunyi "Benar" atau "Salah" untuk pembaca layar.
- Status tidak boleh dibedakan dengan warna saja. Selalu ada ikon ✓/✗.

## 7. Teks UI

Bahasa Indonesia, kalimat pendek, dan menyapa dengan "kamu".

| Tempat         | Teks                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Tombol beranda | "Main", "Lawan bot"                                                                                   |
| Label          | "Nickname", "Pilih pelarimu"                                                                          |
| Error nickname | "Nickname 2–16 karakter, hanya huruf, angka, dan spasi", "Nickname tidak boleh mengandung kata kasar" |
| Antre          | "Mencari pemain… (N/4)", "Batal"                                                                      |
| Lobby          | "Siap-siap!" + 3-2-1                                                                                  |
| Balapan        | "Soal N", "Sisa m:ss", "Finish! Posisi ke-N", "Soal habis", "Keluar"                                  |
| Podium         | "Hasil balapan", "Lihat evaluasi AI", "Main lagi"                                                     |
| Evaluasi       | "Evaluasimu", "Soal yang kamu jawab", "Kamu memilih X, jawabannya Y", "AI sedang menyusun evaluasi…"  |
| Badge          | "Dibuat oleh AI", "Ringkasan otomatis (bukan AI)", "Contoh AI (dibuat sebelumnya)"                    |
| Koneksi        | "Koneksi terputus, mencoba menyambung lagi…"                                                          |

Nama game: **EcoRush** (sebelumnya "Balap Fakta Lingkungan").

## 8. Aksesibilitas

- Kontras AA (§2), teks isi ≥ 16 px, dan target sentuh ≥ 48 px.
- Pilihan bisa dipilih dengan A/B/C/D atau 1–4, dan fokus keyboard terlihat (outline `forest-500` 3 px).
- `prefers-reduced-motion`: parallax, goyang, lompat, dan konfeti mati. Hewan langsung pindah posisi, dan ✓ tampil tanpa animasi.
- Perubahan penting (benar/salah, finish, hasil AI siap) diumumkan lewat `aria-live`.

## 9. Suara

- Tiga efek pendek: benar, salah, dan finish, masing-masing ≤ 1 detik, berlisensi CC0, dan dicatat di `docs/ASSETS.md`.
- Ada tombol mute di header yang diingat lewat `localStorage`. Suara mati secara default di mode demo/video.
- Tanpa musik latar.

## 10. Alur kerja Figma → kode

1. Tempel prompt dari `design/figma-prompt.md` ke Figma Make untuk draf pertama.
2. Bandingkan hasilnya dengan mockup v0.1 dan aturan di dokumen ini. Perbaiki lewat prompt lanjutan, atau langsung di Figma.
3. Rapikan: buat Variables sesuai §2, jadikan elemen berulang komponen sesuai §4, dan beri nama layer dengan bahasa Inggris yang sama dengan nama komponen React.
4. Cek kontras dengan plugin contrast checker.
5. Ekspor ke repo: setiap frame layar sebagai PNG ke `docs/design/screens/` dengan nama `<layar>-<state>-<hp|laptop>.png`, Variables sebagai JSON ke `docs/design/tokens.json`, dan link Figma di README.
6. Agen AI membuat kode dari PNG, `tokens.json`, dan dokumen ini. Kode dari Figma Make tidak dipakai.
7. Setiap perubahan desain setelah kode berjalan dicatat di PR beserta PNG terbaru.

## 11. Terbuka

- [OPEN] Nama game.
- [OPEN] Sumber persis 3 efek suara CC0.
- [OPEN] Teks fakta 6 hewan beserta sumbernya (FR-M14).

## 12. Self-review

- Setiap layar dan state di §3 punya FR, dan setiap FR yang punya tampilan muncul di §3.
- Semua warna teks sudah dicek kontrasnya, dan warna slot dari mockup diganti versi yang lebih gelap supaya lolos AA.
- Durasi ✓ (1 dtk) dan lock (5 dtk) mengikuti D-57.
- **Risiko:** emoji di beberapa HP tampil beda kalau font emoji sistem dipakai. Karena itu hewan wajib memakai SVG Noto di repo, bukan karakter emoji.
