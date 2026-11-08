# Verifikasi Lobby T-09

Branch `a/T-09-lobby-figma` melanjutkan branch Antre. Acuan Figma MCP: file `34m7Jn0mMMBZHrd3pLXiJx`, mobile `50:242` (360×760), desktop `50:267` (1280×800).

- Judul, ring, dan daftar peserta terpusat dengan jarak token. Badge BOT dan CountdownRing memakai komponen existing; varian default ring untuk layar lain tidak berubah.
- Ikon hewan memakai SVG Noto lokal 24×24 px, sesuai aturan repo. Dua aset digunakan ulang, empat ditambahkan dengan sumber dan lisensi di ASSETS.md.
- Ring menunjukkan prop `countdown`; 3 dari 3 detik menghasilkan lingkaran penuh, kemudian berkurang pada 2 dan 1. Ini berbeda dari ring contoh Figma yang menunjukkan 3 dari 5 detik.
- Tanpa data atau countdown, layar menampilkan status menunggu. Tidak ada timer client, perubahan backend, atau perubahan schema. `timeLeftS` tidak digunakan sebagai countdown Lobby karena server mengisinya sebagai waktu balapan.
- Integrasi real-time belum tersedia. Prop countdown harus dipasok integrasi room selanjutnya.

## Preview lokal

Jalankan `bun run dev:web`, lalu buka `http://127.0.0.1:5173/?preview=lobby`. Pilih 3, 2, 1 detik atau Menunggu data pada kontrol preview. Nama peserta adalah data contoh dari desain. Preview tidak terhubung ke socket dan tidak masuk build produksi.

## Verifikasi

- Lima tes Lobby mencakup peserta, label hewan, badge BOT, state kosong, dan countdown 3–2–1. Tes awal gagal sebelum implementasi; seluruh 71 tes kemudian lulus.
- Build dan TypeScript lulus. React Doctor 100/100 tanpa temuan.
- Preview tidak ditemukan dalam output produksi.
- Screenshot desktop/mobile dibandingkan dengan Figma: `test-results/lobby-desktop.png` dan `test-results/lobby-mobile.png` (diabaikan Git). Kontrol preview di bagian atas hanya ada di development.
- `bun run check` masih terhambat format 94 file lama di luar perubahan ini; tidak dilakukan format massal.
