# G1 evolution journey evidence

Date: 2026-09-08. Scope: `EVOLUTION.md`; new gameplay in `apps/mobile-next`.
This document keeps G1 evidence separate from legacy parity and the open P2j
fresh-preparation HP-death acceptance. No legacy entry switch or deployment.

## Delivered behavior

- Three unlocked starters: H001, H010 and H012. Two mutually exclusive run-only
  forms each; a second awakening at run level 8 with an owned active at level 3.
  Neither choice heals, resets cooldowns nor modifies permanent hero levels.
- Nine common actives and eleven passives, six slots each and level 5 caps.
  Ordinary choices vary by RNG while retaining an owned-active growth option.
  A011, A026 and S001 each have two exclusive level-3 routes.
- Fire/wind adds vortex fire damage; lightning/shadow adds one distinct chain
  target including Bosses; shadow/fire adds a field after successful dodge.
  Bonds count owned skill tags, not virtual equipment levels or duplicate ranks.
- Core-owned attacks, projectiles, summons and damage; bounded entity budgets
  and destruction. Vue receives detached snapshots and displays the run guide.
- Starter selection updates only the isolated save's hero. Original build,
  unsupported fields and import source text remain retained. Immutable journey
  recap settles atomically with normal rewards to the starter's mastery.
  Replay and abandoning a run both begin the next journey without evolution.

## Rule and boundary checks

922/922 Vitest tests across 20 files pass after the final merchant guard.
G1 includes 25 tests for eligibility, exclusivity, stale choices, pause,
cooldowns, run reset, six form attacks, awakening, all skill branches, real
bond damage, distinct projectile targets, clone expiry and caps, shield
refresh without stacking, per-starter settlement and preparation preservation.
Seeded variety tests are synthetic; they are not natural-play evidence.

Review also checked core/render separation, UI input, transaction revisions,
unknown save fields and teardown. Bond-tag snapshot arrays now reject mutation
without changing core rules. No dependency or locked version changed.
Review found that legacy merchant firepower has no journey damage authority.
Journey UI and core now offer healing/leave only and reject unsupported firepower
before the payment transaction. Its regression test failed before the fix and
passes afterward; classic event choices retain their existing behavior.

## Browser evidence

Natural tests use visible controls, keyboard or multi-touch input and exported
save files. They do not inject RNG, elapsed time, HP or other combat state.
Native fault/concurrency fixtures are explicitly synthetic.

- Initial desktop attempt failed because the test helper retried an event
  button while its prior transaction was closing the dialog. It now waits for
  the dialog to close. Failure output and trace are retained under
  `evidence/G1/natural-desktop-attempt-01/`.
- Desktop short flow passed (1/1), including dragon, a fireball route and a
  fire/wind bond. Evidence: `evidence/G1/natural-desktop-pass/`.
- Phone and narrow short flows passed (2/2): H010/phoenix and H012/void,
  routes/bonds, simultaneous move/action touch input, pause, exit and reset.
  Evidence: `evidence/G1/natural-phone-narrow-pass/`.
- Visual inspection identified pause dialog opening near the bottom. Its
  heading now receives initial focus; the full-run test verifies that heading
  is in the viewport. Upgrade/event/chest/Boss Loot headings also avoid focusing
  an action on entry; pointer-origin guards reject inherited release clicks.

- Full evolved desktop run passed (1/1, 5.3 minutes wall time): natural victory
  at 301 battle seconds, level 21 and 579 kills, three stars. The player chose
  bulwark, awakened, and obtained orbit/guard/nova with two bonds. Boss Loot,
  committed rewards, replay from the starter, one added run and exported-save
  equality after reload passed. Guide and result screenshots were viewed.
  Evidence: `evidence/G1/natural-full-desktop-pass/`.

- Native and affected regressions passed 84/84 across all three sizes:
  evolution, settlement, Boss, event and storage fixtures plus save, lifecycle,
  combat and map UI checks. These include synthetic failure/concurrency cases;
  they are not 84 natural complete runs. Evidence:
  `evidence/G1/native-and-regressions-pass/`.
- Final phone/narrow natural rerun passed 2/2 after the merchant guard and
  portrait readiness check (3.6 minutes). Phone chose phoenix/volley/shadowfire;
  narrow reached awakened void with hunter and both wildfire/shadowfire.
  Both verified route-guide heading visibility, pause/resume, simultaneous
  move/action input, exit/re-entry and fresh run state. Portraits loaded;
  lobby/guide screenshots were viewed at both sizes. Evidence:
  `evidence/G1/natural-phone-narrow-final/`.

- The post-merchant affected phone invocation passed 9/10: the natural event
  purchase, natural timed chest, five native event cases and two native evolution
  cases passed. The storage-retry test then encountered a legitimate level-5
  upgrade after the event closed. Its clock assertion expected combat without
  handling that player choice. The test now selects any pending visible upgrade
  within a bounded loop before asserting clock progress; retry and exactly-once
  currency assertions remain. No gameplay state or RNG is injected. Failure
  screenshot and trace are retained in `evidence/G1/affected-phone-attempt-01/`.

- The focused phone event rerun passed 2/2 (1.8 minutes), including natural
  purchase/persistence and explicitly synthetic storage abort/retry. The latter
  still reaches the event through natural movement and attacks. Both retain
  clock-progress and exact currency assertions. Evidence:
  `evidence/G1/event-phone-final/`.

Final lobby wording says only some active skills branch at level 3, matching
the three implemented skill families. Built-lobby checks passed at 1280, 390
and 320px: selection, launch availability, portrait loading, no horizontal
overflow and no page/console/HTTP errors. Desktop and phone screenshots were
viewed. Evidence: `evidence/G1/final-build-lobby/`.

## Final gates and build

- Legacy `check -> smoke -> audit -> context -> archive:verify` passed in order:
  26 scripts/1 CSS, 130 existing wrapper aliases, 30/30 historical HTML archives.
- Baseline verifier passed all 49 hashes and retained Schema30, twelve stages
  and the original first-stage Boss contract.
- Strict typecheck, 922/922 rules across 20 files and the production build pass.
  No dependency or lockfile changed. G1 adds 25 rule tests to the 897 P2j tests.
- Build output is `apps/mobile-next/dist/`, served under `/mobile-next/`.
  Main UI: 113.39 KB (43.35 KB gzip); battle UI: 45.95 KB (17.78 KB gzip);
  battle mount/Phaser: 1424.38 KB (375.57 KB gzip). The existing large-chunk
  warning remains. These are artifact sizes, not runtime performance metrics.
- Local preview: `http://127.0.0.1:4178/mobile-next/`. No public deployment,
  remote push or old-entry switching was performed.

## Remaining boundaries

G1 is a playable new-design slice in ST001-01/story/normal with PET001. Six
evolution forms are temporary identities, not six purchasable permanent heroes.
Classic preview is the default after reload; H010/H012 saves can switch back to
Evolution Journey without losing their data. Full content, new stages/modes,
permanent collection, PWA and release remain future work.

Physical phones, touch comfort, 30-minute thermal stability, FPS and balance
have not been certified. Browser phone sizes are Chrome emulation. Production
build retains the large Phaser chunk warning; no performance gain is claimed.

P2j's unchanged fresh demo preparation still lacks a natural HP-death result.
Its assertion and original evidence remain in `P2j-EVIDENCE.md`; imported
low-growth HP-death is supplemental only. The full app `verify` is not green.
