# Aset hewan (TODO T-11)

Enam SVG hewan diunduh dari repo Google Noto Emoji (Apache 2.0 / OFL 1.1) ke folder ini:

| id        | emoji | unicode | file            | flip  |
| --------- | ----- | ------- | --------------- | ----- |
| orangutan | 🦧    | U+1F9A7 | `orangutan.svg` | true  |
| harimau   | 🐅    | U+1F405 | `harimau.svg`   | true  |
| gajah     | 🐘    | U+1F418 | `gajah.svg`     | true  |
| penyu     | 🐢    | U+1F422 | `penyu.svg`     | false |
| badak     | 🦏    | U+1F98F | `badak.svg`     | true  |
| burung    | 🦜    | U+1F99C | `burung.svg`    | false |

Langkah pengunduhan (ARCHITECTURE §8):

1. Cari folder SVG di github.com/googlefonts/noto-emoji, nama file `emoji_u<kode>.svg`.
2. Simpan sebagai `<id>.svg` di folder ini.
3. Salin teks lisensi Apache 2.0 ke `docs/licenses/noto-emoji-LICENSE`.
4. Tambahkan baris ke `docs/ASSETS.md` (nama file, sumber + commit, lisensi, perubahan).

Arah gerak: hewan menghadap finish di kanan; bila SVG menghadap kiri, balik dengan `transform: scaleX(-1)`
(`flip: true` di `content/animals.json`).
