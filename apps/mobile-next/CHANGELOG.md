# Mobile-next development changelog

Versions are identified by annotated Git tags. These previews are independent
of the legacy game version and are not full-content production releases.

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
