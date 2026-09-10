import Phaser from 'phaser';
import type { Boss, Telegraph } from '../core/FirstBoss';

export class BossView {
  private sprite: Phaser.GameObjects.Image;
  private warnings: Phaser.GameObjects.Graphics;
  private weapon: Phaser.GameObjects.Graphics;
  private cue: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.image(0, 0, 'boss').setOrigin(.5, .72).setDisplaySize(128, 146).setDepth(2).setVisible(false);
    this.warnings = scene.add.graphics().setDepth(1);
    this.weapon = scene.add.graphics().setDepth(2.8);
    this.cue = scene.add.text(0, 0, '', { fontSize: '14px', color: '#ffe5b6', backgroundColor: '#29251dee', padding: { x: 6, y: 4 } }).setOrigin(.5).setDepth(3.5).setVisible(false);
  }
  draw(boss: Readonly<Boss> | undefined, telegraphs: readonly Readonly<Telegraph>[]): void {
    this.sprite.setVisible(!!boss); if (boss) this.sprite.setPosition(boss.x, boss.y);
    this.weapon.clear(); this.cue.setVisible(!!boss?.sweepPhase);
    if (boss?.sweepPhase) {
      const facing = boss.sweepFacing ?? 0, windup = boss.sweepPhase === 'windup';
      const angle = facing + (windup ? -1.2 : boss.sweepPhase === 'strike' ? .7 : 1.2);
      const x = boss.x + 23, y = boss.y - 35, ex = x + Math.cos(angle) * 69, ey = y + Math.sin(angle) * 69;
      this.weapon.lineStyle(7, 0x614635, 1).lineBetween(x, y, ex, ey)
        .lineStyle(2, 0xe8c987, 1).lineBetween(x, y, ex, ey)
        .fillStyle(windup ? 0xffdbb0 : 0xc8c9ad, 1).fillTriangle(ex - 18, ey - 18, ex + 20, ey - 7, ex + 3, ey + 20);
      this.cue.setText(windup ? '旋风断军 · 绕至侧后' : boss.sweepPhase === 'strike' ? '旋风断军 · 挥击' : '收招 · 趁机反击');
      const camera = this.sprite.scene.cameras.main, margin = this.cue.width / 2 + 8;
      // Keep the response cue readable when the Boss stands at a phone viewport edge.
      this.cue.setPosition(Phaser.Math.Clamp(boss.x, camera.scrollX + margin, camera.scrollX + camera.width / camera.zoom - margin), boss.y - 120);
      if (!windup) this.weapon.lineStyle(2, 0x96d5be, .9).lineBetween(boss.x - 26, boss.y + 12, boss.x + 26, boss.y + 12);
    }
    const g = this.warnings; g.clear();
    for (const warning of telegraphs) {
      const progress = Math.max(0, Math.min(1, 1 - warning.life / warning.max));
      g.fillStyle(0xff4545, .18 + progress * .2).lineStyle(3, 0xffc7ab, .9);
      if (warning.type === 'circle') {
        g.fillCircle(warning.x, warning.y, warning.r).strokeCircle(warning.x, warning.y, warning.r);
        g.lineStyle(2, 0xffe6c1, 1).strokeCircle(warning.x, warning.y, warning.r * progress);
      } else if (warning.type === 'line') {
        g.lineStyle(warning.width, 0xff4545, .25 + progress * .25).lineBetween(warning.x, warning.y, warning.x2, warning.y2);
        g.lineStyle(3, 0xffdcc3, 1).lineBetween(warning.x, warning.y, warning.x2, warning.y2);
      } else {
        if (warning.chapterSweep) {
          g.fillStyle(warning.resolved ? 0xffddad : 0xd8563f, warning.resolved ? .42 : .16 + progress * .12)
            .lineStyle(warning.resolved ? 5 : 3, 0xffd6a2, 1);
        }
        g.beginPath().moveTo(warning.x, warning.y);
        for (let i = 0; i <= 24; i++) {
          const angle = warning.angle - warning.arc / 2 + warning.arc * i / 24;
          g.lineTo(warning.x + Math.cos(angle) * warning.range, warning.y + Math.sin(angle) * warning.range);
        }
        g.closePath().fillPath().strokePath();
        if (warning.chapterSweep && !warning.resolved) {
          g.lineStyle(3, 0xffefd1, .95).beginPath().arc(warning.x, warning.y, warning.range * progress, warning.angle - warning.arc / 2, warning.angle + warning.arc / 2).strokePath();
          for (const fraction of [-.7, 0, .7]) {
            const a = warning.angle + warning.arc / 2 * fraction, r = warning.range * .72;
            const x = warning.x + Math.cos(a) * r, y = warning.y + Math.sin(a) * r;
            g.lineStyle(3, 0xffcba0, 1).lineBetween(x - Math.cos(a - .6) * 15, y - Math.sin(a - .6) * 15, x, y)
              .lineBetween(x, y, x - Math.cos(a + .6) * 15, y - Math.sin(a + .6) * 15);
          }
        }
      }
    }
  }
}
