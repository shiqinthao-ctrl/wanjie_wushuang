// Original synthesized engineering samples; no recordings or third-party sound sources.
// Seconds and frequencies describe sound only, never combat timing.
export const cues = {
  hit: { priority: 0, cooldown: .09, duration: .10, notes: [150, 65], wave: 'triangle' },
  basic: { priority: 1, cooldown: .10, duration: .16, notes: [460, 110], wave: 'triangle' },
  kill: { priority: 1, cooldown: .12, duration: .18, notes: [190, 80], wave: 'sine' },
  pickup: { priority: 1, cooldown: .12, duration: .14, notes: [880, 1320], wave: 'sine' },
  dodge: { priority: 2, cooldown: .15, duration: .22, notes: [620, 170], wave: 'sine' },
  windup: { priority: 2, cooldown: .15, duration: .12, notes: [110, 210], wave: 'triangle' },
  skill: { priority: 3, cooldown: .18, duration: .80, notes: [196, 392, 147], wave: 'triangle' },
  ultimate: { priority: 4, cooldown: .60, duration: 1.10, notes: [98, 196, 294, 392], wave: 'triangle' },
  level: { priority: 5, cooldown: .30, duration: .50, notes: [523, 659, 784], wave: 'sine' },
  evolve: { priority: 6, cooldown: .40, duration: .85, notes: [262, 392, 523, 784], wave: 'triangle' },
  awaken: { priority: 7, cooldown: .40, duration: 1.20, notes: [196, 294, 392, 587, 784], wave: 'triangle' },
  victory: { priority: 7, cooldown: .50, duration: 1.10, notes: [392, 523, 659, 784], wave: 'sine' },
  defeat: { priority: 7, cooldown: .50, duration: .90, notes: [294, 247, 196, 98], wave: 'sine' },
  hurt: { priority: 8, cooldown: .20, duration: .24, notes: [180, 90, 65], wave: 'triangle' },
  boss: { priority: 9, cooldown: .50, duration: .80, notes: [98, 147, 98], wave: 'triangle' },
  warning: { priority: 10, cooldown: .25, duration: .45, notes: [880, 440, 880], wave: 'triangle' },
} as const;
export type CueId = keyof typeof cues;
export function isCue(value: string): value is CueId { return Object.hasOwn(cues, value); }
