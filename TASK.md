# TASK.md - G5 frost-flame evolution

Status: local acceptance passed; delivery in progress, 2026-09-09.
Baseline 6aec45b; prior runtime G4 05b82ac.
Deliver one H001 form, one A011 branch and one matching bond in opt-in
Evolution Journey. Evidence: tasks/mobile-modernization/G5-EVIDENCE.md.

## Exact rules
- H001 frostflame (霜焰剑皇), Lv.3: basic frost pulse radius125, 55% attack,
  chill1.2s, then one forward fire blade, 80% attack, pierce1. Awakening
  raises frost radius to155 and fire pierce to3. Skill: frost radius180,
  60% attack, chill2s, then fixed fire field radius130, 30% attack/pulse,
  life3s; awakened frost radius220 and field radius180/life5s. Retain
  gear-adjusted6s cooldown. Ultimate costs100: frost radius260, 200% attack,
  chill3s, then fire burst radius260, 400% attack. Distinct elemental sources.
  Paid G2_FROST signature guidance toLv.3; existing Lv.8 + activeLv.3 gate.
- A011 Lv.3 ringfire (八方焰轮): third exclusive route alongside volley/nova.
  Eight evenly spaced radial fireballs, speed300, 45% ordinary fireball
  damage each, radius9, explosion28 times range, existing split passive.
  First ray uses existing heroAim. Same cooldown/level/evolution modifiers.
  Describe both forgone choices. No new projectile type or resource.
- thermalshock (霜火淬炼): positive-level G2_FROST + any fire-tag active skill.
  Fire damage to living, currently chilled normal/elite enemies is multiplied
  by1.30 before existing damage resolution. No consumption/extension of chill,
  no proc recursion, no bonus at expiry, no Boss bonus or displacement. Applies
  to all fire sources while this bond is owned, including hero/fire fields.
  Form identity alone never grants a bond. Classic mode remains unchanged.

## Scope and invariants
- 3 fixed starters,11 forms,12 routes,8 bonds. Runtime, advice, presentation,
  focused rules/browser tests, recordings, versioned delivery for this build.
- No new dependencies, schema/save/legacy/classic balance changes, public debug
  UI, forced RNG, save/core injection or time acceleration in natural tests.
- Preserve legacy order, Schema30, fresh/defeat zero stars, non-story isolation,
  once-only settlement, Boss Loot precedence, V3.0 fixes and fresh fixture hash.
- Carry P2l HP-death/phone-timeout targets and G4 startup timeout forward;
  do not weaken assertions or change balance to force acceptance.
- Continue authorized GitHub prerelease and existing Render delivery. Keep main,
  prior tags/assets and Auto-Deploy Off. Rollback G4:05b82ac /
  dep-daggvhbl550s73bkiq30. Do not deploy final evidence-only follow-up.

## Acceptance and delivery
1. Red/green focused tests: paid/gated form, awakening, elemental separation,
   radial route/exclusivity, live chill/expiry/Boss/classic isolation, limits,
   destruction, UI alternatives and bond advice.
2. Desktop/phone natural form/route/bond/awakening/victory/retry/reload;
   narrow choices, guide, touch and exit/reentry. Preserve every attempt.
3. Relevant browser regressions; check, smoke, audit, context, archive:verify
   in order; legacy hashes, app types, full rules and production build.
4. Review; decode raw recordings and provide full original-speed MP4s.
   Update only five rotating handoff sections, changelog and evidence.
5. Commit/tag/push, publish verified GitHub assets; deploy existing Render
   service and verify source, hashes, both public entries and natural flow.

Physical phones, performance/endurance, full parity/audio and PWA remain open.
