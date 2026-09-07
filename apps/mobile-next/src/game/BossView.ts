import Phaser from 'phaser';
import type { Boss, Telegraph } from '../core/FirstBoss';

export class BossView {
  private sprite: Phaser.GameObjects.Image;
  private warnings: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.image(0, 0, 'boss').setOrigin(.5, .72).setDisplaySize(128, 146).setDepth(2).setVisible(false);
    this.warnings = scene.add.graphics().setDepth(1);
  }
  draw(boss: Readonly<Boss> | undefined, telegraphs: readonly Readonly<Telegraph>[]): void {
    this.sprite.setVisible(!!boss); if (boss) this.sprite.setPosition(boss.x, boss.y);
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
        g.beginPath().moveTo(warning.x, warning.y);
        for (let i = 0; i <= 24; i++) {
          const angle = warning.angle - warning.arc / 2 + warning.arc * i / 24;
          g.lineTo(warning.x + Math.cos(angle) * warning.range, warning.y + Math.sin(angle) * warning.range);
        }
        g.closePath().fillPath().strokePath();
      }
    }
  }
}
