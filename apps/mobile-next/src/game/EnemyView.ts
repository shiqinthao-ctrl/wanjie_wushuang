import type Phaser from 'phaser';
import type { CoreEvent } from '../core/GameCore';
import type { CombatSimulation } from '../core/CombatSimulation';
import { SOLDIER, isSoldier } from '../chapter/SoldierCombat';

type Units = ReturnType<CombatSimulation['renderState']>['enemies'];
type Reaction = Extract<CoreEvent, { type: 'soldier-death' | 'enemy-strike' }>;

/** Essential combat feedback stays enabled; ages advance only with the battle clock. */
export class EnemyView {
  private marks: { event: Reaction; age: number }[] = [];
  private actors: Phaser.GameObjects.Graphics;
  private warnings: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.warnings = scene.add.graphics().setDepth(1.4);
    this.actors = scene.add.graphics().setDepth(2.5);
  }
  draw(enemies: Units, events: readonly CoreEvent[], dt: number, time: number) {
    this.marks = this.marks.map(mark => ({ ...mark, age: mark.age + dt })).filter(mark => mark.age < (mark.event.type === 'soldier-death' ? .65 : .22));
    for (const event of events) if (event.type === 'soldier-death' || event.type === 'enemy-strike') this.marks.push({ event, age: 0 });
    if (this.marks.length > 48) this.marks.splice(0, this.marks.length - 48);
    const g = this.actors, w = this.warnings; g.clear(); w.clear();
    for (const enemy of enemies) {
      if (!isSoldier(enemy)) continue;
      const pose = enemy.soldier;
      if (pose?.phase === 'windup') {
        const progress = Math.min(1, pose.elapsed / SOLDIER.windup);
        this.sector(w, pose.x, pose.y, pose.facing, pose.range, pose.arc, 0xfa956f, .12 + progress * .14);
        w.lineStyle(3, 0xffdfb6, 1).beginPath().arc(pose.x, pose.y, pose.range * progress, pose.facing - pose.arc / 2, pose.facing + pose.arc / 2).strokePath();
      }
      const facing = pose?.facing ?? -Math.PI / 2;
      const lean = pose?.phase === 'strike' ? 5 : pose?.phase === 'windup' ? -3 : 0;
      this.soldier(g, enemy.x + Math.cos(facing) * lean, enemy.y + Math.sin(facing) * lean, facing, pose?.phase || 'move', enemy.flash, 1);
      g.fillStyle(0x18241f, 1).fillRect(enemy.x - 15, enemy.y - 53, 30, 3);
      g.fillStyle(0xe3b069, 1).fillRect(enemy.x - 15, enemy.y - 53, 30 * Math.max(0, enemy.hp / enemy.maxHp), 3);
      if ((enemy.chilledUntil || 0) > time) g.lineStyle(1, 0x9ee7ef, .65).strokeCircle(enemy.x, enemy.y, 12);
    }
    for (const { event, age } of this.marks) {
      if (event.type === 'soldier-death') {
        const fade = Math.max(0, 1 - age / .65), fall = Math.min(1, age / .25);
        g.fillStyle(0x161e1a, fade * .4).fillEllipse(event.x, event.y + 3, 35, 12);
        g.fillStyle(0xa9925a, fade).fillEllipse(event.x + Math.cos(event.facing) * fall * 12, event.y - 15 + fall * 12, 22 + fall * 14, 28 - fall * 19);
        g.fillStyle(0xe0c892, fade).fillCircle(event.x + Math.cos(event.facing) * fall * 20, event.y - 33 + fall * 28, 7);
        g.lineStyle(3, 0xc4c6ac, fade).lineBetween(event.x + 13, event.y - 10, event.x + 36, event.y + 8);
      } else {
        const fade = 1 - age / .22;
        if (event.source === 'EN001') this.sector(w, event.x, event.y, event.facing, event.range, event.arc, 0xffc994, fade * .55);
        if (event.outcome === 'hit') {
          g.lineStyle(3, 0xffd4b0, fade);
          for (const sign of [-1, 1]) g.lineBetween(event.targetX + sign * 10, event.targetY - 18, event.targetX + sign * 23, event.targetY - 34);
          g.lineStyle(2, 0xe46955, fade).strokeCircle(event.targetX, event.targetY, 20);
        }
      }
    }
  }
  private sector(g: Phaser.GameObjects.Graphics, x: number, y: number, facing: number, range: number, arc: number, color: number, alpha: number) {
    g.fillStyle(color, alpha).lineStyle(2, color, .95).beginPath().moveTo(x, y);
    for (let i = 0; i <= 20; i++) { const a = facing - arc / 2 + arc * i / 20; g.lineTo(x + Math.cos(a) * range, y + Math.sin(a) * range); }
    g.closePath().fillPath().strokePath();
  }
  private soldier(g: Phaser.GameObjects.Graphics, x: number, y: number, facing: number, phase: string, flash: number, alpha: number) {
    const cloth = flash > .6 ? 0xfff5dd : 0xc5a34e, armor = flash > .6 ? 0xfff5dd : 0x655e48;
    g.fillStyle(0x081512, alpha * .35).fillEllipse(x, y + 3, 29, 12);
    g.lineStyle(5, 0x453f33, alpha).lineBetween(x - 6, y - 11, x - 8, y + 1).lineBetween(x + 5, y - 11, x + 8, y + 1);
    g.fillStyle(cloth, alpha).fillTriangle(x, y - 39, x - 14, y - 9, x + 13, y - 9);
    g.fillStyle(armor, alpha).fillRoundedRect(x - 9, y - 33, 18, 20, 3);
    g.lineStyle(2, 0xd3bb7d, alpha).lineBetween(x - 7, y - 25, x + 7, y - 25).lineBetween(x - 7, y - 19, x + 7, y - 19);
    g.fillStyle(0xd9bb91, alpha).fillCircle(x, y - 39, 7);
    g.fillStyle(cloth, alpha).fillRect(x - 9, y - 46, 18, 5).fillTriangle(x + 6, y - 44, x + 18, y - 40, x + 8, y - 39);
    const angle = phase === 'windup' ? facing - 1.5 : phase === 'strike' ? facing + .6 : facing - .6;
    const sx = x + 10, sy = y - 26, ex = sx + Math.cos(angle) * 29, ey = sy + Math.sin(angle) * 29;
    g.lineStyle(4, 0x504735, alpha).lineBetween(sx, sy, ex, ey);
    g.lineStyle(3, phase === 'windup' ? 0xffdab1 : 0xe3e2c7, alpha).lineBetween(sx + Math.cos(angle) * 9, sy + Math.sin(angle) * 9, ex, ey);
  }
}
