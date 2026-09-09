import { describe, expect, it } from 'vitest';
import { bondRequirements, choiceAdvice, routeAdvice } from './buildAdvice';
import { RunEvolution } from '../core/RunEvolution';
import { skillRoutes } from '../core/evolutionCatalog';

describe('G3 build decisions', () => {
  it('shows both forgone alternatives when a skill has three routes', () => {
    expect(routeAdvice('ambush')?.alternative).toBe('游龙风暴 / 环身风暴');
    expect(routeAdvice('orbit')?.alternative).toBe('游龙风暴 / 伏阵风暴');
    expect(routeAdvice('roaming')?.alternative).toBe('环身风暴 / 伏阵风暴');
  });
  it('previews the new wind-shadow bond from an owned shadow skill', () => {
    const skills = { S001: 1 }, run = new RunEvolution('H012');
    expect(choiceAdvice({ kind: 'active', id: 'A026', label: '龙卷风' }, run.snapshot(skills), skills).bonds)
      .toContainEqual({ name: '风影合袭', completes: true });
  });
  it('names owned skills and missing candidates, ignoring zero levels', () => {
    const conditions = bondRequirements(['冰', '雷'], { G2_FROST: 0, A013: 2 });
    expect(conditions[0]).toMatchObject({ met: false, skills: ['寒霜环'] });
    expect(conditions[1]).toMatchObject({ met: true, skills: ['雷电弹'] });
    expect(bondRequirements(['影'], { S001: 1 })[0]).toMatchObject({ met: true, skills: ['影分身'] });
  });
  it('keeps alternative requirements within selectable active skills', () => {
    const fire = bondRequirements(['炎'], {})[0]!;
    expect(fire.skills).toHaveLength(5);
    expect(fire.met).toBe(false);
    expect(bondRequirements(['召'], { S001: 1 })[0]!.met).toBe(true);
  });
  it('explains the exclusive counterpart of every route', () => {
    for (const { id } of skillRoutes) {
      const advice = routeAdvice(id)!;
      expect(advice.style.length).toBeGreaterThan(3);
      expect(advice.tradeoff.length).toBeGreaterThan(3);
      expect(advice.alternative).toBeTruthy();
    }
    expect(routeAdvice('thunderstrike')!.alternative).toBe('万钧连锁');
    expect(routeAdvice('guard')!.alternative).toBe('游猎影军');
  });
  it('shows the selected branch on later upgrades instead of offering both again', () => {
    const run = new RunEvolution('H001');
    run.pick(2, { G2_FROST: 3 }, 'route', 'shatter');
    const advice = choiceAdvice({ kind: 'active', id: 'G2_FROST', label: '寒霜环 Lv.4' }, run.snapshot({ G2_FROST: 3 }), { G2_FROST: 3 });
    expect(advice.route?.name).toBe('碎冰震波');
    expect(advice.detail).not.toContain('Lv.3 可选');
    expect(advice.detail).toContain('瞬间伤害');
  });
  it('previews only bonds advanced by this active skill and never mutates ownership', () => {
    const skills = Object.freeze({ G2_FROST: 1 });
    const run = new RunEvolution('H001');
    const option = { kind: 'active' as const, id: 'A013', label: '雷电弹' };
    const advice = choiceAdvice(option, run.snapshot(skills), skills);
    expect(advice.bonds.find(b => b.name === '冰雷超导')?.completes).toBe(true);
    expect(advice.bonds.find(b => b.name === '雷兽共鸣')?.completes).toBe(false);
    expect(skills).toEqual({ G2_FROST: 1 });
    expect(choiceAdvice({ ...option, kind: 'passive' }, run.snapshot(skills), skills).bonds).toEqual([]);
    expect(choiceAdvice(option, undefined, skills).bonds).toEqual([]);
  });
});
