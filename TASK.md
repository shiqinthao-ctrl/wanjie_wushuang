# TASK.md - G4 wind-shadow evolution

Status: completed, 2026-09-09; GitHub prerelease published and Render verified.
Runtime: 05b82ac / mobile-next-g4-20260909. Live deploy: dep-daggvhbl550s73bkiq30.
Baseline bc0c9d2; rollback P4c 649b0b5. Evidence: G4-EVIDENCE.md.

Deliver one new H012 form, one tornado branch and one wind-shadow bond in
opt-in Evolution Journey. Retain the nine existing forms and ten routes.

## Goal
H012 windwarden (岚影剑尊), Lv.3: three shadow blades, 65% attack each,
one pierce; awakening raises pierce to three. Skill plants a fixed wind vortex
toward the nearest enemy/Boss within 180 units (forward if empty): radius120,
35% attack per pulse, life4s; awakening radius160/life6s. Keep gear-adjusted
6s cooldown. Ultimate costs100, plants radius200/65% attack/life6s wind vortex
and retains H012's 4/5 shadow companions. Paid A026 signature guidance to Lv.3;
existing Lv.8 + active Lv.3 awakening gate. Identity never grants a bond.

A026 Lv.3 ambush (伏阵风暴): third exclusive branch alongside roaming/orbit.
Fixed nearest-target placement within220 units; radius110 (145 evolved), 80%
ordinary pulse damage, same range/duration modifiers. Clamp world placement;
no following, movement or Boss displacement. Explain both forgone branches.

galephantom (风影合袭): owned positive-level A026 + A015 or S001. Each live
vortex pulse emits one shadow blade toward nearest enemy/Boss within300 units
of its center; speed420, one pierce, base damage75% vortex pulse. Scale using
A026 level and shadow passives/bonuses. No target/expired vortex means no shot.
Reuse pulse clock and existing budgets. No second loop or per-frame Vue state.

## Scope and invariants
- Runtime, UI advice, tests and delivery for this one build only. No classic
  balance, legacy entry or save migration changes. Ten forms/11 routes/7 bonds.
- No new dependencies, public debug UI, save edits, clock acceleration,
  forced RNG, balance changes or injected battle state in natural acceptance.
- Preserve the fresh fixture hash and P2k's requested HP-death assertions.
  Label simulations/imported preparations separately; preserve all attempts.
- Carry P2l fresh HP-death and phone timeout targets forward without weakening
  assertions or changing balance to force those outcomes.
- Preserve legacy order, Schema30, zero-star fresh/defeat chapters, non-story
  isolation, once-only settlement, Boss Loot priority and V3.0 safety fixes.
- Continue authorized GitHub release delivery. Update the existing Render
  service for this verified runtime change. Keep main, old tags and auto-deploy
  Off unchanged. Rollback deployment: dep-dagdr1142hec73brst60.

## Acceptance and delivery
1. Fail then pass tests: gates, paid signature, route exclusivity, placement,
   awakening, pulse cadence/targets, elements, expiry/caps/destroy, Boss
   immunity, classic isolation and UI alternatives/bond advice.
2. Desktop/phone natural full form/route/bond/awakening/victory/reload/retry;
   narrow-screen choices, guide and touch. No injected state, time or RNG.
3. Run related native regressions, then check, smoke, audit, context and
   archive:verify in order; verify legacy hashes, app types, rules and build.
4. Decode recordings and provide a full normal-speed test video plus evidence
   distinguishing passed behavior, failed target and unverified acceptance.
5. Review changes, update the five handoff sections and changelog, commit/tag,
   push and publish a GitHub prerelease with verified assets. Deploy existing
   Render service; verify live source commit, asset hashes and both entries.

Physical devices, performance/endurance, full gameplay parity and PWA remain
separate work. Preserve every attempt and recording, including failures.
