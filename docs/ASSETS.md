# Aset (ARCHITECTURE §8)

## Aset Lobby (T-09)

`src/client/assets/animals/{orangutan,gajah,badak,burung}.svg` berasal dari [Google Noto Emoji commit 99701e0](https://github.com/googlefonts/noto-emoji/tree/99701e07d3d1fe1bdbcdb14964547f0fd592966f/2D/svg), berkas `emoji_u1f9a7.svg`, `emoji_u1f418.svg`, `emoji_u1f98f.svg`, dan `emoji_u1f99c.svg`. Lisensi Apache 2.0 tersedia di `docs/licenses/noto-emoji-LICENSE`. Nama file disederhanakan; gambar tidak diubah. Harimau dan penyu memakai ulang `assets/home/tiger.svg` dan `assets/home/turtle.svg` yang telah tercatat di bawah. Semua ditampilkan 24×24 px sesuai slot Figma, tanpa emoji sistem.

## Aset Beranda (T-05)

| File                                                           | Sumber tetap                                                                                                                                                                                                                            | Lisensi                                                       | Perubahan                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/client/assets/home/{tree,tiger,seedling,turtle,palm}.svg` | [Google Noto Emoji, commit 99701e0](https://github.com/googlefonts/noto-emoji/tree/99701e07d3d1fe1bdbcdb14964547f0fd592966f/2D/svg): `emoji_u1f333.svg`, `emoji_u1f405.svg`, `emoji_u1f331.svg`, `emoji_u1f422.svg`, `emoji_u1f334.svg` | Apache 2.0, salinan di `docs/licenses/noto-emoji-LICENSE`     | Nama file disederhanakan; gambar tidak diubah. Dekorasi desktop sesuai urutan Figma. |
| `src/client/assets/fonts/PlusJakartaSans.ttf`                  | [Google Fonts, commit 86aced9](https://github.com/google/fonts/tree/86aced91de05cd4f96a06838124cca45be337b2b/ofl/plusjakartasans)                                                                                                       | OFL 1.1, salinan di `docs/licenses/plus-jakarta-sans-OFL.txt` | Font variabel lokal 200–800; nama file disederhanakan.                               |

Fakta hewan Beranda berasal dari `content/animals.json` (lewat `/api/animals`); tiap fakta punya `sumber` resmi.

## Aset Cozy UI (reskin tampilan)

| File                                       | Sumber tetap                                                                                      | Lisensi                                                                             | Perubahan                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| `src/client/assets/cozy/card.png`          | DEMO Cozy UI Pack, dobo_ui — https://dobo-ui.itch.io/ (`Cards/CardRegular/CardRegular1_wood.png`) | Paket DEMO gratis dobo_ui, salinan catatan di `docs/licenses/cozy-ui-pack-dobo.txt` | Nama file disederhanakan; gambar tidak diubah. |
| `src/client/assets/cozy/plank.png`         | sama (`Containers/Containers/WoodenContainer1.png`)                                               | sama                                                                                | sama                                           |
| `src/client/assets/cozy/note.png`          | sama (`Containers/Containers/NoteContainerSimple.png`)                                            | sama                                                                                | sama                                           |
| `src/client/assets/cozy/field.png`         | sama (`Buttons/Square/SquareButton2_white.png`)                                                   | sama                                                                                | sama                                           |
| `src/client/assets/cozy/slot-selected.png` | sama (`Inventory/ItemSlots/ItemSlotsSelected/ItemSlotSelected1.png`)                              | sama                                                                                | sama                                           |
| `src/client/assets/cozy/check.png`         | sama (`Checkboxes/Checkbox2_checked.png`)                                                         | sama                                                                                | sama                                           |
| `src/client/assets/cozy/arrow.png`         | sama (`Arrows/BrownOutline/ArrowBrownOuline16.png`)                                               | sama                                                                                | sama                                           |
| `src/client/assets/cozy/wood-block.png`    | sama (`Containers/Containers/Container1.png`)                                                     | sama                                                                                | sama                                           |
| `src/client/assets/cozy/card-red.png`      | sama (`Cards/CardRegular/CardRegular1_red.png`)                                                   | sama                                                                                | sama                                           |
| `src/client/assets/fonts/Fredoka.woff2`    | [Google Fonts, Fredoka v17](https://fonts.google.com/specimen/Fredoka)                            | OFL 1.1, salinan di `docs/licenses/fredoka-OFL.txt`                                 | Font variabel lokal (300–700); subset latin.   |

Panel, tombol, dan latar langit–bukit dibuat dengan CSS/token, bukan gambar besar (Green IT).

Setiap aset wajib punya baris di file ini: nama file, sumber (URL + commit), lisensi, dan perubahan.
Aset yang lisensinya tidak jelas dilarang masuk repo.

## Hewan (6)

| Hewan     | id        | Emoji | Unicode | File                                      | flip | Sumber                                             | Lisensi              | Status        |
| --------- | --------- | ----- | ------- | ----------------------------------------- | ---- | -------------------------------------------------- | -------------------- | ------------- |
| Orangutan | orangutan | 🦧    | U+1F9A7 | `src/client/assets/animals/orangutan.svg` | true | github.com/googlefonts/noto-emoji (commit 99701e0) | Apache 2.0 / OFL 1.1 | sudah diunduh |
| Harimau   | harimau   | 🐅    | U+1F405 | `src/client/assets/animals/harimau.svg`   | true | sama                                               | sama                 | sudah diunduh |
| Gajah     | gajah     | 🐘    | U+1F418 | `src/client/assets/animals/gajah.svg`     | true | sama                                               | sama                 | sudah diunduh |
| Penyu     | penyu     | 🐢    | U+1F422 | `src/client/assets/animals/penyu.svg`     | true | sama                                               | sama                 | sudah diunduh |
| Badak     | badak     | 🦏    | U+1F98F | `src/client/assets/animals/badak.svg`     | true | sama                                               | sama                 | sudah diunduh |
| Burung    | burung    | 🦜    | U+1F99C | `src/client/assets/animals/burung.svg`    | true | sama                                               | sama                 | sudah diunduh |

- Hanya mode terang; semua aset CSS/SVG tanpa foto (Green IT, DESIGN §1).
- Arah gerak: hewan menghadap finish di kanan; SVG Noto yang menghadap kiri dibalik `transform: scaleX(-1)`
  (`flip: true` di `content/animals.json`).
- Teks lisensi Apache 2.0 disalin ke `docs/licenses/noto-emoji-LICENSE`.

## Suara (3 efek) — tidak dibuat (dipotong sesuai PLAN §4)

| Efek   | Durasi | Lisensi | Sumber | Status       |
| ------ | ------ | ------- | ------ | ------------ |
| benar  | ≤1 dtk | CC0     | -      | tidak dibuat |
| salah  | ≤1 dtk | CC0     | -      | tidak dibuat |
| finish | ≤1 dtk | CC0     | -      | tidak dibuat |

## Font

Plus Jakarta Sans variabel 200–800 disimpan di repo (`src/client/assets/fonts/PlusJakartaSans.ttf`), lisensi OFL 1.1 (NFR-02, DESIGN §2).
