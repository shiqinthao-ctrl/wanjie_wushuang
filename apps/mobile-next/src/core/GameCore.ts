import fresh from '../data/freshSave.json';
import { calculateStartup } from './growth';
import type { GameSave, GearInstance } from './saveTypes';
import { Progression } from './progression';
import type { ChoiceKind } from './progression';
import { CombatSimulation } from './CombatSimulation';
import type { Action, CombatEvent } from './CombatSimulation';
import type { FirstStageMap } from './FirstStageMap';
import { FirstStageEvents } from './firstEvents';
import type { EventCode, EventPayment } from './firstEvents';
import { TimedChests } from './timedChests';
import type { FirstBoss } from './FirstBoss';
import { freezeRun } from './settlement';
import type { FinalRun } from './settlement';
import { RunEvolution, evolutionBuild } from './RunEvolution';
import type { EvolutionSnapshot } from './RunEvolution';
import type { Journey } from './evolutionCatalog';
import { prepareChapterRun } from '../chapter/prepare';
import type { ChapterPreparation, ChapterRunOptions } from '../chapter/prepare';
import { createChapterProgression, seededRandom } from '../chapter/growth';
import type { ChapterFinalRun } from '../chapter/settlement';
import { freeze } from '../chapter/catalog';

export type RunStatus = 'idle' | 'running' | 'choosing' | 'encounter' | 'chest' | 'boss-loot' | 'paused' | 'ended' | 'destroyed';
export interface UiSnapshot extends ReturnType<Progression['snapshot']> { readonly status: RunStatus; readonly time: number; readonly hp: number; readonly maxHp: number; readonly kills: number; readonly heat: number; readonly dodgeCd: number; readonly skillCd: number; readonly ult: number; readonly map: ReturnType<FirstStageMap['snapshot']>; readonly encounter: ReturnType<FirstStageEvents['snapshot']>; readonly chests: ReturnType<TimedChests['snapshot']>; readonly boss: ReturnType<FirstBoss['snapshot']>; readonly endReason?: 'defeat' | 'victory' | 'timeout' }
export interface UiSnapshot { readonly journey?: EvolutionSnapshot; readonly ruleset?: 'chapter1-v1' }
export interface Point { x: number; y: number }
export type CoreEvent = CombatEvent | { type: 'xp-pickup'; value: number; x: number; y: number } | { type: 'level-choice'; level: number };

/** Rules only. Phaser is the sole caller of advance; this class owns no timers. */
export class GameCore {
  private status: RunStatus = 'idle';
  private progression: Progression;
  private combat: CombatSimulation;
  private encounters: FirstStageEvents;
  private chests: TimedChests;
  private drops: GearInstance[] = [];
  private events: CoreEvent[] = [];
  private endReason: UiSnapshot['endReason'];
  private final: FinalRun | undefined;
  private preparation: Pick<FinalRun, 'heroId' | 'chapter' | 'stageId' | 'modeId' | 'difficultyId' | 'build'>;
  private modeScore = 0;
  private modeBosses = 0;
  readonly chapter?: ChapterPreparation;
  private chapterFinal?: ChapterFinalRun;

  constructor(save: GameSave = fresh, random = Math.random, journey: Journey = 'classic', chapterOptions?: ChapterRunOptions) {
    this.preparation = { heroId: save.hero, chapter: String(save.selectedChapter), stageId: String(save.selectedStage), modeId: String(save.mode), difficultyId: String(save.difficulty || 'normal'), build: structuredClone(save.build) };
    if (chapterOptions) {
      this.chapter = prepareChapterRun(save, chapterOptions);
      if (this.chapter.heroId !== 'H001') throw new Error('R1b 仅开放 H001 成长样板。');
      random = seededRandom(this.chapter.seed);
      this.progression = createChapterProgression(this.chapter, random);
      this.combat = new CombatSimulation(save, this.progression, random, this.drops, Date.now, this.chapter);
      this.encounters = new FirstStageEvents(this.combat.player, this.progression, this.chapter.heroId, random, Date.now, this.drops);
      this.chests = new TimedChests(this.progression, this.combat, this.chapter.heroId, this.drops, random);
      return;
    }
    const evolution = journey === 'evolution' ? new RunEvolution(save.hero) : undefined;
    if (evolution && !save.heroes[save.hero]?.unlocked) throw new Error('此初始英雄尚未解锁。');
    const battleSave = evolution ? { ...structuredClone(save), build: evolutionBuild(save.hero) } : save;
    const startup = calculateStartup(battleSave);
    this.progression = new Progression(battleSave.build, startup.skills, startup.passives, random, evolution);
    this.combat = new CombatSimulation(battleSave, this.progression, random, this.drops);
    this.encounters = new FirstStageEvents(this.combat.player, this.progression, save.hero, random, Date.now, this.drops);
    this.chests = new TimedChests(this.progression, this.combat, save.hero, this.drops, random);
  }

