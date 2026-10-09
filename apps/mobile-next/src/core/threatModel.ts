import data from '../data/threatV2.json';

/**
 * Explicit run rules version. The choice is auditable and travels with the run
 * instead of being hidden inside shared stage data.
 *
 * - `legacy`: the frozen reference model. `firstStage.rule.incoming` (0.44), the
 *   flat `def * 0.08` mitigation and the global 0.28s contact i-frame. Locked by
 *   `combatMath.test.ts` against `combat-math-oracle.json`; do not change.
 * - `threat-v2`: the design-target model in `docs/design/GDD-可玩性提升设计-v2.md`
 *   §5. Soft-capped defence, per-source contact timers, its own enemy damage table.
 */
export type RunRules = 'legacy' | 'threat-v2';

export interface ThreatRules {
  readonly version: string;
  /** Global incoming multiplier replacing `firstStage.rule.incoming`. */
  readonly incoming: number;
  /** Defence soft cap: `1 - def / (def + softCap)` replaces the flat `def * 0.08`. */
  readonly softCap: number;
  /** Seconds a single attacker must wait before its next contact hit lands. */
  readonly contactInterval: number;
  /** The same gate for Boss body contact, which has its own cadence. */
  readonly bossContactInterval: number;
  /** Per-enemy contact damage. Replaces `firstStage.enemies[id].damage` for this model. */
  readonly enemyDamage: Readonly<Record<string, number>>;
  /**
   * Boss max-HP multiplier, per journey. Replaces `firstStage.rule.bossHp` (3)
   * for this model, i.e. the whole `config.boss.hp * difficulty * timeCurve *
   * <this>` product. It is per journey because the evolved hero brings roughly
   * 1.8x the Boss DPS, so one shared number cannot put both fights in the same
   * window - measured: at a shared value, whichever journey is not tuned runs
   * either 30s or 76s.
   */
  readonly bossHp: Readonly<Record<'classic' | 'evolution', number>>;
  /**
   * Multiplier on the horde spawn interval while the Boss is on the field. `1`
   * keeps the legacy cadence. R1g-3 measured that 64.7% of Boss-phase damage
   * comes from small-arms projectiles, not from the Boss body, so a Boss that is
   * expensive on its own would just kill the player with trash fire.
   *
   * Per journey, because the two journeys are limited by opposite things:
   * classic runs out of *clock* (thinning the horde starves its level curve and
   * it times out - 30/32 wins at 3x, 32/32 at 2x), while evolution runs out of
   * *health* (the horde is the threat - 31/32 at 3x, 22/32 at 2x).
   */
  readonly bossPhaseSpawnInterval: Readonly<Record<'classic' | 'evolution', number>>;
  /**
   * Fixed radius, in world units, at which the horde spawns around the player.
   * The legacy formula derives this from the viewport (`max(w,h)*.55+60`), so the
   * standing horde - and with it the incoming - grows with the screen. Pinning it
   * makes the model viewport-invariant.
   */
  readonly spawnRadius: number;
  /**
   * Multiplier on every point of damage the Boss itself deals (body contact and
   * telegraphs). The Boss fight is a pure race against a fixed HP pool with no
   * sustain, so this is the lever that buys a longer fight without making it
   * unwinnable.
   */
  readonly bossDamage: number;
  /**
   * R1g-10. `bossDamage` multiplies body contact and telegraphs alike, so it cannot pay G4's
   * 15%-per-move target: at the 14.31x that target needs, contact alone is 82 HP every 1.1s and the
   * player dies inside 10s - measured, the Boss never gets to cast (0 casts a run). These two split
   * that knob, so a move can be made legible without making standing next to the Boss lethal.
   * `1` is the shipped reference and every existing number is unchanged.
   */
  readonly bossSkillDamage: number;
  readonly bossContactDamage: number;
  /**
   * R1g-10, the cadence half of `DECISIONS.md` D7 path A: a multiplier on every *fresh* Boss cast
   * cooldown (spawn, phase change, recurring), i.e. the same aggregate paid in fewer, bigger moves.
   * `1` keeps the shipped 2.62 / 2.24 / 1.86 cadence. Measured at 14.31x on the arm that reads
   * warnings: 31 casts a run become 2, and move damage falls from 94.7 HP to 0 - rare casts are
   * avoidable ones, which is why this lever has to be traded against G2's floor and G3's 60s.
   */
  readonly bossCastCooldown: number;
  /**
   * How far the Boss's line charge (蛮王冲锋) travels. The Boss is moved to the
   * far end of the telegraph, so this is a gameplay distance, not a drawing one:
   * the legacy value is `max(viewport.width, viewport.height) * .92`, which made
   * the charge 52% longer on a 1280px screen and cost the player that much
   * re-approach time on every dash.
   */
  readonly chargeRange: number;
}

export const threatV2: ThreatRules = Object.freeze({
  version: data.version,
  incoming: data.incoming,
  softCap: data.softCap,
  contactInterval: data.contactInterval,
  bossContactInterval: data.bossContactInterval,
  enemyDamage: Object.freeze({ ...data.enemyDamage }) as Readonly<Record<string, number>>,
  bossHp: Object.freeze({ ...data.bossHp }) as Readonly<Record<'classic' | 'evolution', number>>,
  bossPhaseSpawnInterval: Object.freeze({ ...data.bossPhaseSpawnInterval }) as Readonly<Record<'classic' | 'evolution', number>>,
  spawnRadius: data.spawnRadius,
  bossDamage: data.bossDamage,
  bossSkillDamage: data.bossSkillDamage,
  bossContactDamage: data.bossContactDamage,
  bossCastCooldown: data.bossCastCooldown,
  chargeRange: data.chargeRange,
});

export const threatFor = (rules: RunRules): ThreatRules | undefined => rules === 'threat-v2' ? threatV2 : undefined;
