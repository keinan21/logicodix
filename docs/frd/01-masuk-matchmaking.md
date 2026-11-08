# FRD 01 — Masuk dan matchmaking

Status: Draft  
Version: 0.2  
Depends on: docs/PRD.md v0.5; docs/01-decisions.md (D-47, D-48, D-56, D-61, D-62); CONTEXT.md  
Last updated: 2026-11-04

Fitur ini mencakup langkah 1–3 alur bisnis PRD §4: pemain masuk dengan nickname, dipertemukan lewat quick match atau langsung melawan bot, lalu menunggu di lobby sampai balapan dimulai.

## 1. Nickname

**FR-M01 Isi nickname** — Must — D-48, D-56  
- Given pemain membuka beranda, When ia mengisi nickname 2–16 karakter yang hanya berisi huruf, angka, atau spasi, Then tombol "Main" dan "Lawan bot" aktif.  
- Given nickname di luar aturan itu, Then kedua tombol nonaktif dan alasannya tampil di bawah kolom isian.  
- Sistem tidak meminta nama asli, email, sekolah, atau lokasi.

**FR-M02 Filter kata kasar** — Must — D-56  
- Given nickname mengandung kata kasar bahasa Indonesia atau Inggris, termasuk samaran umum seperti angka pengganti huruf, When pemain menekan "Main" atau "Lawan bot", Then sistem menolaknya dengan pesan "Nickname tidak boleh mengandung kata kasar".  
- Pemeriksaan dilakukan di server, sehingga tidak bisa dilewati dari browser.

**FR-M03 Simpan nickname di browser** — Must — D-56  
- Nickname disimpan di `sessionStorage` dan otomatis terisi saat pemain menekan "Main lagi".  
- Given pemain menutup tab, Then nickname terhapus.

**FR-M04 Nickname kembar** — Must — D-56  
- Given dua peserta di satu room punya nickname yang sama, When room terbentuk, Then nickname yang masuk belakangan diberi akhiran "#2" (lalu "#3", dan seterusnya).

**FR-M14 Pilih hewan** — Must — D-61  
- Given pemain membuka beranda, Then di bawah kolom nickname tampil 6 hewan: orangutan, harimau, gajah, penyu, badak, dan burung. Setiap hewan menampilkan nama dan satu fakta singkat.  
- Satu hewan sudah terpilih secara acak, sehingga pemain bisa langsung menekan "Main".  
- Pilihan disimpan di `sessionStorage` bersama nickname (FR-M03).  
- Dua peserta di satu room boleh memakai hewan yang sama; lajurnya dibedakan oleh warna slot. Bot mendapat hewan yang belum dipakai di room itu.

## 2. Quick match

**FR-M05 Masuk antrean** — Must — D-47  
- Given pemain menekan "Main", Then ia masuk antrean, dan layar menampilkan lama menunggu serta jumlah pemain yang sudah ditemukan.

**FR-M06 Membentuk room** — Must — D-47, D-56  
- Given 4 pemain ada di antrean, Then room langsung terbentuk berisi keempatnya.  
- Given pemain yang paling lama menunggu sudah menunggu 10 detik, When room belum penuh, Then room terbentuk dari semua pemain yang menunggu, dan slot kosong diisi bot.  
- Kedatangan pemain baru tidak mengulang hitungan 10 detik.

**FR-M07 Batal antre** — Must — D-47  
- Given pemain ada di antrean, When ia menekan "Batal" atau menutup tab, Then ia keluar dari antrean dan tidak dimasukkan ke room.

**FR-M08 Lawan bot** — Must — D-56  
- Given pemain menekan "Lawan bot", Then room langsung terbentuk berisi pemain itu dan 3 bot, tanpa antrean.

## 3. Bot

**FR-M09 Label bot** — Must — D-47  
- Setiap bot tampil dengan nama profilnya dan label "BOT" di lobby, saat balapan, dan di podium.

**FR-M10 Profil bot** — Must — D-56  
- Ada 3 profil tetap, yang angkanya disetel ulang setelah uji main:

| Profil | Peluang benar | Jeda menjawab |
|---|---|---|
| BOT Kilat | 55% | 4–6 detik |
| BOT Santai | 65% | 6–9 detik |
| BOT Teliti | 85% | 9–12 detik |

- Room yang butuh bot mengambil profil berurutan: Kilat, Santai, lalu Teliti.  
- Bot mengikuti aturan balapan yang sama dengan pemain (FRD 02), termasuk jeda terkunci setelah salah.  
- Given seed acak yang sama, When balapan disimulasikan di tes, Then jawaban dan waktu bot sama persis.

## 4. Lobby

**FR-M11 Hitung mundur** — Must — D-46  
- Given room terbentuk, Then semua peserta melihat daftar 4 peserta dan hitung mundur 3-2-1, lalu soal pertama muncul bersamaan untuk semua.

**FR-M12 Keluar saat lobby** — Must — D-56  
- Given pemain keluar atau koneksinya putus saat hitung mundur, Then slotnya diganti bot dengan profil berikutnya, dan hitung mundur tetap berjalan.  
- Given semua pemain manusia keluar saat lobby, Then room dibatalkan dan dihapus.

## 5. Nice

**FR-M13 Room privat** — Nice — D-47  
- Given pemain membuat room privat, When pemain lain memasukkan kodenya, Then mereka masuk room yang sama, dan slot kosong diisi bot saat pembuat room menekan "Mulai".

## 6. Terbuka

- Library filter kata kasar sudah diputuskan di D-62: `obscenity` (Inggris) dan `@sideid/id-profanity-filter` (Indonesia).
- [OPEN] Teks fakta singkat untuk 6 hewan, dengan sumber resmi (dikerjakan bersama konten).
- [OPEN] Angka profil bot setelah uji main 10 Nov.

## 7. Self-review

- Semua keputusan D-56, D-61 (pilih hewan), dan bagian matchmaking dari D-47 punya FR.
- Keluar saat balapan sengaja tidak ada di sini; aturannya di FRD 02.
- **Risiko:** filter kata kasar bisa salah menolak nama wajar. Pesan penolakan harus jelas supaya pemain bisa mengganti nicknamenya.
