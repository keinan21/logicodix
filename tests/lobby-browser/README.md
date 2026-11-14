# Validasi Lobby (FR-M09, FR-M11, FR-M12)

Jalankan dari root repo dengan Google Chrome terpasang:

```sh
node node_modules/@playwright/test/cli.js test --config tests/lobby-browser/playwright.config.ts
```

Konfigurasi membangun frontend terbaru, menjalankan server terisolasi pada port
3027 dengan bank soal dummy dan seed 42, lalu menghentikannya setelah pengujian.
Port tersebut harus kosong. Tidak perlu menjalankan server dev. Konten soal asli
tidak diubah. `AI_MODE=mock` mencegah panggilan AI eksternal.

Setiap skenario membuka empat konteks Chrome terpisah dengan sessionStorage
masing-masing. App dan koneksi Socket.IO asli dipakai tanpa stub transport.

- Empat pemain melihat daftar lengkap dan countdown 3–2–1, kemudian masuk room
  yang sama dengan soal pertama identik.
- Satu pemain menutup konteks browser saat countdown. Tiga pemain lain melihat
  penggantinya, BOT Kilat berlabel BOT, tetap empat peserta, dan countdown tidak
  kembali naik sebelum balapan dimulai.
- Kedua skenario dijalankan pada viewport HP 360 × 760 dan laptop 1280 × 800;
  overflow horizontal diperiksa pada Lobby dan Balapan.

Screenshot Lobby tersimpan di `test-results/`; trace disimpan saat gagal.
Untuk memeriksa kestabilan, tambahkan `--repeat-each=5`.

Batas cakupan: beberapa sesi Chrome, bukan pengujian lintas mesin browser
(Firefox/Safari), perangkat fisik, atau gangguan Wi-Fi. Kesamaan soal pertama
diverifikasi melalui event server; pengujian tidak mengukur selisih waktu render
antarperangkat. Pembatalan room ketika semua manusia keluar dicakup tes unit
yang sudah ada di `tests/room.test.ts`.
