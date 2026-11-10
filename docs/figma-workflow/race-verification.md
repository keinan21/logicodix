# Verifikasi Balapan T-09

Acuan: Figma `34m7Jn0mMMBZHrd3pLXiJx`, frame HP `33:2`, `36:23`, `36:55`, `60:570`, `61:578`; laptop `38:70`, `39:90`, `39:138`, `62:579`, `62:637`. Implementasi memakai komponen React dan token CSS yang sudah ada.

- Header hijau dan lintasan selebar layar; kartu maksimal 1000 px. Pilihan bertumpuk di HP dan 2×2 di laptop dengan petunjuk keyboard.
- Klik atau A–D/1–4 mengunci semua pilihan saat menunggu respons; kiriman ganda dicegah. Soal dan pilihan tersimpan selama feedback, termasuk jika state berikutnya datang bersamaan.
- Benar: centang di atas pelari dan teks “Benar!” selama satu detik (FR-B04). Salah: ikon, warna, penjelasan, sumber dari server, dan ring di pojok kartu selama lock server.
- Pelari memakai SVG lokal menghadap kanan; tunas juga SVG. Hewan yang tidak lagi balapan berhenti bergoyang. Reduced motion memakai aturan global.
- Popup hasil dari PR #12 dipertahankan memakai dialog native, fokus awal, siklus Tab, dan Escape untuk menonton. Status finish/soal habis tetap menampilkan sisa waktu.
- Chip jenis soal sebelum menjawab tidak ditambahkan: kontrak publik tetap mengikuti FR-K11. Kunci, penjelasan, dan sumber hanya dibaca dari feedback server.
- Latar pohon/parallax dan suara belum termasuk perubahan ini. Isi screenshot adalah data sintetis pengujian, bukan materi pembelajaran.

## Cara memeriksa

1. `npm run dev:web`, buka `/tests/browser/race.html` pada server Vite untuk pratinjau terisolasi. Kontrol simulasi berada di bawah halaman. Fixture ini tidak masuk bundle produksi.
2. `node node_modules/@playwright/test/cli.js test --config tests/browser/playwright.config.ts --workers 1` (memakai Chrome terpasang, Vite pada port 5174).
3. Untuk alur socket nyata, gunakan `bun run dev:dummy`, isi nickname dan pilih “Lawan bot”.

## Hasil

- Tes awal gagal: jawaban tidak langsung terkunci, fokus popup tidak dikelola, lintasan 288 px pada viewport 320 px.
- Sesudah perbaikan: 8 tes browser pada HP/laptop lulus, termasuk feedback, keyboard, dialog, aset, serta lebar 320/360/768/1024/1280/1440 px tanpa overflow horizontal.
- TypeScript, 97 tes Vitest, build produksi, dan validasi konten struktural lulus. Konten asli tetap draf.
- `npm run check` belum lulus: Prettier melaporkan 105 file lama di luar perubahan. Tidak dilakukan format massal atau pelemahan tes.
- React Doctor tidak melaporkan temuan baru pada scope changed (skor awal pemindaian 83/100).

Screenshot: [HP](screens/race-hp-default.png), [laptop](screens/race-laptop-default.png), [salah HP](screens/race-hp-wrong.png), [benar laptop](screens/race-laptop-correct.png).

Perubahan komponen dan token menyentuh area peran D; perlu diperhatikan reviewer komponen. Backend, kontrak socket, dan konten tidak diubah.
