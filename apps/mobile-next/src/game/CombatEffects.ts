import type Phaser from 'phaser';
import type { CoreEvent } from '../core/GameCore';
import { EffectTimeline } from './EffectTimeline';

export class CombatEffects {
  private timeline = new EffectTimeline();
  constructor(private graphics: Phaser.GameObjects.Graphics) {}
  setEnabled(value: boolean) { this.timeline.setEnabled(value); this.graphics.clear(); }
  draw(events: readonly CoreEvent[], dt: number) {
    this.timeline.advance(events, dt);
    const g = this.graphics; g.clear();
    for (const { event, life, duration } of this.timeline.items) {
      const alpha = life / duration;
      if (event.type === 'lightning') {
        // Coordinates come from actual hits; rendering never selects combat targets.
        for (let i = 1; i < event.points.length; i++) {
          const a = event.points[i - 1]!, b = event.points[i]!;
          const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1;
          g.lineStyle(3, 0xd9f48e, alpha).beginPath().moveTo(a.x, a.y);
          for (let j = 1; j < 6; j++) {
            const offset = (j % 2 ? 1 : -1) * Math.min(11, length * .08);
            g.lineTo(a.x + dx * j / 6 - dy / length * offset, a.y + dy * j / 6 + dx / length * offset);
          }
          g.lineTo(b.x, b.y).strokePath();
          g.fillStyle(0xf6ffd4, alpha).fillCircle(b.x, b.y, 5);
        }
        continue;
      }
      const frost = event.source.startsWith('G2_FROST');
      const thunder = event.source === 'A013' || event.source.startsWith('G2_LIGHTNING');
      const summon = event.source === 'S001';
      const color = frost ? 0x8de8ff : thunder ? 0xd9f48e : summon ? 0xc5b3ef : event.source === 'dodge' ? 0x70a9ff : 0xffae6e;
      const radius = event.radius * (.45 + .55 * (1 - alpha));
      g.lineStyle(2, color, alpha).strokeCircle(event.x, event.y, radius);
      if (frost || thunder || summon) {
        const count = frost ? 8 : summon ? 3 : 5;
        for (let i = 0; i < count; i++) {
          const angle = i * Math.PI * 2 / count - Math.PI / 2;
          g.lineStyle(frost ? 3 : 4, color, alpha).lineBetween(
            event.x + Math.cos(angle) * radius * .3, event.y + Math.sin(angle) * radius * .3,
            event.x + Math.cos(angle + (summon ? .4 : 0)) * radius, event.y + Math.sin(angle + (summon ? .4 : 0)) * radius);
        }
      }
    }
  }
  clear() { this.setEnabled(false); }
}
