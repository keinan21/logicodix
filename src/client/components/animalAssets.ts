import type { AnimalId } from '../../shared/schema';
import orangutan from '../assets/animals/orangutan.svg';
import harimau from '../assets/home/tiger.svg';
import gajah from '../assets/animals/gajah.svg';
import penyu from '../assets/home/turtle.svg';
import badak from '../assets/animals/badak.svg';
import burung from '../assets/animals/burung.svg';

export interface AnimalAsset {
  src: string;
  nama: string;
}

/**
 * Hewan pelari memakai SVG Noto Emoji yang disimpan di repo, bukan emoji sistem
 * (DESIGN §12: emoji tampil beda di tiap HP).
 */
export const ANIMAL_ASSETS: Record<AnimalId, AnimalAsset> = {
  orangutan: { src: orangutan, nama: 'Orangutan' },
  harimau: { src: harimau, nama: 'Harimau' },
  gajah: { src: gajah, nama: 'Gajah' },
  penyu: { src: penyu, nama: 'Penyu' },
  badak: { src: badak, nama: 'Badak' },
  burung: { src: burung, nama: 'Burung' },
};
