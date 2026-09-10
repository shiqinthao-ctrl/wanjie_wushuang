import type { CoreEvent } from '../core/GameCore';
import type { FeedbackKind } from '../core/CombatSimulation';
import type { CueId } from './audio/cues';

export const chapterAssets = [
  { id: 'CH1-GROUND', key: 'ground', file: 'art/battlefield.svg', version: 'G5' },
  { id: 'H001-BODY', key: 'hero', file: 'art/hero-h001.svg', version: 'G5' },
  { id: 'EN001-BODY', key: 'enemy', file: 'art/enemy-en001.svg', version: 'G5' },
  { id: 'B001-BODY', key: 'boss', file: 'art/boss-b001.svg', version: 'G5' },
] as const;
export const chapterActors = {
  H001: { renderer: 'image', width: 66, height: 81, originX: .5, originY: .84 },
  dragon: { renderer: 'DragonView', version: 'R1c', weapon: 0xd6ebe1, awakenedWeapon: 0xffe6a3, telegraph: 0xf6cd88 },
} as const;
// Named core sources map to samples, so replacement audio never touches rules.
export const chapterActions: Readonly<Record<string, CueId>> = {
  H001_SLASH: 'basic', H001_BASIC: 'basic', H001_E: 'skill', H001_R: 'ultimate',
  H001_DRAGON_BASIC: 'basic', H001_DRAGON_E: 'skill', H001_DRAGON_R: 'ultimate', A003: 'basic', dodge: 'dodge',
};
const feedback: Record<FeedbackKind, CueId> = {
  'player-hurt': 'hurt', 'boss-arrive': 'boss', 'boss-phase': 'boss', 'boss-warning': 'warning',
  'boss-defeat': 'victory', 'hero-windup': 'windup', evolution: 'evolve', awakening: 'awaken',
};
export function chapterCues(events: readonly CoreEvent[]): CueId[] {
  const result: CueId[] = [];
  for (const event of events) {
    if (event.type === 'battle-feedback') result.push(feedback[event.kind]);
    else if (event.type === 'hit' && event.damage > 0) result.push('hit');
    else if (event.type === 'kill') result.push('kill');
    else if (event.type === 'xp-pickup') result.push('pickup');
    else if (event.type === 'level-choice') result.push('level');
    else if (event.type === 'ring' || event.type === 'dragon-slash') {
      const cue = chapterActions[event.source];
      if (cue && (event.type !== 'dragon-slash' || event.phase === 'release')) result.push(cue);
    }
  }
  return result;
}
