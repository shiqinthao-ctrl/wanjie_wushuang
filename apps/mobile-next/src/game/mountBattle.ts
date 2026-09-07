import Phaser from 'phaser';
import { GameCore } from '../core/GameCore';
import type { UiSnapshot } from '../core/GameCore';
import { MapView } from './MapView';
import { BossView } from './BossView';
import type { GameSave } from '../core/saveTypes';

export interface BattleHandle { core: GameCore; destroy(): Promise<void> }

export function mountBattle(parent: HTMLElement, publish: (value: UiSnapshot) => void, ready: () => void, fail: (message: string) => void, save: GameSave): BattleHandle {
  const core = new GameCore(save);
  let removed = false;
  let budget = 0;
  class BattleScene extends Phaser.Scene {
    private hero?: Phaser.GameObjects.Image;
    private crystals?: Phaser.GameObjects.Graphics;
    private combatGraphics?: Phaser.GameObjects.Graphics;
    private mapView?: MapView;
    private bossView?: BossView;
    private enemySprites: Phaser.GameObjects.Image[] = [];
    private pulses: { x: number; y: number; radius: number; life: number; source: string }[] = [];
    preload() {
      this.load.image('ground', `${import.meta.env.BASE_URL}art/battlefield.svg`);
      this.load.image('hero', `${import.meta.env.BASE_URL}art/hero-h001.svg`);
      this.load.image('enemy', `${import.meta.env.BASE_URL}art/enemy-en001.svg`);
      this.load.image('boss', `${import.meta.env.BASE_URL}art/boss-b001.svg`);
      this.load.on('loaderror', () => fail('战场资源未能载入，请返回后重试。'));
    }
    create() {
      if (removed) return;
      core.start(this.scale.width, this.scale.height);
      const { world, player } = core.renderState();
      this.add.image(0, 0, 'ground').setOrigin(0).setDisplaySize(world.width, world.height);
      this.mapView = new MapView(this);
      this.bossView = new BossView(this);
      this.crystals = this.add.graphics();
      this.combatGraphics = this.add.graphics();
      this.hero = this.add.image(player.x, player.y, 'hero').setDisplaySize(66, 81).setOrigin(.5, .84).setDepth(3);
      this.cameras.main.setBounds(0, 0, world.width, world.height);
      this.cameras.main.centerOn(player.x, player.y);
      ready(); publish(core.snapshot());
    }
    update(_now: number, delta: number) {
      if (removed || !this.hero) return;
      core.resize(this.scale.width, this.scale.height);
      core.advance(delta / 1000);
      const { player, world, crystals, enemies, projectiles, fields, vortices, meteors, bombs, enemyShots, pet, map, boss, telegraphs } = core.renderState();
      this.mapView?.draw(map, player);
      this.bossView?.draw(boss, telegraphs);
      const graphics = this.combatGraphics!; graphics.clear();
      for (const field of fields) graphics.fillStyle(0xef694e, .12).fillCircle(field.x, field.y, field.r).lineStyle(1, 0xffba70, .45).strokeCircle(field.x, field.y, field.r);
      for (const vortex of vortices) {
        for (let i = 0; i < 3; i++) graphics.lineStyle(4 - i, 0x82d6b7, .55).strokeCircle(vortex.x, vortex.y, vortex.r * (.3 + i * .22));
      }
      for (const marker of [...meteors, ...bombs]) graphics.fillStyle(0xef7958, .2).fillCircle(marker.x, marker.y, marker.r).lineStyle(2, 0xffd5ab, .8).strokeCircle(marker.x, marker.y, marker.r);
      for (const [index, enemy] of enemies.entries()) {
        const sprite = this.enemySprites[index] ||= this.add.image(enemy.x, enemy.y, 'enemy').setOrigin(.5, .8).setDepth(2);
        sprite.setPosition(enemy.x, enemy.y).setDisplaySize(enemy.elite ? 48 : 34, enemy.elite ? 58 : 42).setAlpha(enemy.ai === 'melee' ? 1 : .6);
        graphics.fillStyle(enemy.elite ? 0xd5a254 : enemy.ai === 'ranged' ? 0x9b735b : 0x6e737c, 1).fillCircle(enemy.x, enemy.y, enemy.r);
        if (enemy.ai === 'shield') graphics.lineStyle(4, 0xb4c1b4, 1).strokeRect(enemy.x - 11, enemy.y - 14, 22, 28);
        if (enemy.ai === 'ranged') graphics.lineStyle(2, 0xf0c69a, 1).strokeCircle(enemy.x, enemy.y, enemy.r + 5);
        if (enemy.flash > 0) graphics.lineStyle(2, 0xffead2, enemy.flash).strokeCircle(enemy.x, enemy.y, enemy.r + 3);
        graphics.fillStyle(0x13231f, .9).fillRect(enemy.x - 14, enemy.y - enemy.r - 9, 28, 3);
        graphics.fillStyle(enemy.elite ? 0xffd47a : 0xd78867, 1).fillRect(enemy.x - 14, enemy.y - enemy.r - 9, 28 * Math.max(0, enemy.hp / enemy.maxHp), 3);
      }
      while (this.enemySprites.length > enemies.length) this.enemySprites.pop()!.destroy();
      for (const shot of projectiles) graphics.fillStyle(0xffa452, 1).fillCircle(shot.x, shot.y, shot.r).lineStyle(2, 0xffe2a5, .7).strokeCircle(shot.x, shot.y, shot.r + 2);
      for (const shot of enemyShots) graphics.fillStyle(0xff776e, 1).fillCircle(shot.x, shot.y, shot.r);
      graphics.fillStyle(0xef704c, 1).fillCircle(pet.x, pet.y, 9).lineStyle(2, 0xffd498, .6).strokeCircle(pet.x, pet.y, 15);
      this.crystals?.clear();
      for (const crystal of crystals) {
        const radius = crystal.elite ? 10 : 7;
        this.crystals?.fillStyle(crystal.elite ? 0xffd47a : 0x74f0cf, 1);
        this.crystals?.beginPath().moveTo(crystal.x, crystal.y - radius).lineTo(crystal.x + radius, crystal.y).lineTo(crystal.x, crystal.y + radius).lineTo(crystal.x - radius, crystal.y).closePath().fillPath();
        this.crystals?.lineStyle(2, 0xd9fff2, .8).strokeCircle(crystal.x, crystal.y, radius + 4);
      }
      for (const event of core.takeEvents()) {
        if (event.type === 'ring') { this.pulses.push({ ...event, life: .25 }); continue; }
        if (event.type !== 'xp-pickup') continue;
        const label = this.add.text(event.x, event.y - 20, `XP +${Math.round(event.value)}`, { fontSize: '14px', color: '#74f0cf', stroke: '#102720', strokeThickness: 3 }).setOrigin(.5);
        this.tweens.add({ targets: label, y: label.y - 28, alpha: 0, duration: 700, onComplete: () => label.destroy() });
      }
      const running = core.snapshot().status === 'running';
      for (const pulse of this.pulses) {
        if (running) pulse.life -= Math.min(.034, delta / 1000);
        graphics.lineStyle(3, pulse.source === 'dodge' ? 0x70a9ff : 0xffae6e, Math.max(0, pulse.life / .25)).strokeCircle(pulse.x, pulse.y, pulse.radius * (1 - pulse.life / .35));
      }
      this.pulses = this.pulses.filter(pulse => pulse.life > 0).slice(-40);
      this.hero.setPosition(player.x, player.y);
      this.cameras.main.setBounds(0, 0, world.width, world.height);
      this.cameras.main.centerOn(player.x, player.y);
      // UI gets a small snapshot at 10Hz. Entity transforms remain in Phaser.
      budget += delta;
      if (budget >= 100) { budget = 0; publish(core.snapshot()); }
    }
  }
  const game = new Phaser.Game({
    type: Phaser.WEBGL, parent, backgroundColor: '#122522',
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    scene: BattleScene, audio: { noAudio: true }, banner: false,
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
  });
  let teardown: Promise<void> | undefined;
  return {
    core,
    destroy() {
      if (teardown) return teardown;
      removed = true; core.destroy();
      teardown = new Promise<void>(resolve => {
        game.events.once(Phaser.Core.Events.DESTROY, resolve);
        game.destroy(true);
      });
      return teardown;
    },
  };
}
