import Phaser from 'phaser';
import { GameCore } from '../core/GameCore';
import type { UiSnapshot } from '../core/GameCore';
import { MapView } from './MapView';
import { BossView } from './BossView';
import { CombatEffects } from './CombatEffects';
import { DragonView } from './DragonView';
import { EnemyView } from './EnemyView';
import { chapterActors, chapterAssets } from './chapterPresentation';
import { ChapterAudio } from './audio/ChapterAudio';
import type { AudioSettings } from './audio/settings';
import { isSoldier } from '../chapter/SoldierCombat';
import type { GameSave } from '../core/saveTypes';
import type { Journey } from '../core/evolutionCatalog';
import type { ChapterRunOptions } from '../chapter/prepare';

export interface BattleHandle { core: GameCore; setEffectsEnabled(value: boolean): void; setAudioSettings(value: AudioSettings): void; pauseAudio(): void; resumeAudio(): void; destroy(): Promise<void> }

export function mountBattle(parent: HTMLElement, publish: (value: UiSnapshot) => void, ready: () => void, fail: (message: string) => void, save: GameSave, journey: Journey = 'classic', chapter?: ChapterRunOptions): BattleHandle {
  const core = new GameCore(save, Math.random, journey, chapter);
  const audio = chapter ? new ChapterAudio() : undefined;
  let silentEvents: ReturnType<GameCore['takeEvents']> = [];
  let removed = false;
  let budget = 0;
  let effects: CombatEffects | undefined;
  let effectsEnabled = true;
  class BattleScene extends Phaser.Scene {
    private hero?: Phaser.GameObjects.Image;
    private ground?: Phaser.GameObjects.Image;
    private boundary?: Phaser.GameObjects.Graphics;
    private viewSize = { width: 0, height: 0, worldWidth: 0, worldHeight: 0 };
    private crystals?: Phaser.GameObjects.Graphics;
    private combatGraphics?: Phaser.GameObjects.Graphics;
    private mapView?: MapView;
    private bossView?: BossView;
    private dragonView?: DragonView;
    private enemyView?: EnemyView;
    private enemySprites: Phaser.GameObjects.Image[] = [];
    preload() {
      if (core.chapter) for (const asset of chapterAssets) this.load.image(asset.key, `${import.meta.env.BASE_URL}${asset.file}`);
      else {
        this.load.image('ground', `${import.meta.env.BASE_URL}art/battlefield.svg`);
        this.load.image('hero', `${import.meta.env.BASE_URL}art/hero-${save.hero.toLowerCase()}.svg`);
        this.load.image('enemy', `${import.meta.env.BASE_URL}art/enemy-en001.svg`);
        this.load.image('boss', `${import.meta.env.BASE_URL}art/boss-b001.svg`);
      }
      this.load.on('loaderror', () => fail('战场资源未能载入，请返回后重试。'));
    }
    create() {
      if (removed) return;
      core.start(this.scale.width, this.scale.height);
      const { world, player } = core.renderState();
      this.ground = this.add.image(0, 0, 'ground').setOrigin(0);
      this.boundary = this.add.graphics().setDepth(.1);
      this.mapView = new MapView(this);
      this.bossView = new BossView(this);
      this.dragonView = new DragonView(this);
      if (core.chapter) this.enemyView = new EnemyView(this);
      this.crystals = this.add.graphics().setDepth(3.2);
      this.combatGraphics = this.add.graphics();
      effects = new CombatEffects(this.add.graphics().setDepth(.5));
      effects.setEnabled(effectsEnabled);
      this.hero = this.add.image(player.x, player.y, 'hero').setDisplaySize(66, 81).setOrigin(.5, .84).setDepth(3);
      if (core.chapter) { const actor = chapterActors.H001; this.hero.setDisplaySize(actor.width, actor.height).setOrigin(actor.originX, actor.originY); }
      this.positionCamera(world, player);
      ready(); publish(core.snapshot());
    }
    private positionCamera(world: { width: number; height: number }, player: { x: number; y: number }) {
      const { width, height } = this.scale;
      const previous = this.viewSize;
      if (width !== previous.width || height !== previous.height || world.width !== previous.worldWidth || world.height !== previous.worldHeight) {
        // Portrait padding belongs to the camera only; combat keeps its full viewport.
        const portrait = width <= 600 && height > width;
        const padX = portrait ? width / 2 : 0, padY = portrait ? height / 2 : 0;
        this.cameras.main.setBounds(-padX, -padY, world.width + padX * 2, world.height + padY * 2);
        this.ground?.setDisplaySize(world.width, world.height);
        this.boundary?.clear().lineStyle(12, 0x496259, .55).strokeRect(0, 0, world.width, world.height)
          .lineStyle(2, 0xaaa379, 1).strokeRect(0, 0, world.width, world.height);
        this.viewSize = { width, height, worldWidth: world.width, worldHeight: world.height };
      }
      this.cameras.main.centerOn(player.x, player.y);
    }
    update(_now: number, delta: number) {
      if (removed || !this.hero) return;
      core.resize(this.scale.width, this.scale.height);
      const previousTime = core.snapshot().time;
      core.advance(delta / 1000);
      const { player, world, crystals, enemies, projectiles, fields, vortices, meteors, bombs, enemyShots, pet, map, boss, telegraphs, summons, dragon, journey: evolution } = core.renderState();
      this.positionCamera(world, player);
      this.mapView?.draw(map, player);
      this.bossView?.draw(boss, telegraphs);
      const graphics = this.combatGraphics!; graphics.clear();
      for (const unit of summons) {
        const color = Number.parseInt(unit.color.slice(1), 16);
        graphics.fillStyle(color, .35).fillTriangle(unit.x, unit.y - 36, unit.x - 16, unit.y + 6, unit.x + 16, unit.y + 6).fillCircle(unit.x, unit.y - 38, 8);
        graphics.lineStyle(2, color, .8).strokeCircle(unit.x, unit.y + 4, unit.guard ? 24 : 16);
        if (unit.guard) graphics.lineStyle(3, color, .9).strokeRect(unit.x - 9, unit.y - 28, 18, 22);
        else for (const sign of [-1, 1]) graphics.lineStyle(3, color, .9).lineBetween(unit.x + sign * 8, unit.y - 26, unit.x + sign * 22, unit.y - 12);
      }
      this.hero.setVisible(!dragon);
      this.dragonView?.draw(dragon, player);
      if (evolution?.formId && !dragon) {
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
        if (evolution.formId === 'windwarden') for (const offset of [-22, 0, 22]) graphics.lineStyle(3, color, .85).lineBetween(x + offset - 8, y - 30, x + offset + 8, y - 65);
        if (evolution.formId === 'frostflame') {
          graphics.lineStyle(4, 0xa8e7ee, .9).lineBetween(x - 28, y - 18, x + 20, y - 64);
          graphics.lineStyle(4, 0xffae78, .9).lineBetween(x + 28, y - 18, x - 20, y - 64);
        }
      }
      for (const field of fields) {
        const color = Number.parseInt(field.color.slice(1), 16);
        graphics.fillStyle(color, .12).fillCircle(field.x, field.y, field.r).lineStyle(field.chill ? 2 : 1, field.chill ? color : 0xffba70, .45).strokeCircle(field.x, field.y, field.r);
        if (field.chill) {
          graphics.lineStyle(3, color, .85).beginPath().arc(field.x, field.y, field.r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, field.life / field.max)).strokePath();
          for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            graphics.lineStyle(2, color, .6).lineBetween(field.x + Math.cos(angle) * (field.r - 12), field.y + Math.sin(angle) * (field.r - 12), field.x + Math.cos(angle) * field.r, field.y + Math.sin(angle) * field.r);
          }
        }
      }
      for (const vortex of vortices) {
        for (let i = 0; i < 3; i++) graphics.lineStyle(4 - i, 0x82d6b7, .55).strokeCircle(vortex.x, vortex.y, vortex.r * (.3 + i * .22));
        if (evolution && vortex.vx === 0 && vortex.vy === 0 && !vortex.follow) {
          graphics.lineStyle(2, 0xa4edd5, .7).strokeCircle(vortex.x, vortex.y, vortex.r);
          graphics.lineStyle(4, 0xa4edd5, .9).beginPath().arc(vortex.x, vortex.y, vortex.r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, vortex.life / vortex.max)).strokePath();
        }
      }
      for (const marker of [...meteors, ...bombs]) graphics.fillStyle(0xef7958, .2).fillCircle(marker.x, marker.y, marker.r).lineStyle(2, 0xffd5ab, .8).strokeCircle(marker.x, marker.y, marker.r);
      const frameTime = core.snapshot().time;
      for (const [index, enemy] of enemies.entries()) {
        const sprite = this.enemySprites[index] ||= this.add.image(enemy.x, enemy.y, 'enemy').setOrigin(.5, .8).setDepth(2);
        const chapterSoldier = !!core.chapter && isSoldier(enemy);
        sprite.setVisible(!chapterSoldier);
        if (chapterSoldier) continue;
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
      if (pet.enabled) graphics.fillStyle(0xef704c, 1).fillCircle(pet.x, pet.y, 9).lineStyle(2, 0xffd498, .6).strokeCircle(pet.x, pet.y, 15);
      this.crystals?.clear();
      for (const shot of enemyShots) this.crystals?.fillStyle(0xff776e, 1).fillCircle(shot.x, shot.y, shot.r);
      for (const crystal of crystals) {
        const radius = crystal.elite ? 10 : 7;
        this.crystals?.fillStyle(crystal.elite ? 0xffd47a : 0x74f0cf, 1);
        this.crystals?.beginPath().moveTo(crystal.x, crystal.y - radius).lineTo(crystal.x + radius, crystal.y).lineTo(crystal.x, crystal.y + radius).lineTo(crystal.x - radius, crystal.y).closePath().fillPath();
        this.crystals?.lineStyle(2, 0xd9fff2, .8).strokeCircle(crystal.x, crystal.y, radius + 4);
      }
      const currentEvents = core.takeEvents();
      audio?.present(currentEvents, core.snapshot());
      const events = [...silentEvents, ...currentEvents]; silentEvents = [];
      this.enemyView?.draw(enemies, events, core.snapshot().time - previousTime, frameTime);
      effects?.draw(events, core.snapshot().time - previousTime);
      for (const event of events) {
        if (event.type !== 'xp-pickup') continue;
        const label = this.add.text(event.x, event.y - 20, `XP +${Math.round(event.value)}`, { fontSize: '14px', color: '#74f0cf', stroke: '#102720', strokeThickness: 3 }).setOrigin(.5);
        this.tweens.add({ targets: label, y: label.y - 28, alpha: 0, duration: 700, onComplete: () => label.destroy() });
      }
      this.hero.setPosition(player.x, player.y);
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
    setEffectsEnabled(value) { effectsEnabled = value; effects?.setEnabled(value); },
    setAudioSettings(value) { audio?.configure(value); },
    pauseAudio() { audio?.pause(); },
    resumeAudio() {
      if (!audio) return;
      // Retain pre-resume events for visuals, without replaying their audio.
      silentEvents = [...silentEvents, ...core.takeEvents()]; audio.resume();
    },
    destroy() {
      if (teardown) return teardown;
      removed = true; effects?.clear(); core.destroy();
      const audioClosed = audio?.destroy();
      teardown = new Promise<void>(resolve => {
        game.events.once(Phaser.Core.Events.DESTROY, resolve);
        game.destroy(true);
      }).then(async () => { await audioClosed; });
      return teardown;
    },
  };
}
