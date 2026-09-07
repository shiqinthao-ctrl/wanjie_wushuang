import type { CombatSimulation } from './CombatSimulation';
import { firstStage } from './spawnRules';

type InteractionType = 'barrel' | 'heal' | 'altar' | 'mechanism' | 'supply';
interface MapObject { id: string; type: InteractionType; name: string; x: number; y: number; used: boolean }
interface Fireline { type: 'fireline'; x: number; y: number; w: number; h: number; life: number; max: number; damage: number }
const names: Record<InteractionType, string> = { barrel: '火药桶', heal: '军医补给', altar: '战旗祭坛', mechanism: '弩炮机关', supply: '遗失军箱' };
const descriptions: Record<InteractionType, string> = {
  barrel: '引爆周围敌群', heal: '恢复35%最大生命', altar: '最大生命-10%，本局攻击+22%',
  mechanism: '清除危险，压制地图机制25秒', supply: '本局战利金+180，补充经验',
};
const layout: readonly [InteractionType, number, number][] = [
  ['barrel', .19, .28], ['heal', .79, .25], ['altar', .22, .73],
  ['mechanism', .76, .70], ['supply', .51, .82], ['barrel', .55, .25],
];
const direction = (x: number, y: number): string => !x && !y ? '到达' : ['东', '东南', '南', '西南', '西', '西北', '北', '东北'][Math.round(((Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8]!;

/** Map rules share the battle clock; their rewards remain local to this run. */
export class FirstStageMap {
  private interactables: MapObject[] = [];
  private hazards: Fireline[] = [];
  private used = 0;
  private bonusGold = 0;
  private hazardSuppress = 0;
  private recoveries = new Set<number>();
  private notice = '';
  constructor(private combat: CombatSimulation, private random: () => number) { this.placeObjects(); }
  placeObjects(): void {
    if (this.used) return;
    const { width, height } = this.combat.world;
    this.interactables = layout.map(([type, x, y], i) => ({ id: `I${i}`, type, name: names[type], x: width * x, y: height * y, used: false }));
  }
  private nearest() {
    const { player } = this.combat;
    let item: MapObject | undefined, distance = Infinity;
    for (const candidate of this.interactables) {
      const next = Math.hypot(candidate.x - player.x, candidate.y - player.y);
      if (!candidate.used && next < distance) { item = candidate; distance = next; }
    }
    return { item, distance };
  }
  useNearest(): boolean {
    const { item, distance } = this.nearest();
    if (!item || distance > 74) return false;
    const sim = this.combat, p = sim.player, attack = p.atk;
    item.used = true; this.used++;
    if (item.type === 'barrel') {
      for (const enemy of [...sim.enemies]) if (Math.hypot(enemy.x - item.x, enemy.y - item.y) < 165) sim.hit(enemy, attack * 7.5, 'MAP_BARREL', true);
      if (sim.boss && Math.hypot(sim.boss.x - item.x, sim.boss.y - item.y) < 205) sim.hitBoss(attack * 9.5, 'MAP_BARREL');
      this.notice = `${item.name} · 已引爆`;
    } else if (item.type === 'heal') {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .35); this.notice = `${item.name} · 恢复生命`;
    } else if (item.type === 'altar') {
      p.maxHp *= .90; p.hp = Math.min(p.hp, p.maxHp); p.atk *= 1.22; this.notice = `${item.name} · 攻击强化`;
    } else if (item.type === 'mechanism') {
      this.hazardSuppress = 25; this.hazards = [];
      for (const enemy of [...sim.enemies].sort((a, b) => Number(b.elite) - Number(a.elite)).slice(0, 10)) sim.hit(enemy, attack * 2.1, 'MAP_MECHANISM');
      sim.hitBoss(attack * 4, 'MAP_MECHANISM');
      this.notice = `${item.name} · 地图机制压制25秒`;
    } else {
      this.bonusGold += 180;
      sim.progression.gain(Math.ceil(sim.progression.snapshot().xpNeed * .75)); sim.progression.checkLevel();
      this.notice = `${item.name} · 战利金+180与经验`;
    }
    return true;
  }
  advanceHazards(dt: number): void {
    if (this.hazardSuppress > 0) {
      this.hazardSuppress = Math.max(0, this.hazardSuppress - dt); this.hazards = []; return;
    }
    const { time, player, viewport, world } = this.combat, hazard = firstStage.storyEncounter.hazard;
    if (Math.floor(time / hazard.interval) !== Math.floor((time - dt) / hazard.interval)) {
      const y = Math.max(80, Math.min(world.height - 80, player.y - viewport.height / 2 + 80 + this.random() * (viewport.height - 160)));
      this.hazards.push({ type: 'fireline', x: 0, y, w: world.width, h: hazard.size, life: hazard.life, max: hazard.life, damage: hazard.damage });
    }
    for (const line of this.hazards) {
      line.life -= dt;
      if (Math.abs(player.y - line.y) < line.h / 2) this.combat.hurt(line.damage * dt);
    }
    this.hazards = this.hazards.filter(line => line.life > 0);
  }
  recover(): boolean {
    const index = firstStage.recoveryAt.findIndex((time, i) => this.combat.time >= time && !this.recoveries.has(i));
    if (index < 0) return false;
    this.recoveries.add(index);
    const p = this.combat.player, before = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * firstStage.recoveryRatio);
    this.notice = `首战恢复 · +${Math.max(0, Math.round(p.hp - before))}生命`;
    return true;
  }
  snapshot() {
    let { item, distance } = this.nearest();
    const p = this.combat.player, boss = this.combat.boss;
    if (boss && distance > 74) {
      const candidates = this.interactables.filter(candidate => !candidate.used);
      const guide = candidates.find(candidate => candidate.type === 'barrel' && Math.hypot(candidate.x - boss.x, candidate.y - boss.y) < 205)
        || candidates.find(candidate => candidate.type === 'mechanism') || candidates.find(candidate => candidate.type === 'barrel');
      if (guide) { item = guide; distance = Math.hypot(guide.x - p.x, guide.y - p.y); }
    }
    const target = item ? Object.freeze({ id: item.id, name: item.name, type: item.type, description: descriptions[item.type], distance: Math.round(distance / 25) * 25, direction: direction(item.x - p.x, item.y - p.y), canUse: distance <= 74 }) : undefined;
    return Object.freeze({ used: this.used, bonusGold: this.bonusGold, hazardSuppress: this.hazardSuppress, target, notice: this.notice });
  }
  renderState() { return { interactables: this.interactables.map(item => Object.freeze({ ...item })), hazards: this.hazards.map(line => Object.freeze({ ...line })) }; }
  destroy(): void { this.interactables = []; this.hazards = []; this.recoveries.clear(); this.notice = ''; }
}
