# FRD 02 — Balapan

Status: Draft  
Version: 0.1  
Depends on: docs/PRD.md v0.5; docs/01-decisions.md (D-31, D-37, D-46, D-55, D-57); frd/04-konten.md; CONTEXT.md  
Last updated: 2026-11-04

Fitur ini mencakup langkah 4–5 alur bisnis PRD §4: dari soal pertama sampai balapan berakhir dan peringkat terbentuk. Semua keputusan benar/salah dan peringkat diambil server dari kunci buatan manusia; AI tidak terlibat.

## 1. Parameter

| Parameter | Nilai | Sumber |
|---|---|---|
| Langkah untuk finish | 5 | D-46 |
| Layar terkunci setelah salah | 5 detik | D-57 |
| Tanda "Benar!" | 1 detik | D-57 |
| Batas waktu balapan | 4 menit | D-57 |
| Batas putus koneksi | 10 detik | D-57 |

## 2. Soal

**FR-B01 Urutan soal** — Must — D-46  
- Given balapan dimulai, Then server mengacak bank soal satu kali untuk room itu, dan semua peserta mendapat urutan soal dan urutan pilihan yang sama (FR-K05).  
- Satu soal tidak muncul dua kali dalam satu balapan.

**FR-B02 Menampilkan soal** — Must — D-55  
- Given soal tampil, Then pemain melihat teks soal (dan teks klaim untuk soal klaim), empat pilihan A–D, nomor soal, dan sisa waktu balapan.  
- Kunci, penjelasan, dan sumber belum dikirim ke browser (FR-K11).

**FR-B03 Menjawab** — Must — D-55  
- Given soal tampil, When pemain memilih satu pilihan, Then server memeriksanya terhadap kunci, dan keempat pilihan langsung nonaktif.  
- Setiap soal hanya bisa dijawab sekali.

## 3. Gerak hewan dan umpan balik

**FR-B04 Jawaban benar** — Must — D-31, D-57  
- Given jawaban benar, Then hewan pemain maju 1 langkah, semua peserta melihat posisi barunya, pemain melihat "Benar!" selama 1 detik, lalu soal berikutnya muncul.

**FR-B05 Jawaban salah** — Must — D-37, D-57  
- Given jawaban salah, Then hewan tidak bergerak. Pilihan pemain ditandai merah, kunci disorot hijau, dan di bawahnya tampil penjelasan, tautan sumber, serta hitung mundur 5 detik.  
- Selama 5 detik itu pemain tidak bisa melanjutkan. Setelahnya soal berikutnya muncul otomatis.  
- Soal yang dijawab salah tidak diulang.

**FR-B06 Tampilan peserta lain** — Must — D-57  
- Setiap peserta melihat posisi hewan dan status semua peserta: balapan, finish, soal habis, atau keluar.  
- Pilihan jawaban peserta lain tidak pernah dikirim ke browser mana pun.

## 4. Akhir balapan

**FR-B07 Finish** — Must — D-46  
- Given pemain mencapai 5 langkah, Then server mencatat urutan finish-nya berdasarkan jam server, dan pemain melihat "Finish! Posisi ke-N" sambil menonton sisa balapan beserta sisa waktunya.

**FR-B08 Soal habis** — Must — D-46  
- Given pemain sudah menjawab semua soal di bank tetapi belum finish, Then ia berhenti dengan status "Soal habis" dan menonton sisa balapan.

**FR-B09 Balapan berakhir** — Must — D-46, D-57  
- Given balapan berjalan, When semua peserta sudah finish, soal habis, atau keluar, atau 4 menit habis, Then balapan berakhir untuk semua peserta pada saat yang sama, dan layar hasil terbuka (FRD 03).

**FR-B10 Peringkat** — Must — D-46, D-57  
- Peserta yang finish diurutkan berdasarkan urutan finish.  
- Peserta yang belum finish diurutkan di bawahnya: jumlah benar terbanyak, lalu jumlah salah paling sedikit, lalu waktu jawaban benar terakhir yang paling awal.  
- Peserta berstatus "Keluar" berada di urutan paling bawah.  
- Peringkat dihitung hanya dari kunci dan jam server.

## 5. Koneksi

**FR-B11 Putus koneksi** — Must — D-57  
- Given koneksi pemain terputus, When ia tersambung lagi dalam 10 detik, Then ia melanjutkan soal yang sama dengan sisa waktu balapan yang berjalan.  
- Given koneksi terputus lebih dari 10 detik, Then statusnya menjadi "Keluar", hewannya berhenti, dan ia tidak bisa kembali ke room itu.

**FR-B12 Pemain diam** — Must — D-57  
- Given pemain masih terhubung tetapi tidak menjawab, Then tidak ada tindakan khusus: hewannya tidak maju, dan ia diperingkat seperti peserta lain yang belum finish.

**FR-B13 Semua pemain manusia keluar** — Must — D-57  
- Given semua pemain manusia di room berstatus "Keluar", Then balapan langsung berakhir dan room dihapus tanpa layar hasil.

## 6. Bot di balapan

**FR-B14 Bot ikut aturan** — Must — D-56  
- Bot menjawab sesuai profilnya (FR-M10) dan mengikuti FR-B04 sampai FR-B10, termasuk terkunci 5 detik setelah salah.

## 7. Self-review

- Semua nilai yang sebelumnya [OPEN] di D-46/D-52 sudah diputuskan di D-57.
- AI tidak punya jalur ke FR-B01 sampai FR-B14.
- **Risiko:** menebak cepat tetap mungkin. Dengan 4 pilihan, peluang tebakan benar 25%, dan setiap tebakan salah menghabiskan 5 detik. Efektivitas mitigasi ini perlu dilihat saat uji main.