  start(width = 390, height = 844): void {
    if (this.status !== 'idle') throw new Error('A run can only start once');
    this.resize(width, height);
    this.combat.map.placeObjects();
    this.combat.player.x = this.combat.world.width / 2;
    this.combat.player.y = this.combat.world.height / 2;
    this.status = 'running';
  }
  resize(width: number, height: number): void {
    this.combat.resize(width, height);
  }
  move(x: number, y: number): void {
    if (this.status === 'running') this.combat.move(x, y);
  }
  action(action: Action): boolean { return this.status === 'running' && this.combat.action(action); }
  interact(): boolean {
    if (this.chapter) return false;
    if (this.status !== 'running' || !this.combat.map.useNearest()) return false;
    if (this.progression.snapshot().choice) {
      this.status = 'choosing'; this.clearInput();
      this.events.push({ type: 'level-choice', level: this.progression.snapshot().level });
    }
    return true;
  }
  clearInput(): void { this.combat.clearInput(); }
  pause(): void { if (['running', 'choosing', 'encounter', 'chest', 'boss-loot'].includes(this.status)) { this.status = 'paused'; this.clearInput(); } }
  resume(): void { if (this.status === 'paused') this.status = this.combat.bossEncounter.snapshot().offer || this.combat.bossEncounter.snapshot().chapterLoot ? 'boss-loot' : this.chests.snapshot(this.combat.time).offer ? 'chest' : this.encounters.snapshot().offer ? 'encounter' : this.progression.snapshot().choice ? 'choosing' : 'running'; }
  pickChapterLoot(): boolean {
    if (this.status !== 'boss-loot' || !this.combat.bossEncounter.pickChapterLoot()) return false;
    this.clearInput(); this.status = this.progression.snapshot().choice ? 'choosing' : 'running'; return true;
  }
  pickBossLoot(uid: string): boolean {
    if (this.status !== 'boss-loot' || !this.combat.bossEncounter.pick(uid)) return false;
    this.clearInput(); this.status = this.progression.snapshot().choice ? 'choosing' : 'running'; return true;
  }
  claimChest(index: number): boolean {
    if (this.chapter) return false;
    if (this.status !== 'running' || !this.chests.claim(index, this.combat.time, this.combat.bossEncounter.snapshot().lootShown)) return false;
    this.combat.history.chests.push({ at: Math.floor(this.combat.time) });
    this.status = 'chest'; this.clearInput(); return true;
  }
  pickChest(token: number, index: number): boolean {
    if (this.status !== 'chest' || !this.chests.pick(token, index)) return false;
    this.status = 'running'; this.clearInput(); return true;
  }
  acceptsEvent(token: number, code: EventCode): boolean { return !this.chapter && ['encounter', 'paused'].includes(this.status) && this.encounters.accepts(token, code); }
  resolveEvent(token: number, code: EventCode, payment: EventPayment): boolean {
    if (!this.acceptsEvent(token, code) || !this.encounters.resolve(token, code, payment)) return false;
    this.clearInput(); if (this.status !== 'paused') this.status = 'running'; return true;
  }
  choose(token: number, kind: ChoiceKind, id: string): boolean {
    if (this.status !== 'choosing' || !this.progression.pick(token, kind, id)) return false;
    if (kind === 'recovery') this.combat.player.hp = Math.min(this.combat.player.maxHp, this.combat.player.hp + this.combat.player.maxHp * .2);
    this.clearInput(); this.status = this.progression.snapshot().choice ? 'choosing' : 'running';
    return true;
  }
  reroll(token: number): boolean { const accepted = this.status === 'choosing' && this.progression.reroll(token); if (accepted) this.clearInput(); return accepted; }
  banish(token: number, kind: ChoiceKind, id: string): boolean { const accepted = this.status === 'choosing' && this.progression.banish(token, kind, id); if (accepted) this.clearInput(); return accepted; }
  advance(elapsed: number): void {
    if (this.status !== 'running' || !Number.isFinite(elapsed) || elapsed <= 0) return;
    if (this.progression.journey) {
      this.progression.checkLevel();
      if (this.progression.snapshot().choice) { this.status = 'choosing'; this.clearInput(); return; }
    }
    // Base order: movement/spawn/attacks/AI, XP, hostile shots/director,
    // death, hero identity, skill forms, Boss warnings, pet, map, events, objective.
    const dt = Math.min(.034, elapsed);
    this.combat.beginFrame(dt);
    const pickup = this.combat.crystals.advance(this.combat.player, dt);
    if (pickup.value > 0) {
      this.progression.gain(pickup.value); this.progression.checkLevel();
      this.events.push({ type: 'xp-pickup', ...pickup });
      if (this.progression.snapshot().choice) {
        this.status = 'choosing'; this.clearInput();
        this.events.push({ type: 'level-choice', level: this.progression.snapshot().level });
      }
    }
    this.combat.finishBaseFrame(dt);
    if (this.combat.player.hp <= 0) {
      this.endReason = 'defeat';
      this.status = 'ended'; this.clearInput();
    }
    if (this.status === 'running') {
      this.combat.updateOuter(dt); this.combat.map.recover();
      const boss = this.combat.boss;
      if (boss && this.combat.history.bosses.at(-1)?.id !== boss.id) this.combat.history.bosses.push({ at: Math.floor(this.combat.time), id: boss.id, name: boss.name });
      if (this.combat.bossEncounter.snapshot().lootShown) this.modeBosses = 1;
      if (!this.chapter && this.encounters.open(this.combat.time)) {
        const event = this.encounters.snapshot().offer!;
        this.combat.history.events.push({ at: Math.floor(this.combat.time), id: event.kind, name: event.kind === 'merchant' ? '万界游商' : '黄金宝箱' });
        this.status = 'encounter'; this.clearInput();
      }
    }
    if (this.status === 'running') {
      const outcome = this.combat.bossEncounter.updateObjective();
      if (outcome) { this.status = 'ended'; this.endReason = outcome; this.clearInput(); }
      else if (this.combat.bossEncounter.snapshot().offer || this.combat.bossEncounter.snapshot().chapterLoot) { this.status = 'boss-loot'; this.clearInput(); }
      if (this.status === 'running' && !this.combat.bossEncounter.snapshot().lootShown) this.modeScore = Math.round(this.combat.kills + this.combat.eliteKills * 35 + this.modeBosses * 600 + this.combat.maxCombo * 2 + this.combat.time * .15);
    }
    if (this.status === 'ended' && !this.final && !this.chapterFinal) this.captureFinal();
    this.combat.applyCaps();
  }
  private captureFinal(): void {
    const sim = this.combat, map = sim.map.snapshot(), chests = this.chests.snapshot(sim.time);
    if (this.chapter) {
      const growth = this.progression.snapshot(), journey = this.progression.journey!.snapshot(growth.skills), boss = sim.bossEncounter.snapshot();
      const { ruleset, chapterId, stageId, heroId, mode, difficulty, seed } = this.chapter;
      this.chapterFinal = freeze({ ruleset, chapterId, stageId, heroId, mode, difficulty, seed, endReason: this.endReason!,
        time: Math.min(sim.time, this.chapter.stage.duration), hp: Math.max(0, sim.player.hp), maxHp: sim.player.maxHp, level: growth.level, kills: sim.kills,
        formId: journey.formId || null, awakened: journey.rank === 2, coreSkillLevel: growth.skills[this.progression.journey!.coreSkill() || ''] || 0,
        routes: Object.values(journey.routes).filter(id => id !== undefined), bonds: journey.bonds.filter(bond => bond.active).map(bond => bond.id),
        damageBy: { ...sim.damageBy }, damageTakenBy: { ...sim.damageTakenBy }, bossDefeated: boss.lootShown, bossLootClaimed: boss.lootClaimed });
      return;
    }
    this.final = freezeRun({ ...this.preparation, ...(this.progression.journey ? { journey: this.progression.journey.snapshot(this.progression.snapshot().skills) } : {}), endReason: this.endReason!,
      reason: this.endReason === 'victory' ? '黄巾巨将已击败 · Boss战利品已领取并归档' : this.endReason === 'timeout' ? '首战时限到达 · 黄巾巨将未击败' : '本局生命耗尽',
      hp: Math.max(0, sim.player.hp), maxHp: sim.player.maxHp, time: sim.time, level: this.progression.snapshot().level,
      kills: sim.kills, eliteKills: sim.eliteKills, maxCombo: sim.maxCombo, modeScore: this.modeScore, modeBosses: this.modeBosses,
      interactionsUsed: map.used, mapGold: map.bonusGold, bossPhaseMax: sim.bossEncounter.maxPhase,
      petGold: sim.petGold, petDamage: sim.petDamage, petHeals: 0, damageBy: sim.damageBy,
      evolved: chests.evolved, fused: chests.fused, drops: this.drops,
      timedRewards: chests.rewards.map(reward => ({ ...reward, id: `reward-${reward.index + 1}` })), encounterEvidence: sim.history,
    });
  }
  finalRun(): FinalRun | undefined { return this.final; }
  chapterFinalRun(): ChapterFinalRun | undefined { return this.chapterFinal; }
  snapshot(): UiSnapshot {
    const { player, time, kills, heat } = this.combat;
    return Object.freeze({ ruleset: this.chapter?.ruleset, journey: this.progression.journey?.snapshot(this.progression.snapshot().skills), status: this.status, time, hp: Math.max(0, player.hp), maxHp: player.maxHp, kills, heat, dodgeCd: player.dodgeCd, skillCd: player.skillCd, ult: player.ult, map: this.combat.map.snapshot(), encounter: this.encounters.snapshot(), chests: this.chests.snapshot(time), boss: this.combat.bossEncounter.snapshot(), endReason: this.endReason, ...this.progression.snapshot() });
  }
  renderState() { return { ...this.combat.renderState(), map: this.combat.map.renderState(), boss: this.combat.bossEncounter.snapshot().boss, telegraphs: this.combat.bossEncounter.telegraphs.map(warning => Object.freeze({ ...warning })) }; }
  takeEvents(): readonly CoreEvent[] { const events = [...this.events, ...this.combat.takeEvents()]; this.events = []; return events; }
  destroy(): void { this.combat.destroy(); this.events = []; this.status = 'destroyed'; }
}
