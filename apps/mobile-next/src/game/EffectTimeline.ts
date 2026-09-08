import type { CoreEvent } from '../core/GameCore';
export type VisualEvent = Extract<CoreEvent, { type: 'ring' | 'lightning' }>;
export interface VisualPulse { event: VisualEvent; life: number; duration: number }

/** A bounded presentation clock; disabling it never calls back into GameCore. */
export class EffectTimeline {
  items: VisualPulse[] = [];
  private enabled = true;
  setEnabled(value: boolean) { this.enabled = value; if (!value) this.items = []; }
  advance(events: readonly CoreEvent[], dt: number) {
    if (!this.enabled) return;
    for (const item of this.items) item.life -= Math.max(0, dt);
    this.items = this.items.filter(item => item.life > 0);
    for (const event of events) if (event.type === 'ring' || event.type === 'lightning') {
      const duration = event.type === 'lightning' ? .32 : .25;
      this.items.push({ event, duration, life: duration });
    }
    this.items = this.items.slice(-40);
  }
}
