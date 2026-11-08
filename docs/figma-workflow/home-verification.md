# Verifikasi Beranda T-05

Acuan Figma: [Beranda](https://www.figma.com/design/34m7Jn0mMMBZHrd3pLXiJx/?node-id=2-3), dibaca lewat Figma MCP pada 8 November 2026.
Frame desktop `46:183` (1280×800), mobile `42:136` (360×760).

- Desktop: dua kolom sama lebar, hero hijau muda, kartu formulir putih, pilihan hewan 3×2, tombol sejajar.
- Mobile: satu kolom, tanpa dekorasi desktop, pilihan hewan 3×2, tombol bertumpuk.
- Memakai Button, Input, AnimalCard, token CSS, font Plus Jakarta Sans lokal, dan dekorasi SVG Noto lokal.
- Label hewan disesuaikan dengan hewannya, label Nickname duplikat dihapus, dan deskripsi mobile membungkus agar tidak terpotong seperti draf Figma.
- Tombol memakai “Main” sesuai DESIGN §7. Pilihan aktif punya centang, selain border hijau.
- Fakta belum bersumber, sehingga panel menampilkan `TODO-SUMBER` sesuai AGENTS §4. Placeholder lingkaran mengikuti Figma; aset pilihan hewan tetap pekerjaan T-11.
- Tidak mengubah backend, kontrak socket, atau logika permainan. Pemilihan awal dan integrasi server tetap mengikuti scaffold yang ada.

## Hasil pemeriksaan

- `bun run build`: lulus; peringatan anotasi dari dependency Zod tidak menghalangi build.
- `bun run test`: 64 tes lulus, termasuk dua tes Beranda yang terlebih dahulu dijalankan dalam kondisi gagal.
- `tsc --noEmit`: lulus.
- Prettier untuk seluruh file yang diubah: lulus.
- `bun run check-content`: lulus struktural; konten lama masih draf tanpa sumber.
- `bun run check`: belum lulus karena format 98 file lama di luar perubahan ini. Tidak dilakukan format massal atau perubahan aturan pemeriksaan.
- React Doctor, scope changed: 100/100, tanpa temuan.
- Browser: validasi nickname, tombol nonaktif, pemilihan hewan, navigasi Main–Batal, dan pemulihan nickname/pilihan berhasil.
- Tidak ada overflow horizontal pada lebar 320, 360, 768, 1024, dan 1440 px.
- Screenshot dibandingkan dengan render Figma desktop dan mobile; perbedaan disengaja dicatat di atas. Posisi vertikal menyesuaikan teks utuh dan penghapusan label duplikat.

Screenshot lokal tersedia di `test-results/home-desktop.png`, `test-results/home-mobile.png`, dan `test-results/home-mobile-error.png` (folder hasil tes diabaikan Git).
