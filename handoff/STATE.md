# handoff/STATE.md

## Baseline
V3.1.2 Context-Lite | ordered global browser JS | save schema 30 | `index.html` | 22 JS files | no runtime deps

## Critical invariants
- Fresh ST001 stages start at 0 stars. Defeat grants 0 chapter stars. Non-story modes do not alter chapter stars.
- One run settles at most once. Endless ignores legacy 20-minute completion.
- Boss respawn regression, permanent aura slow, and rift cumulative-kill bug must remain fixed.
- Q/E skill, Space dodge, R ult, F interaction.

## Current architecture debt
Legacy version wrappers remain; migrate incrementally, never rewrite the combat loop in one pass.

## Current task
See `../TASK.md`.

## Last completed
**R3-M01 (D24)** - the map's three acceptance items: two were **vacuous**. **No collider anywhere**
(so "no invisible blockers" held because nothing can block; replaced by the strong form - a walk
through all six objects has one constant step, 744.64 px over 179 frames). "Hazard layers" is **one**
object, not a hierarchy. "Boundaries" is **four** rules: player clamp 18, Boss clamp 45, enemy bodies
clamped **only at spawn** (30), projectiles **culled** at +-100, enemy shots by `life` only. "Random
event slot" is half true: the six objects are a `const layout` **pinned by `first-map-oracle.json`**
(randomising them voids the oracle); the only draw is the fireline's `y`. Two defects, one line each:
**enemy movement had no clamp**, and `charge` is the first thing that can put a body outside the world
(`x = -30`, still shooting, and the player clamped at 18 could never reach it - the clamp had no
reachable path before `charge`; geometry was doing its job). And the fireline's centre was clamped
80 px inside, leaving a **44 px permanent safe strip along each wall** (closest approach 62 px against
a 36 px line, now 0). "明确闪避窗口" holds backwards: the window is **55.5x** the requirement (4 s vs
0.0721 s) - a **rhythm** (15.38% duty), not a threat.

## Changed files
`src/core/CombatSimulation.ts:347` (`clampPoint(enemy, world, enemy.r)`), `src/core/FirstStageMap.ts:79-80`
(clamp the line's body, not its centre). New `src/core/mapBounds.test.ts` (12 `it`, 0.34 s); rolling
`evidence/R3-M/map-report.json`; evidence page `evidence/R3-M/IMPLEMENTATION.md`. Re-baselined
`bossThreat.test.ts` (70/62) and `manualDamage.test.ts` (ceiling `>= 1` -> `<= 1`). `DECISIONS.md` D24;
`QUEUE.md` 11 done, 12 next; ledger **267 -> 268** (rolling **32 -> 33**).

## Tests
**51 files / 1531 tests, all pass (1660.69 s)** = 1519 + 12, 50 + 1 - both increments equal the new
file's size, so no probe survived. `vue-tsc --noEmit` clean. `ledger:verify` OK (268/268, rolling 33,
stale 0, moved 0); `smoke`/`audit`/`archive:verify` OK; `context` under 8192; `check` cannot run here.
**No Playwright**, so `MapView.ts:14` and the Vue templates are asserted through the fields they read.

## Unresolved risk
`R2-F-G4ROWS`'s evolution arm observes **no** G4 row at all. The fireline **does not damage enemies**
(written back to `R3-M02` as a design question); `hazardPeak` is never written or read; the fireline's
band is **screen space**, so a seeded run reproduces only at one viewport. `R3-E01..07c` still blocks
`R3-M03`. 27pp viewport gap; G10 D3 unmet; main-skill has no UI; `S001` shares the summon cap.

## Recommended next task
**R3-M02** (`QUEUE.md` #12); brief in `TASK.md`. Its `seals` data has **zero readers** and the stage it
belongs to (`CH001-02`) is refused outright by `prepare.ts:11`, so the first question is whether this
slice opens the stage, implements the mechanic behind an already-open door, or both.

Replace only the five fields above.
