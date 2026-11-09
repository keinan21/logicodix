import { questionSchema } from '../src/shared/schema';
import type { MisinfoType, Question, Topic } from '../src/shared/schema';

/**
 * Bank soal DUMMY untuk mencoba aplikasi di lokal. Bukan isi content/ dan bukan materi ajar:
 * semua soal di sini contoh, dan sumbernya placeholder example.org (bukan sumber resmi).
 *
 * Soal asli tetap ditulis peran C lalu diverifikasi manusia (FR-K07, D-58); agen tidak boleh
 * mengubah soal content/ menjadi "terverifikasi". Bank ini hanya dipakai scripts/dev-dummy.ts.
 */
interface DummyInput {
  kind: 'klaim' | 'pengetahuan';
  stem: string;
  claim?: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  topic: Topic;
  misinfoType?: MisinfoType;
}

const DATA: DummyInput[] = [
  {
    kind: 'klaim',
    stem: 'Sampah plastik di laut hilang dalam sebulan.',
    claim: 'Botol plastik yang dibuang ke laut terurai dalam sebulan.',
    options: [
      'Benar — air laut melarutkan plastik',
      'Benar jika terkena sinar matahari',
      'Tidak benar — plastik bertahan puluhan tahun',
      'Tidak benar, tetapi hanya butuh setahun',
    ],
    answerIndex: 2,
    explanation: 'Contoh demo: plastik di laut bertahan lama lalu pecah menjadi mikroplastik.',
    topic: 'sampah',
    misinfoType: 'konteks-salah',
  },
  {
    kind: 'pengetahuan',
    stem: 'Apa fungsi utama hutan mangrove di pesisir?',
    options: [
      'Menurunkan suhu global secara langsung',
      'Menahan gelombang dan abrasi pantai',
      'Menghasilkan air tawar dari laut',
      'Menghentikan semua hujan lebat',
    ],
    answerIndex: 1,
    explanation: 'Contoh demo: akar mangrove menahan gelombang dan menjaga garis pantai.',
    topic: 'hutan',
  },
  {
    kind: 'klaim',
    stem: 'Satu hari yang dingin membuktikan pemanasan global tidak ada.',
    claim: 'Cuaca dingin pekan ini membantah pemanasan global.',
    options: [
      'Benar — dingin berarti bumi mendingin',
      'Benar jika terjadi di banyak kota',
      'Tidak benar — cuaca harian bukan tren iklim',
      'Tidak benar, karena bumi sebenarnya mendingin',
    ],
    answerIndex: 2,
    explanation: 'Contoh demo: iklim adalah tren jangka panjang, cuaca harian bisa naik-turun.',
    topic: 'iklim-cuaca',
    misinfoType: 'menyesatkan-salah-tafsir-data',
  },
  {
    kind: 'klaim',
    stem: 'Foto banjir tahun 2015 disebut banjir kemarin.',
    claim: 'Foto banjir yang viral ini kejadian kemarin.',
    options: [
      'Tidak benar — foto lama dipakai ulang',
      'Benar — foto selalu baru',
      'Benar jika ada di media sosial',
      'Tidak benar, karena banjir tidak pernah terjadi',
    ],
    answerIndex: 0,
    explanation: 'Contoh demo: cek tanggal dan lokasi asli media sebelum mempercayai unggahan.',
    topic: 'air',
    misinfoType: 'konteks-salah',
  },
  {
    kind: 'pengetahuan',
    stem: 'Kegiatan mana yang paling menghemat air di rumah?',
    options: [
      'Menyiram taman setiap pagi',
      'Mencuci mobil tiap hari',
      'Mandi berendam setiap hari',
      'Memperbaiki keran yang menetes',
    ],
    answerIndex: 3,
    explanation: 'Contoh demo: keran menetes membuang banyak air bila dibiarkan lama.',
    topic: 'air',
  },
  {
    kind: 'klaim',
    stem: 'Seorang pejabat disebut melarang semua plastik, tanpa kutipan.',
    claim: 'Pejabat X melarang seluruh plastik mulai besok.',
    options: [
      'Benar — sudah diumumkan resmi',
      'Tidak benar — nama besar dipakai tanpa bukti',
      'Benar jika banyak yang membagikan',
      'Tidak benar, karena plastik sudah dilarang lama',
    ],
    answerIndex: 1,
    explanation: 'Contoh demo: buka situs resmi lembaga yang disebut sebelum mempercayai klaim.',
    topic: 'sampah',
    misinfoType: 'catut-otoritas',
  },
  {
    kind: 'pengetahuan',
    stem: 'Apa yang dimaksud 3R dalam pengelolaan sampah?',
    options: [
      'Reduce, Reuse, Recycle',
      'Remove, Repair, Replace',
      'Recycle, Refuse, Rebuild',
      'Reduce, Rebuild, Remove',
    ],
    answerIndex: 0,
    explanation: 'Contoh demo: 3R berarti mengurangi, memakai ulang, lalu mendaur ulang.',
    topic: 'sampah',
  },
  {
    kind: 'klaim',
    stem: 'Menanam satu pohon langsung menetralkan semua emisi pabrik.',
    claim: 'Satu pohon cukup menyerap semua emisi satu pabrik.',
    options: [
      'Benar — pohon menyerap semua karbon',
      'Benar jika pohonnya besar',
      'Tidak benar — kapasitas serap pohon terbatas',
      'Tidak benar, karena pohon tidak menyerap karbon',
    ],
    answerIndex: 2,
    explanation: 'Contoh demo: penyerapan karbon per pohon kecil dibanding emisi industri.',
    topic: 'hutan',
    misinfoType: 'menyesatkan-salah-tafsir-data',
  },
  {
    kind: 'pengetahuan',
    stem: 'Mengapa hutan hujan penting bagi keanekaragaman hayati?',
    options: [
      'Karena udaranya selalu dingin',
      'Karena tidak pernah hujan di sana',
      'Karena tidak ada manusia di sana',
      'Karena menyimpan banyak spesies dan habitat',
    ],
    answerIndex: 3,
    explanation: 'Contoh demo: hutan hujan menyediakan banyak relung hidup bagi spesies.',
    topic: 'hutan',
  },
  {
    kind: 'klaim',
    stem: 'Grafik dipotong sumbunya agar kenaikan terlihat datar.',
    claim: 'Grafik ini membuktikan suhu tidak naik sama sekali.',
    options: [
      'Benar — grafik selalu objektif',
      'Tidak benar — sumbu terpotong menyesatkan',
      'Benar jika dibuat lembaga resmi',
      'Tidak benar, karena grafik tidak pernah menyesatkan',
    ],
    answerIndex: 1,
    explanation: 'Contoh demo: sumbu terpotong membuat perubahan kecil terlihat datar.',
    topic: 'iklim-cuaca',
    misinfoType: 'menyesatkan-salah-tafsir-data',
  },
  {
    kind: 'pengetahuan',
    stem: 'Apa tanda air minum yang layak di rumah?',
    options: [
      'Keruh dan berbau',
      'Jernih, tidak berbau, sumbernya terlindungi',
      'Berwarna dan berbusa',
      'Selalu berasal dari kemasan',
    ],
    answerIndex: 1,
    explanation: 'Contoh demo: air layak minum jernih, tidak berbau, dan sumbernya terjaga.',
    topic: 'air',
  },
  {
    kind: 'klaim',
    stem: 'Berhenti membuang sampah akan menghentikan semua cuaca ekstrem.',
    claim: 'Semua cuaca ekstrem berhenti bila tidak ada sampah.',
    options: [
      'Benar — sampah penyebab tunggal',
      'Benar jika dilakukan semua orang',
      'Tidak benar — banyak faktor, bukan satu penyebab',
      'Tidak benar, karena cuaca tidak berubah',
    ],
    answerIndex: 2,
    explanation: 'Contoh demo: cuaca ekstrem punya banyak faktor, bukan satu penyebab tunggal.',
    topic: 'iklim-cuaca',
    misinfoType: 'konten-palsu-konspirasi',
  },
];

export const DUMMY_QUESTIONS: Question[] = DATA.map((item, index) => {
  const nomor = index + 1;
  const dua = String(nomor).padStart(2, '0');
  return questionSchema.parse({
    ...item,
    id: `dddddddd-${String(nomor).padStart(4, '0')}-4001-8001-0000000000${dua}`,
    sources: [
      {
        judul: `Sumber contoh ${nomor} (bukan sumber resmi)`,
        url: `https://example.org/dummy/sumber-${dua}`,
        lembaga: 'Contoh',
        tanggalCek: '2026-11-08',
      },
    ],
    status: 'terverifikasi',
    writtenBy: 'dummy-dev',
    reviewedBy: 'dummy-dev-reviewer',
    reviewedAt: '2026-11-08',
  });
});
