# R2-B01..08 — the eight element bonds

## 0. One-line result

**The queue's premise ("the bonds have no acceptance") is mostly false: six of the eight already had
a combat-level test, and two of those were thorough.** The slice therefore adds the **missing half**
of each bond rather than a rewrite, plus two structural guards the sweep turned up. **Zero production
change** — every number below is read off the shipped code (`EvolutionCombat`, `CombatSimulation`,
`RunEvolution`), and the only new files are a test and this page.

## 1. Premise check (Scope 0) — counted, not trusted

`TASK.md` says eight. Counted with a command (`bonds.test.ts` it 1 asserts it; the table is
`bond-report.json.gating`):

| bond | tags | tag-only skill A | tag-only skill B |
| --- | --- | --- | --- |
| `wildfire` | 炎 + 风 | `A003` | `A026` |
| `stormhunt` | 雷 + 影 | `A013` | `A015` |
| `shadowfire` | 影 + 炎 | `A015` | `A003` |
| `superconduct` | 冰 + 雷 | `G2_FROST` | `A013` |
| `winterlegion` | 冰 + 召 | `G2_FROST` | `S001` |
| `thunderlegion` | 雷 + 召 | `A013` | `S001` |
| `galephantom` | 风 + 影 | `A026` | `A015` |
| `thermalshock` | 冰 + 炎 | `G2_FROST` | `A003` |

Three questions the task asked, answered on the tree:

1. **Reachable from a real build?** Yes, all eight, and for every hero: `evolutionBuild`
   (`RunEvolution:9`) is `initial.active` **plus every other `activeSkills` entry**, so all ten
   actives sit in every hero's offer pool. Nothing here is form-locked. The only reachability
   constraint is the six-skill unlock cap (`progression.ts:72`), which is what makes a bond a
   *choice* rather than a freebie.
2. **Gated on both tags at level > 0?** Yes, by construction: `RunEvolution.bond` (`:92-95`) is
   `rule.tags.every(tag => … (level || 0) > 0 && hasSkillTag(skill, tag))`. Asserted both ways
   (each tag alone fails, level 0 fails, both at level 1 pass) and the UI's `count` is `1/2` then
   `2/2`.
3. **Named by the branch that implements it?** Yes, all eight: `CombatSimulation:499` (`wildfire`)
   and `EvolutionCombat:102, 107, 127, 152, 194, 210, 211` (the other seven). Each branch calls
   `bond('<its own id>')`, so the id and the effect cannot drift apart silently.

## 2. Scope 1 — what was already asserted (and where)

Counted per bond, not by reputation:

| bond | existing assertion | file:line |
| --- | --- | --- |
| `wildfire` | presence / absence of `damageBy.H010_WILDFIRE` | `evolutionCombat.test.ts:57-60` |
| `stormhunt` | one extra damaged target | `evolutionCombat.test.ts:54` |
| `shadowfire` | the field exists; the dodge cd blocks a second | `evolutionCombat.test.ts:55-56` |
| `superconduct` | ×1.35 on a chilled body, and no bonus after the chill expires | `elementalEvolution.test.ts:71-79` |
| `winterlegion` | `G2_FROST_CLONE` damage appears, and does not without the bond | `elementalEvolution.test.ts:80-93` |
| `thunderlegion` | first tick `.6` vs `.8` | `elementalEvolution.test.ts:94-95` |
| `galephantom` | per pulse, `.75×`, `pierce 1`, 300-unit search, expiry, boss, classic-off | `windShadow.test.ts:74-99` |
| `thermalshock` | ×1.3 on fire, frost channel untouched, boss excluded | `formPressure.test.ts:1005-1029`, `:1115-1116` |

`galephantom` is fully covered and `superconduct` is covered on every non-vacuous axis. The other
six had a **presence** assertion without the numbers, which is exactly the shape that stays green
when a coefficient moves.

## 3. Scope 1 — the halves this slice adds

| bond | what is now pinned | measured |
| --- | --- | --- |
| `wildfire` | coefficient, cadence, element | **0.55×** the vortex tick, **4 pulses** in 1s (`.28s` tick), source element `fire` |
| `stormhunt` | the boss clause is **not** the bond | +1 jump (2 → 3); the boss takes a jump hit with **no 影 skill owned** |
| `shadowfire` | geometry | field at the **pre-dodge point**, `r 85`, `life 3`, `dmg = atk × .35`, one per dodge |
| `winterlegion` | radius, chill length, boss exclusion | `r 70`, **1s** chill, `×.25` of the summon's damage, the boss carries no `chilledUntil` |
| `thunderlegion` | the interval is constant | 40-frame gaps at `.8s`, **30-frame gaps at `.6s`** — not a shrinking gap |
| `thermalshock` | the chill is not consumed | `chilledUntil` unchanged across the hit; `×1.3` measured on the same dummy |

The `wildfire` magnitude is a **same-pipeline control**, not a hand-derived formula: the same
explosion is called by hand with `vortex.dmg × .55` on an identical dummy and the two damage totals
must match to 1e-9. The first draft used a made-up source id (`CTRL`) and read 1.67× — because
`sourceElement('CTRL')` is **physical** while `H010_WILDFIRE` is **fire** (`combatMath:44`), and the
element is part of `damageMultiplier`. The control now uses a fire id.

