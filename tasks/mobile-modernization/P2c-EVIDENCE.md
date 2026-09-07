# P2c combat math

Pure TypeScript combatMath.ts preserves final ordered legacy calculations:
virtual passives, skill levels/evolution, additive gear and multiplicative rune,
talent/awakening/daily bonuses, source elements, critical skill healing, Boss
shield damage with no overflow, and incoming mode/low-HP/shield/dodge/inv order.

The source oracle was captured before implementation using the isolated Chrome
helper. Eight profiles include fresh, six stacked awakened heroes and virtual
shape runes. Thirty-two matrices cover all described skills/evolutions and hero,
pet, fusion and map sources at levels 0/1/5/10, with normal/elite/Boss targets.
There are 384 incoming boundary cases and per-profile enemy/Boss healing/shields.
449 new tests pass. These are synthetic rule fixtures, not gameplay acceptance.

All five legacy gates, 49 source hashes, 693 app tests, strict typecheck/build and
six Chrome lifecycle tests pass. No dependencies or legacy files changed. New
math is ready for the next combat integration slice; it is not yet a full battle.

Reproduce: node tasks/mobile-modernization/capture-combat-math.mjs
Verify: npm run verify --prefix apps/mobile-next
