# Aset (ARCHITECTURE §8)

## Aset Beranda (T-05)

| File                                                           | Sumber tetap                                                                                                                                                                                                                            | Lisensi                                                       | Perubahan                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/client/assets/home/{tree,tiger,seedling,turtle,palm}.svg` | [Google Noto Emoji, commit 99701e0](https://github.com/googlefonts/noto-emoji/tree/99701e07d3d1fe1bdbcdb14964547f0fd592966f/2D/svg): `emoji_u1f333.svg`, `emoji_u1f405.svg`, `emoji_u1f331.svg`, `emoji_u1f422.svg`, `emoji_u1f334.svg` | Apache 2.0, salinan di `docs/licenses/noto-emoji-LICENSE`     | Nama file disederhanakan; gambar tidak diubah. Dekorasi desktop sesuai urutan Figma. |
| `src/client/assets/fonts/PlusJakartaSans.ttf`                  | [Google Fonts, commit 86aced9](https://github.com/google/fonts/tree/86aced91de05cd4f96a06838124cca45be337b2b/ofl/plusjakartasans)                                                                                                       | OFL 1.1, salinan di `docs/licenses/plus-jakarta-sans-OFL.txt` | Font variabel lokal 200–800; nama file disederhanakan.                               |

Pilihan hewan Beranda memakai placeholder lingkaran berlabel sesuai Figma sampai aset T-11 tersedia. Fakta hewan tetap `TODO-SUMBER`; tidak ada fakta tanpa sumber yang ditambahkan.

Setiap aset wajib punya baris di file ini: nama file, sumber (URL + commit), lisensi, dan perubahan.
Aset yang lisensinya tidak jelas dilarang masuk repo.

## Hewan (6) — TODO(T-11): unduh SVG Noto Emoji ke `src/client/assets/animals/`

| Hewan     | id        | Emoji | Unicode | File                                      | flip | Sumber                                          | Lisensi              | Status     |
| --------- | --------- | ----- | ------- | ----------------------------------------- | ---- | ----------------------------------------------- | -------------------- | ---------- |
| Orangutan | orangutan | 🦧    | U+1F9A7 | `src/client/assets/animals/orangutan.svg` | true | github.com/googlefonts/noto-emoji (commit TODO) | Apache 2.0 / OFL 1.1 | TODO unduh |
| Harimau   | harimau   | 🐅    | U+1F405 | `src/client/assets/animals/harimau.svg`   | true | sama                                            | sama                 | TODO unduh |
| Gajah     | gajah     | 🐘    | U+1F418 | `src/client/assets/animals/gajah.svg`     | true | sama                                            | sama                 | TODO unduh |
| Penyu     | penyu     | 🐢    | U+1F422 | `src/client/assets/animals/penyu.svg`     | true | sama                                            | sama                 | TODO unduh |
| Badak     | badak     | 🦏    | U+1F98F | `src/client/assets/animals/badak.svg`     | true | sama                                            | sama                 | TODO unduh |
| Burung    | burung    | 🦜    | U+1F99C | `src/client/assets/animals/burung.svg`    | true | sama                                            | sama                 | TODO unduh |

- Hanya mode terang; semua aset CSS/SVG tanpa foto (Green IT, DESIGN §1).
- Arah gerak: hewan menghadap finish di kanan; SVG Noto yang menghadap kiri dibalik `transform: scaleX(-1)`
  (`flip: true` di `content/animals.json` — perlu verifikasi saat T-11).
- Teks lisensi Apache 2.0 disalin ke `docs/licenses/noto-emoji-LICENSE` saat T-11.

## Suara (3 efek) — TODO(T-21, boleh dipotong per PLAN §4)

| Efek   | Durasi | Lisensi | Sumber | Status        |
| ------ | ------ | ------- | ------ | ------------- |
| benar  | ≤1 dtk | CC0     | TODO   | belum diunduh |
| salah  | ≤1 dtk | CC0     | TODO   | belum diunduh |
| finish | ≤1 dtk | CC0     | TODO   | belum diunduh |

## Font — TODO(T-04)

Plus Jakarta Sans (regular 400, bold 700) disimpan di repo (NFR-02, DESIGN §2). Sementara: fallback system font.
