import { useEffect, useRef, useState } from 'react';
import { GAME } from '../../shared/constants';
import type { ParticipantPublic } from '../../shared/schema';
import { ANIMAL_ASSETS } from './animalAssets';
import './Lane.css';
import seedling from '../assets/home/seedling.svg';

export interface LaneProps {
  participant: ParticipantPublic;
  /** Posisi langkah 0..5 (0 = start). */
  steps: number;
  correct?: boolean;
}

/**
 * Lane — DESIGN §4/§5: label nickname warna slot (atau warna bot), 6 titik posisi,
 * hewan SVG menghadap kanan dengan kaki berayun selama maju (`motion-step`),
 * satu tunas per langkah yang sudah ditempuh, garis finish kotak-kotak, dan label status.
 * Gerak dimatikan otomatis oleh `prefers-reduced-motion` (DESIGN §8).
 */
export function Lane({ participant, steps, correct = false }: LaneProps) {
  const [moving, setMoving] = useState(false);
  const runnerRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const runner = runnerRef.current;
    if (!runner) return;
    const updateMotion = (event: TransitionEvent) => {
      if (event.target === runner && event.propertyName === 'left') {
        setMoving(event.type === 'transitionrun');
      }
    };
    runner.addEventListener('transitionrun', updateMotion);
    runner.addEventListener('transitionend', updateMotion);
    runner.addEventListener('transitioncancel', updateMotion);
    return () => {
      runner.removeEventListener('transitionrun', updateMotion);
      runner.removeEventListener('transitionend', updateMotion);
      runner.removeEventListener('transitioncancel', updateMotion);
    };
  }, []);
  const animal = ANIMAL_ASSETS[participant.animalId];
  const safeSteps = Math.min(GAME.STEPS_TO_FINISH, Math.max(0, steps));
  const progress = safeSteps / GAME.STEPS_TO_FINISH;
  const labelColor = participant.isBot
    ? 'var(--color-bot)'
    : (`var(--color-slot-${participant.slot})` as string);

  return (
    <div
      className={`lane${participant.status === 'left' ? ' lane-left' : ''}`}
      data-status={participant.status}
      data-animal={participant.animalId}
    >
      <span className="lane-label" style={{ color: labelColor }} title={participant.nickname}>
        <span className="lane-label-text">
          {participant.nickname}
          {participant.isBot && !participant.nickname.startsWith('BOT ') ? ' · BOT' : ''}
        </span>
      </span>

      <div className="lane-track">
        <div className="lane-rail">
          {Array.from({ length: safeSteps }, (_, index) => (
            <span
              key={index}
              className="lane-sprout"
              aria-hidden="true"
              style={{ left: `${(index / GAME.STEPS_TO_FINISH) * 100}%` }}
            >
              <img src={seedling} alt="" />
            </span>
          ))}

          <span
            ref={runnerRef}
            className="lane-runner"
            style={{ left: `${progress * 100}%` }}
            data-moving={
              moving && participant.status !== 'left' && participant.status !== 'outOfQuestions'
            }
          >
            <span className="lane-sprite" aria-hidden="true">
              <img className="lane-limb lane-limb-back" src={animal.src} alt="" />
              <img className="lane-limb lane-limb-front" src={animal.src} alt="" />
              <img className="lane-animal" src={animal.src} alt="" />
            </span>
            {correct && (
              <span className="lane-check" role="status" aria-label="Benar">
                <span aria-hidden="true">✓</span>
                <span aria-hidden="true">Benar!</span>
              </span>
            )}
          </span>
        </div>
        <span className="lane-finish" aria-hidden="true" />
      </div>

      <span className="lane-status">{statusLabel(participant)}</span>
    </div>
  );
}

function statusLabel(participant: ParticipantPublic): string {
  switch (participant.status) {
    case 'finished':
      return `Posisi ${participant.finishOrder ?? '–'}`;
    case 'outOfQuestions':
      return 'Soal habis';
    case 'left':
      return 'Keluar';
    default:
      return '';
  }
}
