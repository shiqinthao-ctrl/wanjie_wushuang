import names from '../data/skills.json';

export type SkillLevels = Readonly<Partial<Record<string, number>>>;
export type ChoiceKind = 'active' | 'passive';
export interface LevelOption { readonly kind: ChoiceKind; readonly id: string; readonly label: string }
export interface LevelChoice { readonly token: number; readonly options: readonly LevelOption[] }
export interface Crystal { x: number; y: number; value: number; elite: boolean }
export const skillName = (id: string): string => (names as Record<string, string>)[id] ?? id;
export const effectiveXp = (elite: boolean, multiplier = 1): number => (elite ? 18 : 4) * (Number.isFinite(multiplier) ? multiplier : 1);

export class XpField {
  private crystals: Crystal[] = [];
  spawn(enemy: { x: number; y: number; elite: boolean }, value = effectiveXp(enemy.elite)): void {
    if (!Number.isFinite(value) || value <= 0) return;
    this.crystals.push({ x: enemy.x, y: enemy.y, elite: enemy.elite, value });
    while (this.crystals.length > 180) {
      const overflow = this.crystals.pop()!;
      const target = this.crystals[0]!;
      target.value += overflow.value; target.elite ||= overflow.elite;
    }
  }
  advance(player: { x: number; y: number }, elapsed: number) {
    const dt = Math.max(0, Number.isFinite(elapsed) ? elapsed : 0);
    let value = 0, x = player.x, y = player.y;
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const crystal = this.crystals[i]!;
      const dx = player.x - crystal.x, dy = player.y - crystal.y, distance = Math.hypot(dx, dy);
      // Collection precedes attraction, including when attraction reaches the player this frame.
      if (distance <= 26) {
        value += crystal.value; x = crystal.x; y = crystal.y;
        this.crystals.splice(i, 1); continue;
      }
      if (distance < 240 && distance > 0) {
        const step = Math.min(distance, 540 * dt);
        crystal.x += dx / distance * step; crystal.y += dy / distance * step;
      }
    }
    return { value, x, y };
  }
  snapshot(): readonly Readonly<Crystal>[] { return this.crystals.map(item => Object.freeze({ ...item })); }
  clear(): void { this.crystals = []; }
}

export class Progression {
  private level = 1;
  private xp = 0;
  private xpNeed = 26;
  private skills: Partial<Record<string, number>>;
  private passives: Partial<Record<string, number>>;
  private choice: LevelChoice | undefined;
  private sequence = 0;
  private build: { active: readonly string[]; passive: readonly string[] };
  constructor(build: { active: readonly string[]; passive: readonly string[] }, skills: SkillLevels, passives: SkillLevels, private random: () => number = Math.random) {
    this.build = { active: [...build.active], passive: [...build.passive] };
    this.skills = { ...skills }; this.passives = { ...passives };
  }
  validOptions(): LevelOption[] {
    const options: LevelOption[] = [];
    for (const kind of ['active', 'passive'] as const) {
      const levels = kind === 'active' ? this.skills : this.passives;
      for (const id of this.build[kind]) {
        const level = levels[id] || 0;
        if (level > 0 && level < 5) options.push({ kind, id, label: `${skillName(id)} Lv.${level + 1}` });
        else if (level === 0 && Object.keys(levels).length < 6) options.push({ kind, id, label: `解锁 ${skillName(id)}` });
      }
    }
    // Preserve the legacy comparator and its RNG consumption during rule migration.
    return options.sort(() => this.random() - .5);
  }
  gain(value: number): void { if (Number.isFinite(value) && value > 0) this.xp += value; }
  checkLevel(blocked = false): void {
    if (blocked || this.choice || this.xp < this.xpNeed) return;
    this.xp -= this.xpNeed; this.level++; this.xpNeed = Math.round(26 + this.level * 11);
    const options = this.validOptions().slice(0, 3);
    if (options.length) this.choice = Object.freeze({ token: ++this.sequence, options: Object.freeze(options.map(option => Object.freeze(option))) });
  }
  pick(token: number, kind: ChoiceKind, id: string): boolean {
    if (!this.choice || this.choice.token !== token || !this.choice.options.some(option => option.kind === kind && option.id === id)) return false;
    const levels = kind === 'active' ? this.skills : this.passives;
    levels[id] = (levels[id] || 0) + 1;
    this.choice = undefined;
    this.checkLevel();
    return true;
  }
  snapshot() {
    return Object.freeze({ level: this.level, xp: this.xp, xpNeed: this.xpNeed, skills: Object.freeze({ ...this.skills }), passives: Object.freeze({ ...this.passives }), choice: this.choice });
  }
}
