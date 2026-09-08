// Synthetic diagnostics only: direct core state is used for targeting and accounting.
// No result from this script qualifies as natural browser acceptance.
import { build } from '../../apps/mobile-next/node_modules/vite/dist/node/index.js';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: 'apps/mobile-next/src/core/GameCore.ts', formats: ['es'] } } });
const output = Array.isArray(built) ? built[0] : built;
const { GameCore } = await import(`data:text/javascript;base64,${Buffer.from(output.output.find(item => item.type === 'chunk').code).toString('base64')}`);
const raw = await readFile('apps/mobile-next/src/data/freshSave.json', 'utf8');
const baseline = JSON.parse(raw), sha256 = createHash('sha256').update(raw).digest('hex');
const folder = process.argv[2];
if (!folder) throw new Error('Provide a new output directory; prior attempts must be preserved.');
await mkdir(folder, { recursive: false });
const priorities = ['P030', 'P017', 'P016', 'P018', 'P026', 'P019', 'A054', 'A027', 'A026', 'A003', 'A011', 'A021'];
const strategies = ['stationary', 'inset', 'ranged-gap', 'ranged-contact', 'boss-contact', 'boss-gap'];
for (const [layout, width, height] of [['desktop', 1280, 720], ['phone', 390, 844], ['narrow', 320, 844]]) {
  for (const strategy of strategies) for (const seed of [123, 456, 789]) {
    let state = seed;
    const core = new GameCore(structuredClone(baseline), () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296));
    core.start(width, height);
    const sim = core.combat, ledger = { incoming: 0, attackHealing: 0, recovery: 0, hits: 0 };
    const hurt = sim.hurt.bind(sim), hit = sim.hit.bind(sim), recover = sim.map.recover.bind(sim.map);
    sim.hurt = damage => { const hp = sim.player.hp; hurt(damage); ledger.incoming += hp - sim.player.hp; if (hp > sim.player.hp) ledger.hits++; };
    sim.hit = (...args) => { const hp = sim.player.hp, loss = ledger.incoming; hit(...args); ledger.attackHealing += sim.player.hp - hp + ledger.incoming - loss; };
    sim.map.recover = () => { const hp = sim.player.hp; const result = recover(); ledger.recovery += sim.player.hp - hp; return result; };
    let minHp = sim.player.hp, nextSample = 0, movement = { x: 0, y: 0 }, nextInput = 0;
    const timeline = [], choices = [];
    for (let frame = 0; frame < 24000; frame++) {
      const ui = core.snapshot(); minHp = Math.min(minHp, ui.hp);
      if (ui.time >= nextSample || ui.status === 'ended') {
        timeline.push({ time: ui.time, hp: ui.hp, ...ledger, kills: ui.kills, level: ui.level, enemies: sim.enemies.length }); nextSample += 15;
      }
      if (ui.status === 'ended') break;
      if (ui.status === 'encounter') { core.resolveEvent(ui.encounter.offer.token, 'skip', { affordable: true, gold: 6000 }); continue; }
      if (ui.status === 'choosing') {
        const choice = ui.choice, option = [...choice.options].sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id))[0];
        choices.push({ time: ui.time, id: option.id }); core.choose(choice.token, option.kind, option.id); continue;
      }
      if (ui.status === 'boss-loot') { core.pickBossLoot(ui.boss.offer[0].uid); continue; }
      if (ui.time >= nextInput) {
        nextInput = ui.time + .18;
        const p = sim.player;
        let target = { x: 1800, y: 1200 }, gap = 10;
        if (strategy === 'inset') target = { x: 260, y: 260 };
        if (strategy.startsWith('ranged')) {
          target = [...sim.enemies].filter(e => e.ai === 'ranged').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] || target;
          gap = strategy === 'ranged-gap' ? 210 : 0;
        }
        if (strategy.startsWith('boss')) { target = sim.boss || { x: 260, y: 260 }; gap = sim.boss ? strategy === 'boss-gap' ? 150 : 0 : 10; }
        const dx = target.x - p.x, dy = target.y - p.y, d = Math.hypot(dx, dy) || 1;
        const factor = Math.abs(d - gap) < 15 ? 0 : d < gap ? -1 : 1;
        movement = { x: dx / d * factor, y: dy / d * factor };
      }
      core.move(movement.x, movement.y); core.advance(1 / 60); core.takeEvents();
    }
    const ui = core.snapshot();
    const result = { evidence: 'synthetic-direct-core', sha256, layout, width, height, strategy, seed, time: ui.time, hp: ui.hp, minHp, kills: ui.kills, end: ui.endReason, ledger, choices, timeline };
    if (!ui.endReason) throw new Error('Strategy did not finish within the diagnostic bound');
    if (Math.abs(sim.player.maxHp + ledger.attackHealing + ledger.recovery - ledger.incoming - sim.player.hp) > .001) throw new Error('HP accounting mismatch');
    await writeFile(`${folder}/${layout}-${strategy}-${seed}.json`, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ ...result, choices: undefined, timeline: undefined })); core.destroy();
  }
}
if (JSON.stringify(baseline) !== JSON.stringify(JSON.parse(raw))) throw new Error('Baseline mutated');
