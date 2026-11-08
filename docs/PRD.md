# PRD — LOGICODIX 2026

Status: Draft  
Version: 0.4  
Depends on: docs/00-competition-constraints.md; docs/01-decisions.md (D-15, D-19, D-22–D-33, D-39–D-52, bagian lama §04, §08, §12, §13)  
Last updated: 2026-11-04

Sumber keputusan: `01-decisions.md`; daftar [OPEN] terkini: D-52 (gameplay) dan D-34 (sisanya). Dokumen tetap Draft karena belum ada pengujian dengan siswa SMP.

## 0. Ringkasan produk

Game balap multiplayer berbasis web untuk siswa SMP. Pemain masuk dengan nickname tanpa akun, lalu quick match mempertemukannya dengan pemain lain; slot kosong diisi bot berlabel "BOT". Setiap soal adalah satu klaim lingkungan yang dijawab Benar atau Salah. Jawaban benar memajukan mobil; jawaban salah membuat mobil diam dan menampilkan penjelasan bersumber selama beberapa detik. Pemain yang pertama mencapai 5 jawaban benar sampai di garis finish. Setelah podium 1-2-3, setiap pemain mendapat Evaluasi AI tentang pola kesalahannya. Kunci jawaban buatan manusia menentukan benar/salah dan peringkat; AI tidak pernah menentukannya.

## 1. Masalah dan bukti

**Asumsi kerja untuk desain, belum diuji dengan siswa SMP (D-51):** klaim lingkungan yang menyesatkan di media sosial menghambat awareness lingkungan siswa SMP. Prioritas produk mengikuti D-25; arti awareness yang dapat diamati masih [OPEN] (D-26).

**Bukti sekunder (data asli, bukan validasi siswa sasaran)** (bagian lama §12; D-19):

