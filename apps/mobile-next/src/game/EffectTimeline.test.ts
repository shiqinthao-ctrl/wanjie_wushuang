import { expect, it } from 'vitest';
import { EffectTimeline } from './EffectTimeline';

it('bounds bursts, preserves pause time, expires and clears disabled effects', () => {
  const view = new EffectTimeline();
  const event = { type: 'ring' as const, source: 'G2_FROST', x: 1, y: 2, radius: 100 };
  view.advance(Array.from({ length: 100 }, () => event), 0);
  expect(view.items).toHaveLength(40);
  view.advance([], .1); const life = view.items[0]!.life;
  view.advance([], 0); expect(view.items[0]!.life).toBe(life);
  view.setEnabled(false); expect(view.items).toHaveLength(0);
  view.advance([event], 0); expect(view.items).toHaveLength(0);
  view.setEnabled(true); view.advance([event], 0); view.advance([], 1);
  expect(view.items).toHaveLength(0);
});
