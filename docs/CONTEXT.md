# EcoRush

Game balap multiplayer berbasis web tempat siswa SMP menjawab soal pilihan ganda tentang klaim dan pengetahuan lingkungan. Glosarium ini hanya berisi istilah domain; keputusan ada di `docs/01-decisions.md`.

## Language

### Peserta

**Pemain**:
Siswa yang bermain dan hanya dikenali lewat nickname selama room aktif.
_Avoid_: user, akun, siswa (di dalam spesifikasi)

**Bot**:
Peserta otomatis berlabel "BOT" yang mengisi slot room yang kosong dan tidak memakai AI.
_Avoid_: AI player, NPC

**Peserta**:
Pemain atau bot yang menempati satu slot room.
_Avoid_: player (untuk keduanya sekaligus)

### Balapan

**Room**:
Satu balapan dengan empat slot peserta yang dimulai bersamaan.
_Avoid_: match, lobby (lobby adalah fase awal room)

**Quick match**:
Cara masuk room dengan dipertemukan dengan pemain lain yang sedang menunggu.
_Avoid_: matchmaking sekitar, cari player sekitar

**Hewan**:
Satwa Indonesia yang dipilih pemain sebagai pelarinya di lintasan; bot mendapat hewan yang belum dipakai.
_Avoid_: mobil, karakter, avatar

**Langkah**:
Satu kemajuan hewan pemain di lintasan yang didapat dari satu jawaban benar.
_Avoid_: poin, skor

**Finish**:
Kondisi peserta yang telah mencapai lima langkah.
_Avoid_: menang (menang hanya untuk posisi 1)

**Peringkat**:
Urutan akhir peserta di room, ditentukan urutan finish lalu jumlah jawaban benar.
_Avoid_: skor, leaderboard (leaderboard global ditunda)

### Konten

**Soal**:
Satu butir dengan empat pilihan (A–D) dan satu kunci buatan manusia.
_Avoid_: pertanyaan, item, klaim (untuk semua jenis soal)

**Soal klaim**:
Soal tentang klaim lingkungan yang beredar, yang meminta pemain memilih penjelasan yang tepat menurut sumber resmi.
_Avoid_: soal hoaks

**Soal pengetahuan**:
Soal fakta lingkungan yang tidak berangkat dari klaim yang beredar.
_Avoid_: soal IPA, soal umum

**Klaim**:
Pernyataan lingkungan yang beredar dan menjadi bahan sebuah soal klaim; klaim bisa benar atau menyesatkan.
_Avoid_: hoaks (klaim bisa benar)

**Kunci**:
Pilihan yang benar untuk satu soal, ditetapkan dan diverifikasi tim berdasarkan sumber lembaga resmi.
_Avoid_: jawaban AI, label

**Pengecoh**:
Pilihan salah dalam soal yang masuk akal tetapi dibantah oleh sumber yang sama dengan kunci.
_Avoid_: distraktor, jawaban jebakan

**Tipe misinformasi**:
Salah satu dari empat pola penyesatan yang menjadi tag soal klaim: konten palsu/konspirasi, menyesatkan/salah tafsir data, konteks salah, catut otoritas.
_Avoid_: kategori hoaks, jenis hoaks

**Topik lingkungan**:
Tag bidang untuk setiap soal: iklim/cuaca, sampah, hutan, atau air.
_Avoid_: tema, kategori

**Bank soal**:
Seluruh soal terverifikasi yang bisa muncul di room.
_Avoid_: bank klaim, database soal

### Umpan balik

**Penjelasan**:
Teks pendek buatan tim beserta sumbernya yang menjelaskan kunci sebuah soal.
_Avoid_: hint, feedback AI

**Evaluasi AI**:
Umpan balik setelah balapan yang ditulis AI tentang pola kesalahan seorang pemain.
_Avoid_: skor AI, penilaian AI, ringkasan AI

**Ringkasan otomatis**:
Pengganti Evaluasi AI buatan tim yang tampil saat AI gagal.
_Avoid_: fallback (di teks untuk pemain)
