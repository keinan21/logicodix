# Perapian Balapan T-09

Melanjutkan main `425f051`, termasuk implementasi Balapan dari PR #13. Acuan visual: Figma `34m7Jn0mMMBZHrd3pLXiJx`, frame HP `33:2`, `36:23`, `36:55`, `60:570`, `61:578`; laptop `38:70`, `39:90`, `39:138`, `62:579`, `62:637`. Aturan gerak pohon mengikuti DESIGN §5 dan reduced motion §8.

## Perubahan

- Feedback jawaban terakhir tetap tampil sebelum dialog finish, termasuk jika status finish diterima sebelum feedback. Posisi dan peringkat tetap berasal dari server.
- Setelah memilih menonton atau menekan Escape, fokus berpindah ke tombol Lihat hasil. Dialog native ditutup saat efek dibersihkan.
- Status pengiriman jawaban, feedback, serta mode menonton lebih jelas. Sisa waktu tetap terlihat saat menonton.
- Latar pohon memakai ulang SVG lokal `assets/home/tree.svg` yang lisensinya sudah tercatat di ASSETS. Parallax mengikuti preferensi reduced motion global.
- Countdown salah berukuran 52 px; tombol dialog bertumpuk pada HP dan berjajar pada laptop. Label BOT tidak diulang jika nama profil sudah diawali BOT; nickname lengkap tersedia melalui title.
- Kontrak soal, konten, dan backend tidak diubah. Chip jenis soal sebelum menjawab tetap tidak ditambahkan (FR-K11). Suara masih pekerjaan terpisah.

## Bukti

Sebelum perbaikan, tiga regresi browser gagal: fokus setelah menonton, feedback jawaban terakhir, dan urutan status finish sebelum feedback. Tes label juga membuktikan duplikasi BOT. Setelah perbaikan:

- `npm test`: 110 tes lulus; tes Lane dijalankan ulang setelah perapian label dan lulus.
- `node node_modules/@playwright/test/cli.js test -c tests/browser/playwright.config.ts --workers=1`: 12 tes lulus, HP/laptop; lebar 320, 360, 768, 1024, 1280, dan 1440 tanpa overflow horizontal.
- TypeScript, build produksi, validasi konten struktural, dan Prettier pada file yang diubah lulus.
- React Doctor scope changed: tidak ada temuan baru; skor pemindaian 82/100.
- `npm run check`: belum lulus karena Prettier pada 105 file lama di luar perubahan. Tidak dilakukan format massal atau perubahan konfigurasi pemeriksaan.

Screenshot memakai data sintetis, bukan materi pembelajaran:

- [HP default](screens/race-polish-hp-default.png)
- [Laptop default](screens/race-polish-laptop-default.png)
- [HP salah](screens/race-polish-hp-wrong.png)
- [Laptop benar](screens/race-polish-laptop-correct.png)

Untuk melihatnya: jalankan Vite dan buka `/tests/browser/race.html`. Fixture hanya untuk development dan tidak masuk bundle produksi.