`thunderlegion` is read in **frames**, not seconds, because `updateOuter` does not advance
`sim.time` — a first draft asserted wall-clock gaps and measured all-zero timestamps.

## 4. Two structural findings (pinned, neither fixed)

### 4.1 `stormhunt`'s second clause is the base skill, not the bond

The `detail` reads 「雷电弹多跳一个目标，首领也可跳链。」 Only the first clause is the bond. The
chain's target list is `[...s.enemies, ...(s.boss ? [s.boss] : [])]` (`EvolutionCombat:164`), so the
boss is chainable **with or without** `stormhunt`. Measured: own `A013` alone, put a body at 100 and
the boss at 200 from the player, and the boss takes a jump hit (`150.62` in
`bond-report.json.stormhunt.bossJumpWithoutBond`). The bond's whole worth is `+1` target
(`count` 2 → 3, `:194`).

**Ruling: the detail is what is wrong, and the detail is a design string — out of scope here.** The
test pins the code's behaviour so that a later "fix" of the string cannot silently change the code.

### 4.2 `chapterBonds` is a second hand-written copy of the same eight ids

`chapter/catalog.ts:16` lists the eight again, and `progress.ts:48` / `settlement.ts:29` **reject**
any run report whose bond id is not in that list (`chapterError('战报羁绊')`). Nothing compared the
two. A ninth bond added to `evolutionCatalog` but not to the whitelist would pass every existing
test and then throw at settlement time, in the one place a run is being written to disk.

The new test asserts `[...chapterBonds]` **equals** `bonds.map(b => b.id)` — same ids, same order.

## 5. "The player can see it" — coverage, not a gap

- `ui/RunGuide.vue:17` renders all eight with `name`, `needs`, an `已激活 / ${count}/2` badge, one
  condition row per tag from `bondRequirements`, and the `detail`.
- `ui/BattleView.vue:179,214` counts the active bonds in the HUD and in the build panel.
- `ui/RunResult.vue:37` names the active bonds at the end of a run.
- `ui/ChoiceDetails.vue:17` previews 「可激活 / 推进」 from `choiceAdvice` when the offered skill
  would complete a bond.
- The run report carries them: `GameCore:194` writes `journey.bonds.filter(active).map(id)` into the
  chapter settlement, where `progress.ts` validates them against `chapterBonds`.

Asserted here: `snapshot().bonds` (all eight active from one six-skill set, each with `needs`,
`detail`, two frozen tags and `count`), `bondRequirements` (`[true, true]`), and `choiceAdvice`
(`风火燎原 · completes: true` for `A026`; a passive advances nothing).

**Not asserted:** the Vue templates themselves. There is no Playwright output in this environment
(`handoff/STATE.md`), so "the player can see it" is a claim about the **data those templates read**,
and the page says so rather than implying a rendered check.

## 6. Ruling (D20)

**Assert what ships; do not touch a production line.** All eight effects exist, are gated, and are
reachable. The two findings are a **string** that overstates one bond and a **duplicate list** that
can diverge — both belong to documentation/data hygiene, and fixing either inside this slice would
mean editing a design string or a chapter constant while the acceptance question is still open.

## 7. Gates

- `typecheck` (`vue-tsc --noEmit`): **clean**.
- `bonds.test.ts`: **9 passed** (35 ms).
- `treeHygiene.test.ts`: **1 passed** — the new probe guard does not flag the new file.
- `byteLedger.test.ts`: **5 passed**; the ledger was refreshed for the new rolling report
  (`263 → 264` lines, rolling writers `28 → 29`), `ledger:verify` → **`LEDGER OK`**,
  `missing 0 / stale 0 / moved 0 / extra 0`.
- `smoke` / `audit` / `archive:verify`: **OK**; `context` **7536 / 8192**.
- Full suite: **47 files / 1496 tests, all pass** — see §7a.

## 7a. Full-suite closing note

Full suite on the clean tree: **47 files / 1496 tests, all pass** (`EXIT=0`, 1616.15 s) =
1487 + **9** (`bonds.test.ts`) and 46 + **1** file. The ledger was then refreshed to the bytes this
run wrote: `ledger:write` → **264 lines**, `ledger:verify` → **`LEDGER OK`**,
`rolling writers = 29`, `missing 0 / stale 0 / moved 0 / extra 0`. `smoke` / `audit` /
`archive:verify` OK; `context` **7536 / 8192**.

The two structural facts above are the reason this slice exists even though six bonds were already
covered: `stormhunt`'s string and `chapterBonds`' second copy are both things a passing test suite
could not see.

## 8. Write-back to the queue

- `QUEUE.md` #8 marked done; `▶ 下一个` moves to **#9 `R2-D`** (the 200-seed build report).
- `TASK.md` re-pointed at #9.
- `DECISIONS.md` gains **D20**.
- The premise correction ("six of eight already covered") is written into the queue row so the next
  reader does not re-open the same question.
