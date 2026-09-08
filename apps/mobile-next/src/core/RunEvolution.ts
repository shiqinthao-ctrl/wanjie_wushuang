import { activeSkills, bonds, hasSkillTag, heroForms, passiveSkills, signatureSkills, skillDetails, skillRoutes, skillTags, starter } from './evolutionCatalog';
import type { FormId, RouteId, StarterId } from './evolutionCatalog';
import type { ChoiceKind, LevelOption, SkillLevels } from './progression';

export function evolutionBuild(hero: string) {
  const initial = starter(hero);
  return { active: [...initial.active, ...activeSkills.filter(id => !(initial.active as readonly string[]).includes(id))], passive: [initial.passive, ...passiveSkills.filter(id => id !== initial.passive)] };
}
export class RunEvolution {
  readonly hero: StarterId;
  private form: FormId | undefined;
  private rank = 0;
  private routes: Partial<Record<string, RouteId>> = {};
  constructor(hero: string) { this.hero = starter(hero).id; }
  special(level: number, skills: SkillLevels): LevelOption[] {
    if (!this.form && level >= 3) return heroForms.filter(form => form.hero === this.hero).map(form => ({ kind: 'hero', id: form.id, label: form.name, detail: form.detail }));
    if (this.form && this.rank === 1 && level >= 8 && Object.values(skills).some(lv => (lv || 0) >= 3)) {
      const form = heroForms.find(form => form.id === this.form)!;
      return [{ kind: 'hero', id: 'awaken', label: `觉醒 · ${form.name}`, detail: form.awakening }];
    }
    const skill = skillRoutes.find(route => !this.routes[route.skill] && (skills[route.skill] || 0) >= 3)?.skill;
    return skillRoutes.filter(route => route.skill === skill).map(route => ({ kind: 'route', id: route.id, label: route.name, detail: route.detail }));
  }
  pick(level: number, skills: SkillLevels, kind: ChoiceKind, id: string): boolean {
    if (!this.special(level, skills).some(option => option.kind === kind && option.id === id)) return false;
    if (kind === 'hero') {
      if (id === 'awaken') this.rank = 2;
      else { this.form = id as FormId; this.rank = 1; }
    } else {
      const route = skillRoutes.find(route => route.id === id)!; this.routes[route.skill] = route.id;
    }
    return true;
  }
  route(skill: string): RouteId | undefined { return this.routes[skill]; }
  signature(skills: SkillLevels): string | undefined {
    const id = this.form && signatureSkills[this.form];
    return id && (skills[id] || 0) < 3 ? id : undefined;
  }
  bond(id: typeof bonds[number]['id'], skills: SkillLevels): boolean {
    const rule = bonds.find(bond => bond.id === id)!;
    return rule.tags.every(tag => Object.entries(skills).some(([skill, level]) => (level || 0) > 0 && hasSkillTag(skill, tag)));
  }
  decorate(option: LevelOption): LevelOption { return { ...option, detail: skillDetails[option.id] || '', tag: skillTags[option.id] }; }
  snapshot(skills: SkillLevels) {
    const base = starter(this.hero), form = heroForms.find(form => form.id === this.form);
    return Object.freeze({ heroId: this.hero, formId: this.form, rank: this.rank, name: form ? `${this.rank === 2 ? '觉醒 · ' : ''}${form.name}` : base.name,
      color: form?.color || base.color, skill: form?.id === 'frostlord' ? '随身寒域' : form?.id === 'thunderlord' ? '九霄连雷' : form?.id === 'beastlord' ? '冥契近卫' : form?.id === 'bulwark' ? '焚城火域' : form?.id === 'legion' ? '焰影号令' : form?.id === 'void' ? '虚空牵引' : base.skill,
      ult: form?.id === 'frostlord' ? '霜狱降临' : form?.id === 'thunderlord' ? '万雷天劫' : form?.id === 'beastlord' ? '百兽夜行' : base.ult,
      next: !this.form ? 'Lv.3 选择英雄进化' : this.rank === 1 ? 'Lv.8 + 任一主动 Lv.3 解锁觉醒' : '英雄已觉醒，继续组合技能与羁绊',
      routes: Object.freeze({ ...this.routes }),
      bonds: Object.freeze(bonds.map(bond => Object.freeze({ ...bond, tags: Object.freeze([...bond.tags]), active: this.bond(bond.id, skills), count: bond.tags.filter(tag => Object.entries(skills).some(([id, level]) => (level || 0) > 0 && hasSkillTag(id, tag))).length }))),
    });
  }
}
export type EvolutionSnapshot = ReturnType<RunEvolution['snapshot']>;
