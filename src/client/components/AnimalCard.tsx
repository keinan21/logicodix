import type { AnimalId } from '../../shared/schema';
import { ANIMAL_ASSETS } from './animalAssets';

export interface AnimalCardProps {
  animalId: AnimalId;
  nama: string;
  fakta: string;
  selected: boolean;
  onSelect: (animalId: AnimalId) => void;
  compact?: boolean;
}

/**
 * AnimalCard — DESIGN §4: default, selected, focus.
 * Ikon hewan memakai SVG Noto lokal (DESIGN §12), bukan emoji sistem.
 */
export function AnimalCard({
  animalId,
  nama,
  fakta,
  selected,
  onSelect,
  compact,
}: AnimalCardProps) {
  const animal = ANIMAL_ASSETS[animalId];

  if (compact) {
    return (
      <button
        type="button"
        className="home-animal"
        aria-label={nama}
        aria-pressed={selected}
        aria-describedby="home-fact"
        onClick={() => onSelect(animalId)}
      >
        <span className="home-animal-placeholder" aria-hidden="true">
          <img className="home-animal-img" src={animal.src} alt="" />
        </span>
        <span>{nama}</span>
        {selected && (
          <span className="home-animal-check" aria-hidden="true">
            ✓
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="animal-card"
      aria-pressed={selected}
      onClick={() => onSelect(animalId)}
    >
      <img className="animal-card-img" src={animal.src} alt="" />
      <span className="animal-card-name">{nama}</span>
      <span className="animal-card-fact">{fakta}</span>
    </button>
  );
}