- CfDS UGM/APNIC Foundation (ISIF Asia), *Tackling Climate Crisis Misinformation in Indonesia* (2024): survei daring Agustus–September 2023, n=2.401; 51,6% Gen Z. Sampel pengguna internet umum, bukan khusus pelajar, tidak representatif. Angka diperiksa terhadap [English Executive Summary](https://apnic.foundation/wp-content/uploads/2024/04/Executive-Summary-Tackling-Climate-Change-Misinformation-in-Indonesia-ENG-Ver.pdf), **bukan laporan lengkap** (D-42).
- Angka tercatat: 63,5% memakai media sosial sebagai sumber utama informasi iklim; 98% pernah menemui misinformasi iklim; sekitar 74% merasa mampu mengenalinya; 62,3% “hanya sampai tahap verifikasi”; sekitar 20% membuat kontra-narasi. Keyakinan adalah laporan diri, bukan tes. Frasa 62,3% ambigu: **tidak ditafsirkan ulang**; definisi/denominator [OPEN]. Analisis 123 item dari empat situs cek fakta dilaporkan menemukan tujuh tipe; deskripsi korpus, bukan prevalensi populasi.
- D-19 mencatat Roozenbeek & van der Linden (2019), *Fake news game confers psychological resistance against online misinformation*; (2020), *Good News about Bad News: Gamified Inoculation Boosts Confidence and Cognitive Immunity Against Fake News* (n=196, terkontrol); serta Axelsson dkk., *Bad News in the civics classroom: How serious gameplay fosters teenagers' ability to discern misinformation techniques* (516 siswa upper-secondary Swedia). Metadata lengkap belum diverifikasi. Sampel Barat, bukan konteks lingkungan; studi kelas bukan SMP; efek jangka panjang belum jelas.

Bukti ini tidak membuktikan efektivitas game, balapan, AI, atau peningkatan awareness sasaran.

## 2. Pengguna

Satu aktor: **pemain**, yaitu siswa SMP (D-15) yang bermain mandiri di browser (D-23). Kelas/usia lebih sempit, perangkat, dan akses internet [OPEN]. [ASSUMPTION] Pemain dapat memahami aturan tanpa bantuan; perlu diamati langsung.

## 3. Tujuan, non-tujuan, subtema

Awareness lingkungan tetap tujuan utama (D-25), indikator [OPEN] (D-26). **MVP tidak mengukur perubahan awareness** (D-40). Smart & Fun Education adalah subtema tunggal (D-41). Non-tujuan: akun, dashboard guru, leaderboard global, matchmaking berbasis lokasi, alasan tertulis, deteksi “buzzer”, klaim perubahan perilaku.

## 4. Alur bisnis

1. **Masuk:** pemain mengetik nickname; tanpa akun (D-48).
2. **Quick match:** server mengelompokkan pemain yang menunggu ke room 4 slot; setelah maksimal 10 detik slot kosong diisi bot berlabel "BOT" dengan akurasi dan jeda jawab tetap (D-47).
3. **Lobby:** hitung mundur 3-2-1; semua pemain di room mendapat urutan klaim acak yang sama dari bank 10–12 klaim (D-46).
4. **Balapan:** tiap klaim dijawab Benar/Salah (D-45). Benar: mobil maju satu langkah. Salah: mobil diam, penjelasan bersumber terkunci 3–5 detik, lalu klaim berikutnya; tanpa mengulang klaim (D-46).
5. **Finish:** pemain finish pada jawaban benar ke-5. Balapan selesai saat semua finish atau batas waktu 3–5 menit habis. Peringkat: urutan finish, lalu jumlah benar bagi yang belum finish (D-46).
6. **Podium:** peringkat 1-2-3 dan daftar lengkap room (D-48).
7. **Evaluasi AI:** panel per pemain berisi klaim yang salah, pola tipe misinformasi, dan satu tips; berlabel AI. Bila AI gagal, tampil penjelasan tetap berlabel "bukan AI" (D-50).
8. **Selesai:** data room dihapus dari memori server; pemain dapat main lagi dengan acakan baru (D-48).

## 5. Prioritas MVP

| Tier | Cakupan |
|---|---|
| Wajib | Alur bisnis §4 langkah 1–8; 10–12 klaim terverifikasi dengan kunci, penjelasan bersumber, dan tag tipe misinformasi (D-36, D-50); bot pengisi; fallback AI; berjalan di localhost (D-49). |
| Tambahan | Room privat dengan kode (D-47); deploy online (D-49); ekspansi ke 15–20 klaim (D-36). |
| Ditunda | Leaderboard global, akun, dashboard guru (D-27, D-48). |

## 6. Peran dan batas AI

AI hanya dipakai di Evaluasi AI setelah balapan (D-50). Input: ID klaim dan jawaban pemain, ditambah penjelasan buatan tim dan tag tipe misinformasi yang dilampirkan server; nickname tidak dikirim. AI tidak menentukan benar/salah, gerak mobil, atau peringkat, dan gameplay tidak menunggu AI. [ASSUMPTION] Evaluasi pola lintas klaim memberi nilai tambah dibanding penjelasan tetap per klaim. [OPEN] Model, prompt, timeout, format keluaran, cache.

## 7. Ukuran keberhasilan

Dimensi mengikuti D-33/D-40; semua hasil **pending**:

| Pengamatan | Bukti yang dicatat | Batas interpretasi |
|---|---|---|
| Penggunaan mandiri | Pemain menyelesaikan alur §4 tanpa bantuan; titik kebingungan | Bukan bukti peningkatan awareness. |
| Kualitas Evaluasi AI | Kesesuaian dengan kunci, dukungan sumber, tambahan tanpa dukungan, fallback; diuji dengan jawaban sintetis | Bukan diagnosis penalaran pemain. |
| Perilaku menebak | Proporsi jawaban sangat cepat yang salah dalam uji main | Menguji mitigasi kunci 3–5 detik (D-46). |

Ambang numerik [OPEN], menunggu angka dari pengguna.

## 8. Validasi: rencana dan status

Belum ada pengujian dengan siswa SMP; `docs/pilot-results.md` belum ada dan tidak boleh ditulis tanpa sesi nyata (D-51). `docs/pilot-protocol.md` tetap rencana discovery; alur kartunya masih memakai inspeksi petunjuk dan belum disesuaikan dengan D-45. Uji main gameplay dijadwalkan pada hari integrasi 10 Nov [ASSUMPTION].

## 9. Asumsi, risiko, batas

- Kapasitas: 4 orang, sekitar 3 jam/orang/hari (D-29); peran bagian lama §08.
- Risiko desain: adu cepat mendorong tebakan (D-46); tanpa inspeksi petunjuk, latihan memeriksa bukti hilang (D-45); nilai tambah AI belum terbukti.
- Risiko teknis: multiplayer real-time menambah kompleksitas dalam satu minggu; demo bergantung pada bot dan beberapa jendela browser (D-49).
- Privasi: nickname dan progres hanya di memori server selama room aktif; tanpa akun dan tanpa penyimpanan permanen (D-48); demo memakai data sintetis (D-33). Pengiriman jawaban pemain nyata ke penyedia AI tetap menunggu keputusan privasi (D-34).
- Konstrain lomba: AI dalam aplikasi praktis wajib karena video demo harus menampilkannya (D-50; 00 §A5); implementasi dimulai setelah kickoff 7 Nov.

## 10. Pemetaan kriteria penjurian

| Kriteria resmi | Bukti yang ditargetkan, belum diklaim tersedia |
|---|---|
| Problem–Solution Fit — 25% | Bukti sekunder §1; uji main dengan sasaran [OPEN]. |
| Technology Innovation — 25% | Multiplayer real-time dengan bot; Evaluasi AI pola misinformasi lintas klaim (D-50). |
| Software Engineering — 25% | Alur berjalan di localhost, kunci deterministik, fallback AI, dokumentasi. |
| UI/UX Design — 15% | Alur §4 yang dapat dipahami di video demo tanpa narasi (00 §A5). |
| Green IT & Ethics — 10% | Label AI dan fallback, data room transien, tanpa data lokasi atau akun (D-47, D-48). |
