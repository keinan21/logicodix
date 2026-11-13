# Persiapan verifikasi bank soal

Tanggal riset: 13 November 2026. Tugas T-06; FR-K01–FR-K10.

Dokumen ini adalah bahan pemeriksaan, bukan persetujuan konten. Seluruh soal tetap
`draf`; agen tidak mengisi `reviewedBy` atau `reviewedAt` (AGENTS.md §4, D-58).

## Ruang lingkup

Bank berisi 128 draf: 116 soal pengetahuan yang ditambahkan pada commit `60b712f`
dan 12 soal awal (8 klaim, 4 pengetahuan). Sumber ditelusuri ke halaman lembaga
penerbit. `tanggalCek` pada sumber menunjukkan tanggal akses riset, bukan tanda
bahwa pemeriksa manusia telah membuka dan menyetujui sumber itu.

Laporan memakai urutan nama file JSON agar setiap soal dapat ditemukan kembali:

- [Soal 001–044](sumber-soal-001-044.md)
- [Soal 045–088](sumber-soal-045-088.md)
- [Soal 089–128](sumber-soal-089-128.md), termasuk 12 soal awal.

Laporan membedakan dukungan untuk konsep atau kunci dari dukungan untuk keseluruhan
soal. Sumber tentang cara memeriksa informasi tidak membuktikan bahwa peristiwa
ilustratif dalam suatu unggahan benar-benar terjadi.

## Cara menyelesaikan pemeriksaan manusia

1. Penulis C membaca catatan pada laporan dan memperbaiki masalah yang disebutkan.
   Periksa stem, empat pilihan, kunci, penjelasan, serta tag. Pastikan hanya satu
   pilihan benar; fakta umum yang benar belum tentu cukup untuk membantah pengecoh.
2. Pemeriksa kedua membuka setiap sumber. Cocokkan bukti dengan versi soal setelah
   koreksi, termasuk batasan seperti jenis pencemar, lokasi, dan kondisi alam.
   Bila bukti belum cukup, pertahankan `draf` dan catat `TODO-SUMBER`.
3. Bila seluruh isi disetujui, pemeriksa manusia yang berbeda dari `writtenBy`
   mengisi `reviewedBy`, tanggal persetujuan nyata pada `reviewedAt`, dan
   `status: "terverifikasi"`. Jangan menyalin tanggal riset sebagai tanggal persetujuan.
4. Jalankan `npm run check` dan `npm test`. Pemeriksaan otomatis hanya membuktikan
   struktur dan perilaku program; pemeriksaan itu tidak menilai kebenaran isi.
5. Minta manusia meninjau PR yang mengubah `content/` sebelum merge (AGENTS.md §5).

## Prioritas agar server dapat digunakan

FR-K01 mensyaratkan sedikitnya 10 soal terverifikasi agar server mulai. Target awal
FR-K01/K02 adalah 12 soal: 8 klaim (dua per tipe misinformasi) dan 4 pengetahuan.
Jumlah 128 draf saat ini bukan bukti bahwa komposisi target itu telah terpenuhi.
Verifikasi bertahap bisa dimulai dari soal yang bukti dan pengecohnya sudah jelas;
jangan menghapus syarat verifikasi atau memasukkan draf ke room untuk melewati gate.

Untuk menuntaskan semua 128 soal, setiap baris laporan tetap perlu diperiksa.
Penyelesaian kelompok pertama tidak memberi persetujuan otomatis kepada soal lain
yang memakai sumber yang sama.

## Batas perubahan riset

Perubahan JSON melengkapi `sources`. Pada soal 045–088, beberapa penjelasan, stem,
dan pengecoh juga disunting sesuai catatan koreksi pada laporannya agar bukti dan
rumusan soal lebih selaras. `answerIndex`, `writtenBy`, `reviewedBy`, `reviewedAt`,
dan `status` tetap dipertahankan; tidak ada soal yang ditandai `terverifikasi`.
