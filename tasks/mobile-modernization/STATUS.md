# Mobile modernization status

Baseline: 3a7b9f4; hashes and effective state captured. Legacy remains the reference.

| Slice | Source | Automated evidence | Browser evidence | Physical device |
|---|---|---|---|---|
| P0 baseline | Captured | Hash/save verification | Isolated Chrome fresh-game capture | Pending |
| P1 skeleton | Implemented | Legacy 5 gates, 49 hashes, strict build, 4 core tests pass | 6 Chrome tests pass: 1280x720, 390x844, 320x844; 4 cycles each; blur pause/assets | Pending |
| P2 first stage | P2a-i complete. P2j atomic settlement, immutable result and same-slot replay implemented; acceptance gap remains | Legacy 5 gates, 30 archives, 49 hashes, strict types/build and 897 tests pass | Native settlement 27/27; affected regressions 60/60. Post-fix natural victory 3/3, fresh timeout 3/3, supplemental imported HP-death 3/3 pass. Screenshots viewed; fresh HP-death unresolved | Pending |
| G1 evolution journey | Complete slice: 3 starters, 6 run forms, awakening, 3 branching skills and 3 bonds; opt-in first stage | 922/922 rules, legacy 5 gates, 49 hashes, strict types and production build pass | 84/84 native and affected regressions; natural starter flows at all sizes, full evolved desktop victory/save/replay, final phone/narrow 2/2 and event rerun 2/2 pass; built lobby 3/3. See G1-EVIDENCE.md | Pending |
| G2 elemental evolution | Complete slice: 3 added forms (9 total), frost skill, 4 routes and 3 mechanical bonds; paid signature guidance | 937/937 rules, strict types/build, legacy 5 gates, 49 hashes | 3/3 recorded natural runs (one complete victory/save/replay); 87/87 affected regressions, including original G1 natural routes; decoded videos and timestamps in G2-EVIDENCE.md | Pending |
| P3 full parity | Pending | Pending | Pending | Pending |
| P4 performance | Pending | Pending | Pending | Pending |
| P5 PWA / delivery | Pending | Pending | Pending | Pending |

No claim of completed migration, real-phone acceptance or production release.

P2j evidence and its remaining acceptance gap are recorded in `P2j-EVIDENCE.md`.
The initial preparation is the captured legacy demo save (H001 level 6 with
equipment), not an invented level-1 profile. Low-growth import tests are
explicitly supplemental and do not replace fresh-save HP-death acceptance.

G1 is newly authorized gameplay, separate from legacy parity. It carries the
P2j gap without waiving it; the full app verification suite is not green.
G2 extends that opt-in journey. Its recordings are available at
`evidence/G2/index.html`; this is a local results viewer, not a release or PWA.
