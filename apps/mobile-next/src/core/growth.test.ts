import { describe, expect, it } from 'vitest';
import fixture from '../../../../tasks/mobile-modernization/baseline/growth-oracle.json';
import fresh from '../data/freshSave.json';
import { calculateStartup } from './growth';
import type { GameSave } from './saveTypes';

describe('legacy startup parity', () => {
  for (const item of fixture.cases) {
    it(item.name, () => {
      const save: GameSave = structuredClone({ ...fresh, ...item.patch });
      const before = structuredClone(save);
      expect(calculateStartup(save)).toEqual(item.expected);
      expect(save).toEqual(before);
    });
  }
  it('does not substitute defaults for an unknown selected hero', () => {
    expect(() => calculateStartup({ ...fresh, hero: 'unknown' })).toThrow();
  });
});
