# Mobile-next development changelog

Versions are identified by annotated Git tags. These previews are independent
of the legacy game version and are not full-content production releases.

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
