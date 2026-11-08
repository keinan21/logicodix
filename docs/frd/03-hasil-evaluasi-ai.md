# FRD 03 — Hasil dan Evaluasi AI

Status: Draft  
Version: 0.1  
Depends on: docs/PRD.md v0.6; docs/01-decisions.md (D-32, D-33, D-48, D-50, D-58, D-59); frd/02-balapan.md; frd/04-konten.md; CONTEXT.md  
Last updated: 2026-11-04

Fitur ini mencakup langkah 6–8 alur bisnis PRD §4: layar podium, layar Evaluasi, dan penghapusan data room. AI hanya menulis teks pola, tips, atau motivasi. Daftar soal, kunci, dan peringkat selalu berasal dari server.

## 1. Podium

**FR-H01 Layar podium** — Must — D-58  
- Given balapan berakhir (FR-B09), Then setiap pemain melihat podium 1-2-3 dan tabel semua peserta berisi posisi, nickname, label BOT, jumlah benar, dan status. Baris pemain sendiri disorot.  
- Layar ini tampil tanpa menunggu AI.  
- Tersedia tombol "Lihat evaluasi" dan "Main lagi".

## 2. Layar Evaluasi

**FR-H02 Daftar soal yang dijawab** — Must — D-58  
- Given pemain membuka Evaluasi, Then ia melihat semua soal yang ia jawab, berurutan.  
- Soal yang salah terbuka otomatis dan berisi pilihan pemain, kunci, penjelasan, dan sumber. Soal yang benar tertutup dan bisa dibuka untuk melihat penjelasannya.  
- Daftar ini disusun server dari kunci, bukan oleh AI.

**FR-H03 Bagian AI** — Must — D-58  
- Di bawah daftar soal ada satu paragraf pola (≤ 400 karakter) dan satu tips (≤ 200 karakter), dalam bahasa Indonesia.  
- Pola menyebut tipe misinformasi dan/atau topik lingkungan yang paling sering membuat pemain salah.  
- Selama AI belum selesai, bagian ini menampilkan "AI sedang menyusun evaluasi…", sementara daftar soal sudah bisa dibaca.

**FR-H04 Semua benar** — Must — D-59  
- Given pemain menjawab semua soalnya dengan benar, Then bagian AI berisi pesan motivasi singkat yang ditulis AI (≤ 400 karakter), bukan teks tetap.  
- Di bawahnya tampil "Baca lebih lanjut" berisi sumber-sumber terverifikasi dari soal yang sudah ia jawab. Tidak ada daftar tautan tambahan, dan AI tidak membuat tautan.

**FR-H05 Badge sumber** — Must — D-58  
- Bagian AI selalu memakai salah satu badge: "Dibuat oleh AI", "Ringkasan otomatis (bukan AI)", atau "Contoh AI (dibuat sebelumnya)", sesuai asal teksnya.

## 3. Memanggil AI

**FR-H06 Isi yang dikirim ke AI** — Must — D-50, D-58  
- Input hanya berisi, untuk setiap soal yang dijawab: ID soal, jenis soal, pilihan pemain, kunci, penjelasan buatan tim, tipe misinformasi (jika ada), dan topik.  
- Nickname, ID koneksi, data peserta lain, dan waktu menjawab tidak pernah dikirim.  
- Bot tidak mendapat Evaluasi.

**FR-H07 Batas waktu** — Must — D-58  
- Given AI belum merespons dalam 8 detik, Then permintaan dibatalkan dan FR-H09 dipakai.

**FR-H08 Cek keluaran AI** — Must — D-58  
- Keluaran harus berformat sesuai kontrak dan tidak melebihi batas panjang FR-H03/FR-H04.  
- Keluaran hanya boleh menyebut tipe misinformasi dan topik yang ada di input.  
- Keluaran tidak boleh memuat URL atau angka yang tidak ada di input.  
- Keluaran tidak boleh menyatakan jawaban benar yang berbeda dari kunci.  
- Given satu cek saja gagal, Then keluaran dibuang dan FR-H09 dipakai.

**FR-H09 Ringkasan otomatis** — Must — D-32, D-58  
- Given AI gagal, timeout, atau keluarannya tidak lolos cek, Then bagian AI menampilkan ringkasan otomatis: tipe dan topik yang paling sering salah (dihitung server), ditambah tips tetap untuk tipe dan topik itu (FR-K09), dengan badge "Ringkasan otomatis (bukan AI)".  
- Untuk kasus semua benar, ringkasan otomatis berupa ucapan selamat tetap.  
- Kegagalan AI tidak pernah menghentikan alur atau mengubah peringkat.

**FR-H10 Hemat panggilan** — Must — D-58  
- Maksimal 1 panggilan AI per pemain per balapan.  
- Hasil yang lolos cek disimpan di memori server dengan kunci kombinasi (ID soal, pilihan), tanpa nickname. Given kombinasi yang sama muncul lagi, Then hasil dari cache dipakai tanpa memanggil AI.

**FR-H11 Mode contoh** — Must — D-33, D-58  
- Given server berjalan dalam mode "contoh", Then evaluasi diambil dari kumpulan evaluasi yang dibuat sebelumnya dari 3 skenario jawaban sintetis, dengan badge "Contoh AI (dibuat sebelumnya)".  
- Mode ini dipakai saat tidak ada internet atau API key, dan untuk demo.

## 4. Data dan main lagi

**FR-H12 Masa simpan hasil** — Must — D-48, D-58  
- Hasil bisa dibuka sampai pemain menekan "Main lagi", menutup tab, atau 10 menit setelah balapan berakhir, mana yang lebih dulu.  
- Setelah semua pemain di room memenuhi salah satu kondisi itu, data room dihapus dari memori server. Log tidak pernah memuat nickname atau pilihan.

**FR-H13 Main lagi** — Must — D-48, D-56  
- Given pemain menekan "Main lagi", Then ia masuk quick match lagi dengan nickname dari `sessionStorage`, dan room baru memakai acakan soal yang baru.

## 5. Transparansi

- Tidak ada halaman "Tentang AI" di aplikasi (D-58). README menjelaskan apa yang dikirim ke AI, apa yang tidak dikirim, bahwa AI tidak menentukan skor, bahwa AI dapat membantu draf soal di luar aplikasi, dan bagaimana ringkasan otomatis bekerja.

## 6. Terbuka

- [OPEN] Penyedia dan model AI, serta bentuk prompt (diputuskan di Architecture).
- [OPEN] Isi 3 skenario jawaban sintetis untuk mode contoh.

## 7. Self-review

- Semua keputusan D-58 dan D-59 punya FR.
- AI tidak punya jalur ke peringkat (FR-B10) maupun ke daftar soal (FR-H02).
- **Risiko:** cek "tidak menyatakan kunci yang berbeda" (FR-H08) sulit dibuat sempurna secara otomatis. Selain cek otomatis, evaluasi internal D-33 tetap diperlukan pada 20 jawaban sintetis sebelum demo.
