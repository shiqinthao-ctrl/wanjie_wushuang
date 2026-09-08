import Phaser from 'phaser';
import { GameCore } from '../core/GameCore';
import type { UiSnapshot } from '../core/GameCore';
import { MapView } from './MapView';
import { BossView } from './BossView';
import type { GameSave } from '../core/saveTypes';
import type { Journey } from '../core/evolutionCatalog';

export interface BattleHandle { core: GameCore; destroy(): Promise<void> }

export function mountBattle(parent: HTMLElement, publish: (value: UiSnapshot) => void, ready: () => void, fail: (message: string) => void, save: GameSave, journey: Journey = 'classic'): BattleHandle {
  const core = new GameCore(save, Math.random, journey);
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
      this.load.image('hero', `${import.meta.env.BASE_URL}art/hero-${save.hero.toLowerCase()}.svg`);
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
      const { player, world, crystals, enemies, projectiles, fields, vortices, meteors, bombs, enemyShots, pet, map, boss, telegraphs, summons, journey: evolution } = core.renderState();
      this.mapView?.draw(map, player);
      this.bossView?.draw(boss, telegraphs);
      const graphics = this.combatGraphics!; graphics.clear();
      for (const unit of summons) {
        const color = Number.parseInt(unit.color.slice(1), 16);
        graphics.fillStyle(color, .35).fillTriangle(unit.x, unit.y - 36, unit.x - 16, unit.y + 6, unit.x + 16, unit.y + 6).fillCircle(unit.x, unit.y - 38, 8);
        graphics.lineStyle(2, color, .8).strokeCircle(unit.x, unit.y + 4, unit.guard ? 24 : 16);
      }
      if (evolution?.formId) {
        const color = Number.parseInt(evolution.color.slice(1), 16), x = player.x, y = player.y;
        this.hero.setTint(color);
        graphics.lineStyle(evolution.rank === 2 ? 3 : 1, color, .8).strokeCircle(x, y, evolution.rank === 2 ? 36 : 28);
        if (['phoenix', 'dragon'].includes(evolution.formId)) for (const sign of [-1, 1]) graphics.fillStyle(color, .5).fillTriangle(x + sign * 9, y - 20, x + sign * 52, y - 46, x + sign * 32, y + 2);
        if (evolution.formId === 'bulwark') graphics.lineStyle(4, color, .7).strokeRoundedRect(x - 32, y - 64, 64, 76, 18);
        if (evolution.formId === 'void') graphics.lineStyle(3, color, .7).strokeEllipse(x, y - 24, 80, 30);
        if (evolution.formId === 'reaper') graphics.lineStyle(5, color, .8).lineBetween(x - 35, y + 5, x + 32, y - 55);
        if (evolution.formId === 'legion') graphics.fillStyle(color, .5).fillTriangle(x, y - 70, x - 24, y - 46, x + 24, y - 46);
        if (evolution.formId === 'frostlord') for (let i = 0; i < 6; i++) {
          const angle = i * Math.PI / 3; graphics.lineStyle(3, color, .8).lineBetween(x + Math.cos(angle) * 27, y + Math.sin(angle) * 27, x + Math.cos(angle) * 44, y + Math.sin(angle) * 44);
        }
        if (evolution.formId === 'thunderlord') graphics.lineStyle(4, color, .9).lineBetween(x + 8, y - 75, x - 8, y - 47).lineBetween(x - 8, y - 47, x + 12, y - 47).lineBetween(x + 12, y - 47, x - 7, y - 24);
        if (evolution.formId === 'beastlord') for (const sign of [-1, 1]) graphics.fillStyle(color, .7).fillTriangle(x + sign * 14, y - 35, x + sign * 36, y - 64, x + sign * 29, y - 19);
      }
      for (const field of fields) {
        const color = Number.parseInt(field.color.slice(1), 16);
        graphics.fillStyle(color, .12).fillCircle(field.x, field.y, field.r).lineStyle(field.chill ? 2 : 1, field.chill ? color : 0xffba70, .45).strokeCircle(field.x, field.y, field.r);
      }
      for (const vortex of vortices) {
        for (let i = 0; i < 3; i++) graphics.lineStyle(4 - i, 0x82d6b7, .55).strokeCircle(vortex.x, vortex.y, vortex.r * (.3 + i * .22));
      }
      for (const marker of [...meteors, ...bombs]) graphics.fillStyle(0xef7958, .2).fillCircle(marker.x, marker.y, marker.r).lineStyle(2, 0xffd5ab, .8).strokeCircle(marker.x, marker.y, marker.r);
      const frameTime = core.snapshot().time;
      for (const [index, enemy] of enemies.entries()) {
        const sprite = this.enemySprites[index] ||= this.add.image(enemy.x, enemy.y, 'enemy').setOrigin(.5, .8).setDepth(2);
        sprite.setPosition(enemy.x, enemy.y).setDisplaySize(enemy.elite ? 48 : 34, enemy.elite ? 58 : 42).setAlpha(enemy.ai === 'melee' ? 1 : .6);
        sprite.setTint((enemy.chilledUntil || 0) > frameTime ? 0x8de8ff : 0xffffff);
        graphics.fillStyle(enemy.elite ? 0xd5a254 : enemy.ai === 'ranged' ? 0x9b735b : 0x6e737c, 1).fillCircle(enemy.x, enemy.y, enemy.r);
        if (enemy.ai === 'shield') graphics.lineStyle(4, 0xb4c1b4, 1).strokeRect(enemy.x - 11, enemy.y - 14, 22, 28);
        if (enemy.ai === 'ranged') graphics.lineStyle(2, 0xf0c69a, 1).strokeCircle(enemy.x, enemy.y, enemy.r + 5);
        if (enemy.flash > 0) graphics.lineStyle(2, 0xffead2, enemy.flash).strokeCircle(enemy.x, enemy.y, enemy.r + 3);
        graphics.fillStyle(0x13231f, .9).fillRect(enemy.x - 14, enemy.y - enemy.r - 9, 28, 3);
        graphics.fillStyle(enemy.elite ? 0xffd47a : 0xd78867, 1).fillRect(enemy.x - 14, enemy.y - enemy.r - 9, 28 * Math.max(0, enemy.hp / enemy.maxHp), 3);
      }
      while (this.enemySprites.length > enemies.length) this.enemySprites.pop()!.destroy();
      for (const shot of projectiles) graphics.fillStyle(evolution ? Number.parseInt(shot.color.slice(1), 16) : 0xffa452, 1).fillCircle(shot.x, shot.y, shot.r).lineStyle(2, 0xffe2a5, .7).strokeCircle(shot.x, shot.y, shot.r + 2);
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
        const color = pulse.source.startsWith('G2_FROST') ? 0x8de8ff : pulse.source === 'A013' || pulse.source.startsWith('G2_LIGHTNING') ? 0xd9f48e : pulse.source === 'dodge' ? 0x70a9ff : 0xffae6e;
        graphics.lineStyle(3, color, Math.max(0, pulse.life / .25)).strokeCircle(pulse.x, pulse.y, pulse.radius * (1 - pulse.life / .35));
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
