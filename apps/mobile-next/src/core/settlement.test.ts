import { describe, expect, it } from 'vitest';
import oracle from '../../../../tasks/mobile-modernization/baseline/settlement-oracle.json';
import { settleRun, freezeRun } from './settlement';
import type { FinalRun } from './settlement';
import type { GameSave, GearInstance } from './saveTypes';

function record(item: typeof oracle.cases[number]): FinalRun {
  return freezeRun({
    heroId: 'H001', chapter: 'ST001', stageId: 'ST001-01', modeId: 'story', difficultyId: 'normal',
    endReason: item.spec.win ? 'victory' : item.spec.hp === 0 ? 'defeat' : 'timeout', reason: item.spec.name,
    hp: item.spec.hp * 1000, maxHp: 1000, time: item.spec.time, level: 1, kills: item.spec.kills,
    eliteKills: item.spec.elite, maxCombo: item.spec.combo, modeScore: 777, modeBosses: item.spec.win ? 1 : 0,
    interactionsUsed: 2, mapGold: item.spec.bonus || 0, bossPhaseMax: 3, petGold: item.spec.petGold || 0,
    petDamage: 1234.5, petHeals: 0, damageBy: { H001_SLASH: 7200, A011: 3400 },
    evolved: ['E001'], fused: [], drops: item.drops as GearInstance[], build: item.before.build,
    timedRewards: item.result.timedRewards, encounterEvidence: item.result.encounterEvidence,
  });
}

describe('effective legacy settlement oracle', () => {
  for (const item of oracle.cases) it(item.spec.name, () => {
    const before = structuredClone(item.before) as GameSave, snapshot = record(item);
    const settled = settleRun(before, snapshot);
    expect(settled.save).toEqual(item.after);
    expect(settled.result).toMatchObject(item.result);
    expect(before).toEqual(item.before);
    expect(item.duplicateUnchanged).toBe(true);
  });
  it.each(['endless', 'bossrush', 'daily'])('rejects unsupported %s before any mutation', modeId => {
    const item = oracle.cases[0]!, before = structuredClone(item.before) as GameSave;
    expect(() => settleRun(before, { ...record(item), modeId })).toThrow(/尚未支持/);
    expect(before).toEqual(item.before);
  });
  it('keeps unknown fields and existing UID, adds each new template and UID only once', () => {
    const item = oracle.cases.at(-1)!, before = structuredClone(item.before) as GameSave;
    before.future = { keep: [1, 2] };
    const drop = { ...item.drops[0]!, templateId: 'EQ_NEW' } as GearInstance;
    const snapshot = { ...record(item), drops: [before.inventory.gearInstances[0]!, drop, structuredClone(drop)] };
    const { save } = settleRun(before, snapshot);
    expect(save.future).toEqual(before.future);
    expect(save.inventory.gearInstances).toHaveLength(before.inventory.gearInstances.length + 1);
    expect(save.inventory.gearInstances.at(-1)).toEqual(drop);
    expect((save.inventory.gear as string[]).filter(id => id === 'EQ_NEW')).toHaveLength(1);
  });
  it('freezes a detached final record recursively', () => {
    const input = record(oracle.cases[1]!), result = freezeRun(input);
    expect(result).not.toBe(input); expect(Object.isFrozen(result.build.active)).toBe(true);
    expect(Object.isFrozen(result.drops[0]!.affixes[0])).toBe(true);
    expect(() => { (result.drops[0] as GearInstance).uid = 'changed'; }).toThrow();
    expect(() => { (result.damageBy as Record<string, number>).A011 = 0; }).toThrow();
  });
  it('rejects a changed preparation difficulty before mutation', () => {
    const item = oracle.cases[0]!, before = { ...structuredClone(item.before), difficulty: 'hard' } as GameSave;
    const copy = structuredClone(before);
    expect(() => settleRun(before, record(item))).toThrow(/出征配置/);
    expect(before).toEqual(copy);
  });
  it.each(['accountXp', 'accountLv', 'modeTokens', 'talentPoints'])('rejects corrupt %s without losing progress', field => {
    const item = oracle.cases[0]!, before = { ...structuredClone(item.before), [field]: -1 } as GameSave;
    const copy = structuredClone(before);
    expect(() => settleRun(before, record(item))).toThrow(); expect(before).toEqual(copy);
  });
});
