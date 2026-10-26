import Phaser from 'phaser';
import type { FirstStageMap } from '../core/FirstStageMap';
import type { SealRenderState } from '../chapter/Seals';

type MapState = ReturnType<FirstStageMap['renderState']>;
const sealTone = { locked: 0x6e737c, open: 0xe4c37d, holding: 0x82d6b7, held: 0x74f0cf } as const;
const sealMark = ['一', '二', '三'];
const colors = { barrel: 0xef7958, heal: 0x82d6b7, altar: 0xe4c37d, mechanism: 0x70a9ff, supply: 0xffd47a };
const symbols = { barrel: '火', heal: '医', altar: '祭', mechanism: '弩', supply: '箱' };

export class MapView {
  private graphics: Phaser.GameObjects.Graphics;
  private labels = new Map<string, Phaser.GameObjects.Text>();
  constructor(private scene: Phaser.Scene) { this.graphics = scene.add.graphics(); }
  draw(state: MapState, player: { x: number; y: number }, seals: SealRenderState = []): void {
    const g = this.graphics; g.clear();
    // Seals are drawn on the map layer because a chapter run's map layer is otherwise empty
    // (`FirstStageMap` is disabled for chapter runs). Same three objects the snapshot reports.
    for (const seal of seals) {
      const tone = sealTone[seal.state];
      g.fillStyle(tone, seal.state === 'held' ? .14 : .05).fillCircle(seal.x, seal.y, seal.r);
      g.lineStyle(seal.state === 'locked' ? 2 : 4, tone, seal.state === 'locked' ? .35 : .85).strokeCircle(seal.x, seal.y, seal.r);
      if (seal.state === 'holding') {
        g.lineStyle(7, 0xffffff, .8).beginPath().arc(seal.x, seal.y, seal.r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * seal.ratio).strokePath();
      }
      if (seal.state === 'held') g.lineStyle(3, tone, .9).strokeCircle(seal.x, seal.y, seal.r * .45);
      const key = `seal-${seal.index}`;
      const label = this.labels.get(key) || this.scene.add.text(seal.x, seal.y, sealMark[seal.index] ?? String(seal.index + 1), { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '20px', color: '#f0ead4', align: 'center', stroke: '#102720', strokeThickness: 4 }).setOrigin(.5).setDepth(1);
      this.labels.set(key, label);
      label.setPosition(seal.x, seal.y).setAlpha(seal.state === 'locked' ? .35 : seal.state === 'held' ? .8 : 1);
    }
    for (const line of state.hazards) {
      g.fillStyle(0xb43b23, .45).fillRect(line.x, line.y - line.h / 2, line.w, line.h);
      g.lineStyle(2, 0xffa46a, .8).strokeRect(line.x, line.y - line.h / 2, line.w, line.h);
      for (let x = 0; x < line.w; x += 45) g.lineBetween(x, line.y + line.h / 2, x + 22, line.y - line.h / 2);
    }
    for (const item of state.interactables) {
      const near = Math.hypot(item.x - player.x, item.y - player.y) <= 74;
      const label = this.labels.get(item.id) || this.scene.add.text(item.x, item.y - 13, `${symbols[item.type]}\n${item.name}`, { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '13px', color: '#f0ead4', align: 'center', stroke: '#102720', strokeThickness: 3, lineSpacing: 19 }).setOrigin(.5, 0).setDepth(1);
      this.labels.set(item.id, label); label.setPosition(item.x, item.y - 13).setAlpha(item.used ? .3 : 1);
      g.fillStyle(0x102720, .9).fillCircle(item.x, item.y, 23);
      g.lineStyle(near && !item.used ? 3 : 1, colors[item.type], item.used ? .25 : 1).strokeCircle(item.x, item.y, 23);
      if (near && !item.used) g.lineStyle(1, colors[item.type], .4).strokeCircle(item.x, item.y, 74);
    }
  }
}
