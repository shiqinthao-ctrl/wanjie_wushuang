import type Phaser from 'phaser';
import type { DragonSnapshot } from '../chapter/DragonCombat';
import { chapterActors } from './chapterPresentation';

/** Engineering silhouette/pose sample. Essential telegraphs remain with effects off. */
export class DragonView {
  private actor: Phaser.GameObjects.Graphics;
  private ranges: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.actor = scene.add.graphics().setDepth(3.1);
    this.ranges = scene.add.graphics().setDepth(.6);
  }
  draw(state: DragonSnapshot | undefined, player: { x: number; y: number }): void {
    const a = this.actor.clear(), g = this.ranges.clear();
    if (!state) return;
    for (const pose of state.poses) {
      if (!pose.radius) {
        g.lineStyle(2, 0xffd586, .8).lineBetween(pose.x, pose.y, pose.x + Math.cos(pose.facing) * 60, pose.y + Math.sin(pose.facing) * 60);
        continue;
      }
      const start = pose.facing - pose.angle / 2, end = pose.facing + pose.angle / 2;
      const releasing = pose.phase === 'release';
      g.fillStyle(releasing ? 0xffa34f : 0xefc37f, releasing ? .13 * (1 - pose.progress) : .07)
        .beginPath().moveTo(pose.x, pose.y).arc(pose.x, pose.y, pose.radius, start, end).closePath().fillPath();
      g.lineStyle(releasing ? 5 : 1.5, releasing ? 0xffd99a : 0xf6cd88, releasing ? 1 - pose.progress : .55)
        .beginPath().arc(pose.x, pose.y, pose.radius, start, end).strokePath();
      if (!releasing) for (const angle of [start, end]) g.lineStyle(1, 0xf6cd88, .45)
        .lineBetween(pose.x, pose.y, pose.x + Math.cos(angle) * pose.radius, pose.y + Math.sin(angle) * pose.radius);
    }
    for (const blade of state.blades) {
      const dx = Math.cos(blade.facing), dy = Math.sin(blade.facing), w = blade.radius;
      const tip = { x: blade.x + dx * 17, y: blade.y + dy * 17 };
      g.fillStyle(0xed7741, .55).fillTriangle(tip.x, tip.y, blade.x - dx * 30 - dy * w, blade.y - dy * 30 + dx * w, blade.x - dx * 30 + dy * w, blade.y - dy * 30 - dx * w);
      g.lineStyle(3, 0xffe9b0, 1).lineBetween(blade.x - dy * w, blade.y + dx * w, tip.x, tip.y).lineBetween(tip.x, tip.y, blade.x + dy * w, blade.y - dx * w);
    }
    const pose = state.poses.find(p => p.radius > 0 && p.phase === 'windup') || state.poses.find(p => p.radius > 0);
    const direction = pose?.facing ?? state.facing;
    const turn = pose ? pose.phase === 'windup' ? -.85 + pose.progress * .25 : -.6 + pose.progress * 1.7 : .18;
    const facingLeft = Math.cos(direction) < 0, lean = pose?.phase === 'release' ? 4 : 0;
    const x = player.x, y = player.y;
    a.fillStyle(0x102720, .5).fillEllipse(x, y + 4, 48, 15);
    // Split cape, lamellar skirt and broad pauldrons distinguish the evolved body.
    a.fillStyle(0x9e302a, 1).fillTriangle(x - 17, y - 49, x - 31, y + 1, x + 6, y - 10)
      .fillTriangle(x + 16, y - 49, x + 28, y - 1, x - 5, y - 12);
    a.fillStyle(0x182d31, 1).fillRoundedRect(x - 14, y - 14, 10, 18, 3).fillRoundedRect(x + 4, y - 14, 10, 18, 3);
    a.fillStyle(0x283e40, 1).fillTriangle(x, y - 40, x - 23, y - 6, x + 22, y - 6);
    a.lineStyle(2, 0xd4aa60, 1).lineBetween(x - 15, y - 17, x + 15, y - 17).lineBetween(x - 19, y - 9, x + 19, y - 9);
    a.fillStyle(0xc7a061, 1).fillRoundedRect(x - 17, y - 49, 34, 28, 6);
    a.fillStyle(0x28454a, 1).fillRoundedRect(x - 13, y - 46, 26, 19, 4);
    a.fillStyle(0xe3bd6a, 1).fillTriangle(x - 13, y - 49, x - 28, y - 35, x - 10, y - 31)
      .fillTriangle(x + 13, y - 49, x + 28, y - 35, x + 10, y - 31);
    a.fillStyle(0xf0cb9d, 1).fillEllipse(x + (facingLeft ? -2 : 2) + lean, y - 55, 18, 20);
    a.fillStyle(0x2d3839, 1).fillRoundedRect(x - 12 + lean, y - 69, 24, 12, 5);
    a.lineStyle(3, state.awakened ? 0xffe8a4 : 0xcaa05e, 1).lineBetween(x - 8 + lean, y - 62, x - 18 + lean, y - 76)
      .lineBetween(x + 8 + lean, y - 62, x + 18 + lean, y - 76);
    a.fillStyle(0xd95836, 1).fillTriangle(x + lean, y - 71, x + 6 + lean, y - 88, x + 13 + lean, y - 70);
    const angle = direction + turn, dx = Math.cos(angle), dy = Math.sin(angle), grip = { x: x + dx * 17, y: y - 28 + dy * 10 };
    a.lineStyle(5, 0x263635, 1).lineBetween(grip.x - dx * 27, grip.y - dy * 27, grip.x + dx * 47, grip.y + dy * 47);
    a.lineStyle(2, 0xdab878, 1).lineBetween(grip.x - dx * 27, grip.y - dy * 27, grip.x + dx * 47, grip.y + dy * 47);
    const tip = { x: grip.x + dx * 53, y: grip.y + dy * 53 };
    a.fillStyle(state.awakened ? chapterActors.dragon.awakenedWeapon : chapterActors.dragon.weapon, 1).fillTriangle(tip.x + dx * 12, tip.y + dy * 12, tip.x - dx * 23 - dy * 17, tip.y - dy * 23 + dx * 17, tip.x - dx * 20 + dy * 4, tip.y - dy * 20 - dx * 4);
    a.fillStyle(0xe77740, 1).fillCircle(grip.x, grip.y, 5);
    // A permanent facing chevron does not depend on cosmetic effects.
    g.lineStyle(3, 0xf8d794, .9).beginPath().moveTo(x + Math.cos(direction - .18) * 39, y + Math.sin(direction - .18) * 39)
      .lineTo(x + Math.cos(direction) * 46, y + Math.sin(direction) * 46).lineTo(x + Math.cos(direction + .18) * 39, y + Math.sin(direction + .18) * 39).strokePath();
  }
}
