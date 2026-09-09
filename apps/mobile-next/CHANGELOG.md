# Mobile-next development changelog

Versions are identified by annotated Git tags. These previews are independent
of the legacy game version and are not full-content production releases.

## mobile-next-p4b-20260909 - 2026-09-09

### Fixed
- Short portrait battles separate the stage/Boss HUD, health/experience,
  map feedback and reward buttons from the hero and touch controls.
- Reward/action controls retain at least 44 px touch targets; detailed map
  feedback remains accessible through touch and keyboard scrolling.
- Safe-area, simultaneous movement/skill, natural upgrade selection and
  changing browser height have recorded regression coverage.

### Verification and scope
- 946 rules and 27 latest distinct related browser cases pass. All 45 test
  executions and 42 original recordings, including failed attempts, remain.
- Crowded Boss markup is a synthetic layout test, separately labeled from
  natural play. No combat, save, dependency or legacy-source change.
- P4a's portrait edge-camera fix is included. Physical phones, landscape HUD,
  performance/endurance, PWA and three earlier HP-death target failures remain.

Evidence: `../../tasks/mobile-modernization/P4b-EVIDENCE.md`.

## mobile-next-p4a-20260909 - 2026-09-09

### Fixed
- Portrait phones keep the hero centered at world edges, clear of the HUD and
  touch controls. A visible boundary distinguishes the arena from camera padding.
- Camera bounds and ground sizing update when the viewport/world changes;
  desktop and landscape retain their existing camera clamp.
- Natural camera regression tests retain screenshots, world-corner geometry,
  multitouch/cancellation, resize, pause/exit and remount evidence.

### Verification and scope
- 946 rules and 17 distinct related browser cases pass at their latest attempt.
  All 35 browser recordings, including three failed attempts, are preserved.
- No core rules, balance, saves, dependencies or legacy-source changes.
- Physical phones, short/landscape HUD layout, performance/endurance, PWA and
  the earlier three fresh HP-death target failures remain open.
- Local release prepared; GitHub/Render synchronization depends on restoring
  the external HTTPS connection. See P4a-EVIDENCE.md for delivery status.

Evidence: `../../tasks/mobile-modernization/P4a-EVIDENCE.md`.

## mobile-next-p2k-20260908 - 2026-09-08

### Fixed
- Natural settlement tests now use a wall-time bound so short pixel-targeted
  inputs cannot exhaust the loop before the six-minute stage objective.
- Tests export and compare fresh preparation before entry, then verify the
  observed settlement, persisted rewards and replay before asserting the target.
- Named attempts preserve original results and reject an existing report path.
- Supplemental imports wait for the save panel's file input to become enabled;
  the original three loading-race failures remain in the evidence.

### Investigation
- Unchanged fresh preparation won in all three Boss-contact browser attempts;
  the HP-death target remains failed and the original assertion is retained.
- Separate direct-core diagnostics produced 21 victories and 33 timeouts in
  54 seeded strategy/layout combinations. They do not establish impossibility.
- A recording viewer distinguishes requested and actual outcomes, with original
  videos, timelines, saved results and integrity manifests.

### Scope
- No game-rule, balance, preparation, dependency or legacy-source changes.
  G3's three starters, nine forms, ten routes and six bonds remain available.
- Full-suite, physical-phone, performance and PWA gates remain open.

Evidence: `../../tasks/mobile-modernization/P2k-EVIDENCE.md`.

## mobile-next-g3-20260908 - 2026-09-08

### Added
- Ten skill routes now explain their playstyle, tradeoff and exclusive
  alternative. Later upgrades keep the selected route's description.
- Bond guidance names owned and missing skills; new skill choices preview
  the bonds they advance or activate.
- Actual lightning hits produce visible chain paths. Frost fields show
  remaining lifetime; frost bursts and summon strikes have distinct marks.
- Stationary guards and following hunters have distinct role indicators.
- The pause menu can disable short-lived effects while retaining field
  boundaries, hostile projectiles and pickup visibility.
- Four natural-input recordings and a timestamped replay viewer accompany
  the tagged development preview.

### Fixed
- Route benefits, constraints and exclusivity use separate lines, including
  narrow portrait layouts.
- New short-lived effects pause with battle time, stay within a 40-effect
  budget and clear on teardown. Rendering does not select or damage targets.

### Included earlier work
- P2a-i first-stage combat, pickups, upgrades, map events, chests and Boss Loot.
- P2j atomic settlement, immutable results and replay of the same save slot.
- G1-G2 Evolution Journey: three starters, nine run-only forms, awakening,
  ten active skills, eleven passives, ten skill routes and six mechanical bonds.

### Known gaps
- P2j natural HP-death from unchanged fresh preparation is still unverified;
  supplemental imported-save evidence does not close it. The full browser
  verification suite is not a green gate.
- Physical phones, balance feedback, performance targets, 30-minute endurance,
  other stages/modes, audio and PWA remain pending. No legacy entry switch.

Evidence: `../../tasks/mobile-modernization/G3-EVIDENCE.md`.
