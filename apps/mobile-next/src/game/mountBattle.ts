import Phaser from 'phaser';
import { GameCore } from '../core/GameCore';
import type { UiSnapshot } from '../core/GameCore';

export interface BattleHandle { core: GameCore; destroy(): Promise<void> }

export function mountBattle(parent: HTMLElement, publish: (value: UiSnapshot) => void, ready: () => void, fail: (message: string) => void): BattleHandle {
  const core = new GameCore();
  let removed = false;
  let budget = 0;
  class BattleScene extends Phaser.Scene {
    private hero?: Phaser.GameObjects.Image;
    preload() {
      this.load.image('ground', `${import.meta.env.BASE_URL}art/battlefield.svg`);
      this.load.image('hero', `${import.meta.env.BASE_URL}art/hero-h001.svg`);
      this.load.on('loaderror', () => fail('战场资源未能载入，请返回后重试。'));
    }
    create() {
      if (removed) return;
      core.start(this.scale.width, this.scale.height);
      const { world, player } = core.renderState();
      this.add.image(0, 0, 'ground').setOrigin(0).setDisplaySize(world.width, world.height);
      this.hero = this.add.image(player.x, player.y, 'hero').setDisplaySize(66, 81).setOrigin(.5, .84);
      this.cameras.main.setBounds(0, 0, world.width, world.height);
      this.cameras.main.centerOn(player.x, player.y);
      ready(); publish(core.snapshot());
    }
    update(_now: number, delta: number) {
      if (removed || !this.hero) return;
      core.resize(this.scale.width, this.scale.height);
      core.advance(delta / 1000);
      const { player, world } = core.renderState();
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
