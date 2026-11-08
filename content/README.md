# Konten — Semua DRAF (TODO-SUMBER)

Seluruh soal di `questions/` berstatus **`draf`** (D-58): dibuat oleh agen/peran C, **belum terverifikasi**.

- Sumber (`sources`) sengaja kosong: **TODO-SUMBER**. Tidak boleh ada sumber yang dikarang (AGENTS.md §4).
- Verifikasi (FR-K07): C membuka sumber resmi tiap soal, D memeriksa ulang secara independen, lalu mengisi
  `reviewedBy`, `reviewedAt`, sumber, dan mengubah `status` menjadi `terverifikasi`. Hanya manusia C+D yang boleh.
- Server menolak soal `draf` masuk room (WORKFLOW §10). Butuh ≥10 soal terverifikasi agar server start (FR-K01).
- Cut line: bila waktu kurang, pakai 10 soal (PLAN §4).
- Klaim ditulis ulang oleh tim, bukan salinan postingan asli (FR-K08). Topik politik/agama tidak dipakai.

## Komposisi target (FR-K01/K02)

12 soal: 8 klaim (2 per tipe misinformasi) + 4 pengetahuan. Topik tersebar: iklim/cuaca, sampah, hutan, air.

## File lain

- `tips.json` — 4 tips tipe misinformasi + 4 tips topik (FR-K09), draf.
- `animals.json` — 6 hewan pelari (FR-M14), fakta draf menunggu verifikasi P-04.
- `official-sources.json` — daftar kandidat lembaga resmi (FR-K06, masih OPEN menunggu keputusan tim).
- `contoh/` — 3 evaluasi pregenerated skenario sintetis (FR-H11, D-33).
