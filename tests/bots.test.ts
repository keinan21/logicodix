import { describe, it, expect } from 'vitest';
import { botDecide, createBotRNG, nextBotProfile } from '../src/shared/bots';
import { BOT_PROFILES } from '../src/shared/constants';

describe('bots', () => {
  it('seed sama → keputusan sama persis (FR-M10)', () => {
    const s1 = createBotRNG(123);
    const s2 = createBotRNG(123);
    const d1 = botDecide(BOT_PROFILES[0]!, s1, 2);
    const d2 = botDecide(BOT_PROFILES[0]!, s2, 2);
    expect(d1.choiceIndex).toBe(d2.choiceIndex);
    expect(d1.delayMs).toBe(d2.delayMs);
  });

  it('delay sesuai rentang profil', () => {
    for (const profile of BOT_PROFILES) {
      const d = botDecide(profile, createBotRNG(55), 1);
      expect(d.delayMs).toBeGreaterThanOrEqual(profile.minDelayMs);
      expect(d.delayMs).toBeLessThanOrEqual(profile.maxDelayMs);
    }
  });

  it('jawaban benar mengarah ke kunci; salah bukan kunci', () => {
    // Coba beberapa seed; deterministik, jadi cukup sampling tetap.
    let sawCorrect = false;
    let sawWrong = false;
    for (let seed = 1; seed <= 50; seed++) {
      const d = botDecide(BOT_PROFILES[0]!, createBotRNG(seed), 3);
      if (d.choiceIndex === 3) sawCorrect = true;
      else sawWrong = true;
    }
    expect(sawCorrect).toBe(true);
    expect(sawWrong).toBe(true);
  });

  it('profil diambil berurutan Kilat → Santai → Teliti → Kilat (FR-M10)', () => {
    expect(nextBotProfile(0).id).toBe('kilat');
    expect(nextBotProfile(1).id).toBe('santai');
    expect(nextBotProfile(2).id).toBe('teliti');
    expect(nextBotProfile(3).id).toBe('kilat');
  });
});
