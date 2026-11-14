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

| File                                            | Sumber tetap                                                                                                                    | Lisensi                                                                     | Perubahan                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `src/client/assets/kenney/banner_hanging.png`   | Kenney UI Pack Adventure — https://kenney.nl (`PNG/Double/banner_hanging.png`)                                                  | CC0, salinan lisensi di `docs/licenses/kenney-ui-pack-adventure.txt`        | Tidak dipakai (cadangan); papan judul kini CSS.        |
| `src/client/assets/kenney/panel_brown.png`      | sama (`PNG/Double/panel_brown.png`)                                                                                             | sama                                                                        | Tidak dipakai (cadangan); panel kini CSS.              |
| `src/client/assets/kenney/panel_brown_dark.png` | sama (`PNG/Double/panel_brown_dark.png`)                                                                                        | sama                                                                        | Cadangan.                                              |
| `src/client/assets/kenney/panel_grey.png`       | sama (`PNG/Double/panel_grey.png`)                                                                                              | sama                                                                        | Cadangan.                                              |
| `src/client/assets/kenney/button_brown.png`     | sama (`PNG/Double/button_brown.png`)                                                                                            | sama                                                                        | Cadangan.                                              |
| `src/client/assets/kenney/button_green.png`     | sama (`PNG/Double/button_green.png`)                                                                                            | sama                                                                        | Cadangan.                                              |
| `src/client/assets/kenney/button_red.png`       | sama (`PNG/Double/button_red.png`)                                                                                              | sama                                                                        | Cadangan.                                              |
| `src/client/assets/kenney/check.png`            | sama (`PNG/Default/checkbox_brown_checked.png`)                                                                                 | sama                                                                        | Cadangan.                                              |
| `src/client/assets/kenney/arrow.png`            | sama (`PNG/Default/minimap_arrow_a.png`)                                                                                        | sama                                                                        | Dipakai indikator akordeon evaluasi.                   |
| `src/client/assets/dobo/plank-wood.png`         | DEMO Cozy UI Pack, dobo_ui — https://dobo-ui.itch.io/ (`Containers/Containers/WoodenContainer1.png`)                            | Paket DEMO gratis dobo_ui, catatan di `docs/licenses/cozy-ui-pack-dobo.txt` | Tidak dipakai (cadangan); regangan bitmap diganti CSS. |
| `src/client/assets/dobo/card-wood.png`          | sama (`Cards/CardRegular/CardRegular1_wood.png`)                                                                                | sama                                                                        | Tidak dipakai (cadangan); panel kini CSS.              |
| `src/client/assets/dobo/tile-cream.png`         | DEMO Mega Cozy UI Pack, dobo_ui — https://dobo-ui.itch.io/ (`Containers/SimpleColorContainers/SimpleColorContainer1_cream.png`) | Paket DEMO gratis dobo_ui, catatan di `docs/licenses/cozy-ui-pack-dobo.txt` | Tidak dipakai (cadangan); tile kini CSS.               |
| `src/client/assets/dobo/tile-green.png`         | sama (`.../SimpleColorContainer1_green.png`)                                                                                    | sama                                                                        | Tidak dipakai (cadangan); tile terpilih kini CSS.      |
| `src/client/assets/dobo/button-wood.svg`        | sama (tombol 48x24)                                                                                                             | sama                                                                        | Tidak dipakai (cadangan); tombol kini CSS.             |
| `src/client/assets/fonts/Fredoka.woff2`         | [Google Fonts, Fredoka v17](https://fonts.google.com/specimen/Fredoka)                                                          | OFL 1.1, salinan di `docs/licenses/fredoka-OFL.txt`                         | Font variabel lokal (300–700); subset latin.           |

Panel, tombol, dan latar langit–bukit dibuat dengan CSS/token, bukan gambar besar (Green IT). Latar pemandangan kini mengikuti `scene.svg` dari set aset tim (warna memakai token).

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

## Logo merek

`src/client/assets/logo.svg` — wordmark “EcoRush” (Eco hijau, Rush oranye, dengan tunas,
bendera finis, dan subjudul エコラッシュ). Berkas disediakan pemilik proyek; gambar tidak
diubah. Dipakai sebagai heading Beranda (`<h1>` berisi gambar dengan `alt="EcoRush"`),
latar transparan, ukuran mengikuti lebar kolom.

- Sumber: dibuat pemilik proyek (tim LOGICODIX 2026).
- Lisensi: milik proyek, bebas dipakai untuk LOGICODIX 2026.
- Favicon: `src/client/assets/ecorush-favicon.ico` dipakai di `index.html`.
- Catatan: SVG berisi metadata C2PA, jadi kemungkinan dibuat dengan perkakas generatif.

## Musik latar (2 trek)

| File                                              | Dipakai di                                     | Sumber & lisensi                                                                                                                                                                    |
| ------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/client/assets/music/town-theme.mp3`          | Beranda, Antre, Lobby, Podium, Evaluasi (loop) | OpenGameArt “Town Theme RPG” oleh **cynicmusic**, **CC0** — https://opengameart.org/content/town-theme-rpg (97 dtk, 108 kbps)                                                       |
| `src/client/assets/music/race-mushroom-theme.mp3` | Layar Balapan (loop)                           | OpenGameArt “Platformer Game Music Pack” oleh **CodeManu**, **CC-BY 3.0** — https://opengameart.org/content/platformer-game-music-pack (trek `Mushroom Theme.mp3`, 27 dtk, 96 kbps) |

Musik dipudarkan masuk/keluar (≈0,9 dtk), volume latar 0,18, dan mengikuti tombol
bisu yang sama dengan efek suara. Kredit CC-BY 3.0 tercantum di sini dan di
`src/client/music.ts`.

## Suara (5 efek) — disintesis di browser

Tidak ada file audio di repo: semua efek dibuat saat runtime dengan Web Audio API
(`src/client/sound.ts`, osilator + envelope), jadi bebas lisensi dan tanpa unduhan.

| Efek      | Kapan berbunyi                                                                     | Bentuk bunyi                  |
| --------- | ---------------------------------------------------------------------------------- | ----------------------------- |
| `tick`    | Angka hitung mundur lobby 3-2-1, sekali per detik                                  | blip sine pendek 880 Hz       |
| `start`   | Fase berubah ke `racing` (balapan dimulai)                                         | tiga nada naik 392→523→784 Hz |
| `correct` | Umpan balik jawaban **benar** diterima (sekali per soal)                           | arpeggio 660→880→1174 Hz      |
| `wrong`   | Umpan balik jawaban **salah** diterima (sekali per soal)                           | dua nada turun 233→196 Hz     |
| `finish`  | Pelari sendiri mencapai finish, dan saat fase berubah ke `finished` (balapan usai) | fanfare 523→659→784→1046 Hz   |

Semua bunyi dan musik mengikuti preferensi bisu di localStorage (`sfx-muted`) yang
diatur tombol speaker di pojok kanan bawah. AudioContext dan pemutaran musik baru
dimulai setelah interaksi pertama pengguna (kebijakan autoplay browser).

## Font

Plus Jakarta Sans variabel 200–800 disimpan di repo (`src/client/assets/fonts/PlusJakartaSans.ttf`), lisensi OFL 1.1 (NFR-02, DESIGN §2).
