// Synthetic strategy exploration only. This is not browser acceptance evidence.
import { build } from '../../apps/mobile-next/node_modules/vite/dist/node/index.js';
import { readFile } from 'node:fs/promises';
const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: 'apps/mobile-next/src/core/GameCore.ts', formats: ['es'] } } });
const output = Array.isArray(built) ? built[0] : built;
const { GameCore } = await import(`data:text/javascript;base64,${Buffer.from(output.output.find(item => item.type === 'chunk').code).toString('base64')}`);
const fresh = JSON.parse(await readFile('apps/mobile-next/src/data/freshSave.json', 'utf8'));
const profile = process.argv.includes('--low-growth') ? 'synthetic-low-growth' : 'fresh-baseline';
if (profile === 'synthetic-low-growth') {
  fresh.heroes.H001.level = 1; fresh.heroes.H001.mastery = 0;
  fresh.equipInst = {}; fresh.runes = []; fresh.build = { active: [], passive: [] };
}
const priorities = ['P030', 'P017', 'P016', 'P018', 'P026', 'P019', 'A054', 'A027', 'A026', 'A003', 'A011', 'A021'];
const strategies = process.argv.includes('--swarm')
  ? ['corner-ne', 'corner-se', 'corner-sw', 'circle-small', 'circle-large', 'gather-120', 'gather-240', 'gather-300']
  : ['corner', 'edge', 'chase', 'brute', 'away', 'sweep'];
for (const strategy of strategies) {
  for (const seed of [123, 456, 789]) {
    let state = seed;
    const core = new GameCore(fresh, () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296)); core.start(1280, 720);
    let minHp = 763;
    for (let frame = 0; frame < 24000; frame++) {
      const ui = core.snapshot(); minHp = Math.min(minHp, ui.hp);
      if (ui.status === 'ended') break;
      if (ui.status === 'encounter') { core.resolveEvent(ui.encounter.offer.token, 'skip', { affordable: true, gold: 6000 }); continue; }
      if (ui.status === 'choosing') {
        const choice = ui.choice, option = [...choice.options].sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id))[0];
        core.choose(choice.token, option.kind, option.id); continue;
      }
      if (ui.status === 'boss-loot') { core.pickBossLoot(ui.boss.offer[0].uid); continue; }
      const { player, enemies, boss } = core.renderState();
      let x = -1, y = -1;
      if (strategy === 'corner-ne') x = 1;
      if (strategy === 'corner-se') { x = 1; y = 1; }
      if (strategy === 'corner-sw') y = 1;
      if (strategy.startsWith('circle') || strategy.startsWith('gather')) {
        const radius = strategy === 'circle-small' ? 300 : 800;
        const angle = ui.time * 180 / radius;
        const dx = 1800 + radius * Math.cos(angle) - player.x, dy = 1200 + radius * Math.sin(angle) - player.y;
        const d = Math.hypot(dx, dy) || 1;
        x = dx / d; y = dy / d;
        if (strategy.startsWith('gather') && ui.time > Number(strategy.split('-')[1])) { x = 0; y = 0; }
      }
      if (strategy === 'edge') { x = 0; y = -1; }
      if (strategy === 'sweep') { x = Math.floor(ui.time / 5) % 2 ? 1 : -1; y = -1; }
      if (strategy === 'chase' || strategy === 'brute') {
        const sorted = [...enemies].sort((a, b) => strategy === 'brute' ? b.damage - a.damage : Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
        const target = sorted[0];
        if (target) { const d = Math.hypot(target.x - player.x, target.y - player.y) || 1; x = (target.x - player.x) / d; y = (target.y - player.y) / d; }
      }
      if (strategy === 'away' && boss) { const d = Math.hypot(player.x - boss.x, player.y - boss.y) || 1; x = (player.x - boss.x) / d; y = (player.y - boss.y) / d; }
      core.move(x, y); core.advance(1 / 60);
    }
    const ui = core.snapshot(); console.log(JSON.stringify({ profile, strategy, seed, time: ui.time, hp: ui.hp, minHp, kills: ui.kills, end: ui.endReason })); core.destroy();
  }
}
