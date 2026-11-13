# FRD 04 — Konten

Status: Draft  
Version: 0.1  
Depends on: docs/PRD.md v0.5; docs/01-decisions.md (D-50, D-51, D-55; bagian lama §04); CONTEXT.md  
Last updated: 2026-11-04

Fitur ini mendefinisikan isi bank soal: bentuk satu soal, aturan penulisan, proses verifikasi, dan pemeriksaan otomatis. Istilah mengikuti `CONTEXT.md`.

## 1. Komposisi bank soal

**FR-K01 Jumlah dan jenis** — Must — D-55

- Bank berisi 12 soal terverifikasi: 8 soal klaim dan 4 soal pengetahuan. Jika waktu tidak cukup, minimum 10 soal sesuai cut line PLAN.
- Given bank dimuat saat server mulai, When jumlah soal terverifikasi kurang dari 10, Then server menolak mulai dan menampilkan pesan yang menyebut kekurangannya.

**FR-K02 Sebaran tag** — Must — D-55

- Setiap tipe misinformasi muncul di tepat 2 soal klaim.
- Setiap soal punya tepat satu topik lingkungan: iklim/cuaca, sampah, hutan, atau air.
- Given validator berjalan, When sebaran tipe tidak 2 per tipe, Then validator memberi peringatan (bukan gagal), supaya bank sementara yang belum lengkap tetap bisa dipakai saat pengembangan.

## 2. Bentuk satu soal

**FR-K03 Field soal** — Must — D-55  
Satu file JSON per soal. Field wajib:

| Field                     | Aturan                                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | Unik di seluruh bank                                                                                                       |
| `kind`                    | `klaim` atau `pengetahuan`                                                                                                 |
| `stem`                    | Teks soal, ≤ 160 karakter, bahasa setingkat SMP                                                                            |
| `claim`                   | Hanya untuk `klaim`: teks klaim yang beredar, ditulis ulang oleh tim                                                       |
| `options`                 | Tepat 4 pilihan, masing-masing ≤ 80 karakter                                                                               |
| `answerIndex`             | Indeks kunci (0–3)                                                                                                         |
| `explanation`             | ≤ 300 karakter, buatan manusia                                                                                             |
| `sources`                 | Minimal 1, dan minimal 1 di antaranya dari lembaga resmi; masing-masing berisi judul, URL, nama lembaga, dan tanggal dicek |
| `misinfoType`             | Wajib untuk `klaim`; salah satu dari 4 tipe. Tidak ada untuk `pengetahuan`                                                 |
| `topic`                   | Salah satu dari 4 topik                                                                                                    |
| `status`                  | `draf` atau `terverifikasi`                                                                                                |
| `writtenBy`, `reviewedBy` | Kode peran, harus berbeda                                                                                                  |
| `reviewedAt`              | Tanggal persetujuan                                                                                                        |

**FR-K04 Pengecoh** — Must — D-55

- Tiga pengecoh harus masuk akal dan dibantah oleh sumber yang sama dengan kunci.
- Pilihan "semua benar", "semua salah", atau sejenisnya dilarang.
- Panjang pilihan dibuat mirip. Validator memberi peringatan jika pilihan terpanjang adalah kunci dan lebih dari 1,5 kali panjang pilihan terpendek.

**FR-K05 Posisi kunci** — Must — D-55

- Given sebuah soal dikirim ke peserta, When server menyusun pilihan, Then urutan keempat pilihan diacak per room, dan kunci tidak selalu berada di posisi yang sama.
- Semua peserta di satu room melihat urutan pilihan yang sama.

## 3. Sumber dan verifikasi

**FR-K06 Sumber lembaga resmi** — Must — D-55 (pengecekan otomatis dicabut 2026-11-13 atas keputusan tim)

- Minimal satu sumber setiap soal sebaiknya berasal dari lembaga resmi (misalnya BMKG, KLHK, BRIN). Situs cek fakta atau buku boleh ditambahkan.
- Validator tidak lagi memeriksa domain sumber terhadap `content/official-sources.json`, karena sumber buku gagal pemeriksaan itu. Kewajiban tetap: soal `terverifikasi` punya ≥1 sumber (FR-K07). Kecocokan sumber dicek oleh reviewer manusia.

**FR-K07 Pemeriksaan dua orang** — Must — D-55

- C menulis soal. Satu anggota lain membuka setiap sumber, mencocokkannya dengan kunci, penjelasan, dan pengecoh, lalu mengisi `reviewedBy` dan `reviewedAt` serta mengubah `status` menjadi `terverifikasi`.
- Given sebuah soal berstatus `draf`, When server memuat bank, Then soal itu tidak masuk room.
- Given `writtenBy` sama dengan `reviewedBy`, When validator berjalan, Then validator gagal.

**FR-K08 Klaim ditulis ulang** — Must — bagian lama §04, D-55

- Teks klaim tidak menyalin postingan asli, akun nyata, atau tangkapan layar. Kartu pilot K1–K6 hanya menjadi inspirasi topik.
- Topik yang diperdebatkan secara politik atau agama tidak dipakai (bagian lama §13).

## 4. Tips tetap

**FR-K09 Tips per tipe dan per topik** — Must — D-50, D-55

- `content/tips.json` berisi 4 tips tipe misinformasi dan 4 tips topik, masing-masing satu kalimat.
- Tips dipakai ringkasan otomatis saat Evaluasi AI gagal (FRD 03), dan melewati pemeriksaan dua orang yang sama.

## 5. Pemeriksaan otomatis

**FR-K10 Validator konten** — Must — bagian lama §09

- Given CI berjalan, When ada soal yang field wajibnya hilang, ID-nya ganda, jumlah pilihannya bukan 4, `answerIndex`-nya di luar 0–3, teksnya melebihi batas, tag-nya di luar daftar, tidak ada sumber lembaga resmi, atau penulis dan pemeriksanya sama, Then CI gagal dan menyebut nama file serta field-nya.
- Validator hanya memeriksa struktur. Kebenaran isi tetap diverifikasi manusia (FR-K07).
- Validator tidak membuka URL sumber, supaya CI tidak bergantung pada situs luar.

**FR-K11 Kunci tidak bocor** — Must — D-48

- Given soal dikirim ke peserta sebelum dijawab, Then payload hanya berisi `stem`, `claim`, dan `options`. `answerIndex`, `explanation`, dan `sources` baru dikirim setelah peserta menjawab.

## 6. Di luar cakupan

Penulis soal oleh AI, editor konten di dalam aplikasi, dan soal dengan gambar.

## 7. Terbuka

- [OPEN] Daftar lembaga resmi untuk `official-sources.json`.
- [OPEN] Rujukan Wardle (First Draft, 2017) harus dicek sebelum dikutip di README atau presentasi.
- [OPEN] Siapa pemeriksa kedua (A, B, atau D) per soal; ditentukan di PLAN.

## 8. Self-review

- Semua aturan D-55 punya FR dengan kriteria yang bisa dicek.
- FR-K02 dan FR-K04 sengaja berupa peringatan, supaya bank yang belum lengkap tetap bisa dipakai saat pengembangan. Sebelum freeze 13 Nov, keduanya perlu dicek manual.
- **Risiko terbesar:** menulis dan memeriksa 12 soal dengan 3 pengecoh bersumber resmi kira-kira dua kali beban format Benar/Salah. Ini harus terlihat di PLAN.
