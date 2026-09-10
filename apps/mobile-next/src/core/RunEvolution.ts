import { activeSkills, bonds, hasSkillTag, heroForms, passiveSkills, signatureSkills, skillDetails, skillRoutes, skillTags, starter } from './evolutionCatalog';
import type { FormId, RouteId, StarterId } from './evolutionCatalog';
import type { ChoiceKind, LevelOption, SkillLevels } from './progression';
import { chapterCoreSkills } from '../chapter/catalog';
import { dragonText } from '../chapter/dragonText';

export function evolutionBuild(hero: string) {
  const initial = starter(hero);
  return { active: [...initial.active, ...activeSkills.filter(id => !(initial.active as readonly string[]).includes(id))], passive: [initial.passive, ...passiveSkills.filter(id => id !== initial.passive)] };
}
export class RunEvolution {
  readonly hero: StarterId;
  private form: FormId | undefined;
  private rank = 0;
  private routes: Partial<Record<string, RouteId>> = {};
  private evolutionOffer?: LevelOption[];
  constructor(hero: string, readonly ruleset?: 'chapter1-v1', private random = Math.random) { this.hero = starter(hero).id; }
  get formId(): FormId | undefined { return this.form; }
  get awakened(): boolean { return this.rank === 2; }
  coreSkill(): string | undefined { return this.form ? chapterCoreSkills[this.form] : undefined; }
  special(level: number, skills: SkillLevels): LevelOption[] {
    if (!this.form && level >= 3) {
      const options: LevelOption[] = heroForms.filter(form => form.hero === this.hero).map(form => ({ kind: 'hero', id: form.id, label: form.name, detail: this.ruleset && form.id === 'dragon' ? dragonText.evolution : form.detail }));
      if (!this.ruleset) return options;
      if (!this.evolutionOffer) {
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(this.random() * (i + 1)); [options[i], options[j]] = [options[j]!, options[i]!];
        }
        this.evolutionOffer = options.slice(0, 3);
      }
      return this.evolutionOffer.map(option => ({ ...option }));
    }
    if (this.form && this.rank === 1 && level >= 8 && (this.ruleset ? (skills[this.coreSkill()!] || 0) >= 3 : Object.values(skills).some(lv => (lv || 0) >= 3))) {
      const form = heroForms.find(form => form.id === this.form)!;
      return [{ kind: 'hero', id: 'awaken', label: `觉醒 · ${form.name}`, detail: this.ruleset && form.id === 'dragon' ? dragonText.awakening : form.awakening }];
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
    const id = this.ruleset ? this.coreSkill() : this.form && signatureSkills[this.form];
    return id && (skills[id] || 0) < 3 ? id : undefined;
  }
  bond(id: typeof bonds[number]['id'], skills: SkillLevels): boolean {
    const rule = bonds.find(bond => bond.id === id)!;
    return rule.tags.every(tag => Object.entries(skills).some(([skill, level]) => (level || 0) > 0 && hasSkillTag(skill, tag)));
  }
  decorate(option: LevelOption): LevelOption { return { ...option, detail: this.ruleset && this.form === 'dragon' && option.id === 'A003' ? dragonText.core : skillDetails[option.id] || '', tag: skillTags[option.id] }; }
  snapshot(skills: SkillLevels) {
    const base = starter(this.hero), form = heroForms.find(form => form.id === this.form);
    const dragon = this.ruleset && form?.id === 'dragon';
    return Object.freeze({ heroId: this.hero, formId: this.form, rank: this.rank, name: form ? `${this.rank === 2 ? '觉醒 · ' : ''}${form.name}` : base.name,
      color: form?.color || base.color, skill: dragon ? '赤龙破阵' : form?.id === 'frostflame' ? '霜焰剑域' : form?.id === 'windwarden' ? '岚影伏阵' : form?.id === 'frostlord' ? '随身寒域' : form?.id === 'thunderlord' ? '九霄连雷' : form?.id === 'beastlord' ? '冥契近卫' : form?.id === 'bulwark' ? '焚城火域' : form?.id === 'legion' ? '焰影号令' : form?.id === 'void' ? '虚空牵引' : base.skill,
      ult: dragon ? '龙焰连斩' : form?.id === 'frostflame' ? '冰火天倾' : form?.id === 'windwarden' ? '千岚影阵' : form?.id === 'frostlord' ? '霜狱降临' : form?.id === 'thunderlord' ? '万雷天劫' : form?.id === 'beastlord' ? '百兽夜行' : base.ult,
      combatHint: dragon ? dragonText.controls : undefined,
      awakeningHint: dragon && this.rank === 2 ? dragonText.awakening : undefined,
      next: !this.form ? 'Lv.3 选择英雄进化' : this.rank === 1 ? this.ruleset ? 'Lv.8 + 核心术式 Lv.3 解锁觉醒' : 'Lv.8 + 任一主动 Lv.3 解锁觉醒' : '英雄已觉醒，继续组合技能与羁绊',
      routes: Object.freeze({ ...this.routes }),
      bonds: Object.freeze(bonds.map(bond => Object.freeze({ ...bond, tags: Object.freeze([...bond.tags]), active: this.bond(bond.id, skills), count: bond.tags.filter(tag => Object.entries(skills).some(([id, level]) => (level || 0) > 0 && hasSkillTag(id, tag))).length }))),
    });
  }
}
export type EvolutionSnapshot = ReturnType<RunEvolution['snapshot']>;
