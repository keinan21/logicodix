# Verifikasi Antre T-13

- Branch `a/T-13-antre-figma` melanjutkan `a/T-05-beranda-figma`, sesuai persetujuan percakapan.
- Acuan Figma MCP: file `34m7Jn0mMMBZHrd3pLXiJx`, mobile `50:230`, desktop `50:236`.
- Konten terpusat, jarak 12 px, warna dan tipografi token, Button secondary selebar 220 px dan tinggi minimal 52 px.
- Lama menunggu ditampilkan di samping jam pasir untuk memenuhi FR-M05; draf Figma hanya menampilkan ikon. Label Batal diratakan ke tengah.
- Jumlah pemain diumumkan lewat aria-live; waktu memakai role timer tanpa pengumuman tiap detik.
- Backend dan logika permainan tidak diubah. App masih memasok contoh `found=1`, `waitingS=0`; komponen siap menampilkan pembaruan props. Batal tetap memanggil callback existing, yang saat ini mengembalikan pengguna ke Beranda.
- Dua tes baru dijalankan gagal sebelum implementasi; seluruh 66 tes dan build kemudian lulus. TypeScript dan format file perubahan lulus.
- Pemeriksaan repo `bun run check` masih terhambat format 97 file lama di luar perubahan.
- Screenshot browser 360×760 dan 1280×800 dibandingkan dengan Figma. Main → Antre → Batal diuji dengan Tab dan Enter.
- Screenshot lokal: `test-results/queue-mobile.png` dan `test-results/queue-desktop.png` (diabaikan Git).

Preview: buka `http://127.0.0.1:5173`, isi nickname valid, lalu tekan Main.
