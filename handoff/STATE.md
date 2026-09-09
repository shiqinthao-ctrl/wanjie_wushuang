# handoff/STATE.md

## Baseline
Version: V3.1.2 Context-Lite
Runtime: ordered global browser JS
Save schema: 30
Entry: `index.html`
JS files: 22
Dependencies: none at runtime

## Critical invariants
- Fresh ST001 stages start at 0 stars.
- Defeat grants 0 chapter stars.
- Non-story modes do not alter chapter stars.
- One run settles at most once.
- Endless ignores legacy 20-minute completion.
- Boss respawn regression, permanent aura slow, and rift cumulative-kill bug must remain fixed.
- Q/E skill, Space dodge, R ult, F interaction.

## Current architecture debt
Legacy version wrappers still exist. Migrate incrementally; do not rewrite the full combat loop in one task.

## Current task
See `../TASK.md`.

## Last completed
P2l investigation delivered: mobile-next-p2l-20260909 / fe2220c, six GitHub release assets verified before/after publication. Three fresh attempts still win; actual settlement/reload/retry pass. No rules changed. Render retains verified P4c 649b0b5 / dep-dagdr1142hec73brst60; auto-deploy off.

## Changed files
settlement.spec.ts observations and opt-in input strategy, pressure diagnostics, P2l recording config, packaging script, evidence/report, changelog and TASK/handoff. No runtime, fresh fixture, dependency or legacy changes. Raw failures and recordings remain in the evidence release.

## Tests
946 rules; 54 browser executions: 50 pass / 4 failed targets, no retries/skips. All 12 natural actual outcomes pass persistence/retry. 45 synthetic simulations: 28 wins / 17 timeouts / 0 deaths. Five ordered root checks, 49 legacy hashes and app types/build pass. 54 originals and two full MP4s decoded. Six GitHub asset digests/sizes match. All 51 live hashes and both entries verified; zero live console errors.

## Unresolved risk
Fresh HP-death still open: P2l adds 3 victories. Stationary phone timeout also wins at 350 seconds; retained as a failure. Imported deaths do not close the fresh gate. Full suite not rerun/green. Physical phones, performance/endurance, other content/modes, audio/PWA and Phaser chunk remain. Rollback: 4c37125 / dep-dagd7tp42hec73bpec70; older 75e139b / dep-dag058on74is73bukk40.

## Recommended next task
Scope one cross-element evolution route for an existing starter, one skill branch and a matching bond in opt-in evolution journey. Replace TASK.md with exact rules and natural acceptance first. Carry fresh-death/phone-timeout gaps forward without weakening assertions. Preserve classic rules, P4c runtime/assets and auto-deploy off. See P2l-EVIDENCE.md.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
