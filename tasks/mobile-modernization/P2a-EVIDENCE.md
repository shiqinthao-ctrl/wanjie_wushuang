# P2a startup parity

179 synthetic rule inputs captured in a temporary Chrome profile. This is rule
comparison, not natural combat acceptance. Six heroes, all mastery boundaries,
level/star endpoints, 30 equipment templates, sets at 1/2/3 pieces, 20 individual
runes, pair/triple resonances, five pets and instance identity/crit caps are covered.

New pure TypeScript calculation reproduces each captured result, including
intermediate rounding and repeated talent application in legacy startup order.
Unknown save fields are carried by the save type; this is not import validation.
The new lobby and GameCore both consume the calculated fresh H001 attributes.
Data is copied into the independent app; no runtime legacy script is imported.

Reproduce fixture: node tasks/mobile-modernization/capture-growth.mjs
Reproduce tests: npm test --prefix apps/mobile-next

Rule and lifecycle tests: 185 pass. Legacy five gates pass; 49 baseline hashes
match. Strict typecheck and production build pass. Six Chrome browser checks
pass at 1280x720, 390x844 and 320x844, including displayed preparation attack,
four mount/exit cycles per viewport, pause, blur and missing-asset recovery.
Physical-phone acceptance, combat, persistence, settlement and PWA remain pending.
