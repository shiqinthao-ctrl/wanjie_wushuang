# R2-F-CAP — the summon cap must not eat the awakening

Base: R2-F-INST. Queue: `tasks/game-remediation/QUEUE.md` #6j. Roadmap: `ROADMAP.md`.

This is a **balance** slice, not an instrument slice. **One production line changed:**

```
EvolutionCombat.ts:137   cap(this.summons, 8);   ->   cap(this.summons, 10);
```

`cap()` itself (`spawnRules:80`) is untouched, every other kit is untouched, `legacy` is untouched.

---

## 0. Scope 0 — premise verification

Every premise in `TASK.md` was re-read against the code on the current tree.

| Premise | Verdict |
| --- | --- |
| the skill raises 3 guards, 4 awakened | ✅ `EvolutionCombat:71` `this.summon('H012_CLONE', v.rank === 2 ? 4 : 3, v.rank === 2 ? 8 : 6, true, p.atk * .8)` — and `guard: true` |
| the ultimate raises 6 clones | ✅ `:85` `this.summon(\`${v.heroId}_R_CLONE\`, v.formId === 'beastlord' ? 6 : v.rank === 2 ? 5 : 4, 7, false, p.atk)` — `guard: false`, and the `beastlord` literal short-circuits the rank term |
| both land on the same frame | ✅ they are two presses, not one frame: `:71` sits in the `else if` chain of the **skill** branch, `:85` is the first statement of the **ultimate** branch. The harness presses both back to back with no frame between, which is what makes the pool the only thing between them |
| `summon()` ends in `cap(this.summons, 8)` | ✅ `:137`, single call site of `cap` in the file |
| `cap` evicts the **oldest** | ✅ `spawnRules:80` `if (items.length > limit) items.splice(0, items.length - limit)` — a **front** splice. Probe: `cap([1,2,…,10], 8)` keeps `[3,…,10]`. Note `>` is strict, so a kit asking for *exactly* `limit` is untouched |
| the field always holds 8 | ✅ measured, not inferred: `summonsPeak` read **8** in all eight cells of `R2-F09/beastlord-pressure.json` at cap 8 |
| what gets dropped is the skill's guards, not the ultimate's clones | ✅ the skill branch runs first, so its guards are pushed first, so they are the front of the array |
| **which ids survive, and in what order** | ⚠️ **both ids survive — what is evicted is bodies, not kinds.** `summonKinds` read `['H012_CLONE','H012_R_CLONE']` at cap 8 as well. Rank 1 kept 2 guards (ticks `.1033 / .2233`, i.e. `i = 1, 2` minus one frame) and all 6 clones; rank 2 kept 2 guards (`.2233 / .3433`, `i = 2, 3`) and all 6 clones. The guards that survive are the **latest-firing** ones, so the eviction did not just remove bodies, it pushed the first volley back |
| **"whether any other form can reach 8 summons at all"** | ⚠️ **yes, and R2-F09's own doc says no.** `legion` (R2-F05) rank 2 asks **11** and read `summonsPeak: 8` at cap 8. See §3 and the correction in §6 |

**New in Scope 0: `S001` shares the same cap.** `:192`
`else if (id === 'S001') this.summon(id, Math.min(6, 1 + m.count), 4.5 * m.duration, route === 'guard', p.atk * .65)`
is inside `cast()`, the **auto-skill** path — `S001` is an *owned active*, not a form kit, so it can
coexist with any form's clones. It is the only summon source in the file outside a form kit, and it is
the source `evolutionCombat.test.ts:77` uses to saturate the pool (20 presses → `toHaveLength(N)`).
R2-F09's harness never sees it: its `kit` list is `['H012_BASIC','H012_CLONE','H012_R_CLONE']` and its
control arms own no skills.

### Why rank 2 is not 2× rank 1 — the ask is per *window*, not per cast

This is what makes the ceiling a rank-2 problem rather than a rank-1 one, and it is worth stating
because "3 + 6 = 9" is only half the composition:

| | skill cd | guard life | batches alive together | skill ask | ult ask | total ask |
| --- | --- | --- | --- | --- | --- | --- |
| `legion` r1 | 6s | 5s | 1 | 2 | 4 | **6** |
| `legion` r2 | 6s | 7s | **2** | 3 + 3 | 5 | **11** |
| `beastlord` r1 | 6s | 6s | 1 (recast lands on the expiry frame) | 3 | 6 | **9** |
| `beastlord` r2 | 6s | 8s | **2** | 4 + 4 | 6 | **14** |

A rank-2 guard outlives the 6s skill cooldown, so the second batch lands while the first is still
posted. At rank 1 the batches do not overlap. So the ceiling is only ever reached *after* the
awakening — the awakening is exactly what creates the overflow.

---

## 1. The decision

Three candidates, each with a different blast radius.

| # | fix | the rule | what it costs |
| --- | --- | --- | --- |
| ① | **raise the cap to 10** | `cap(this.summons, 10)` — a **global** rule every summon kit inherits | moves **2 cells outside `beastlord`**: `legion` r2 (8 → 10) and the `evolution/unlock` full-run cell |
| ② | evict the kit's own clones before the skill's guards | `while (length > 8) splice(findIndex(u => !u.guard) ?? 0, 1)` — only this kit can feel it | keeps 3/4 guards but **takes the clones instead**; a rule with no legible story |
| ③ | make the skill field one more guard (`3/4` → `4/5`) | a balance number | **a no-op for the symptom.** 4 + 6 = 10 and 5 + 6 = 11 both still exceed 8, so the field still holds 8 and the guards are still what gets evicted — and the extra guard *pushes the first volley back* |

**Chosen: ①.**

The reason is legibility, which is the criterion TASK.md asked for. Ten bodies is a real budget for
one skill plus one ultimate; **eight made a kit's own `guard: true` units the most expendable thing on
the field.** A `guard` is a body the kit explicitly posted to hold a position (`update` re-anchors a
unit only when `!unit.guard`, `:208`); the ultimate's orbiting clones are the interchangeable ones. A
cap that eats the guards first is backwards — so ② is the *correct* rule **for a cap of 8**, and the
finding is that 8 is the wrong number, not that the eviction order is wrong.

② also has the worse player-facing story. ① is "you can have ten things on the field". ② is "when you
have too many things, the ones your ultimate made die first" — a rule a player can only learn by
counting bodies, and one that makes the ultimate *worse* the more guards you have posted.

③ fails on its own terms: it changes a balance number and leaves the rule that eats the awakening in
place. It is the shape R1g-7 and R1g-11 already recorded twice — *do not reach for a new mechanism to
fix a symptom that only exists at a particular number* — except here it is the mirror: do not reach
for a *number* when the rule is what is wrong.

**`legion` moving is a finding, not a side effect.** TASK.md's constraint says it outright: a cap is a
global rule, so if the chosen fix moves any cell outside `beastlord`, that is a finding to report.
§3 names it; §2 measures it.

---

## 2. What moved — the ten forms

**Method — a single-switch counterfactual, not a diff of two trees.** The eight report instruments
(`bossBudget`, `bossThreat`, `formPressure`, `fusionReachability`, `growthPacing`, `manualDamage`,
`skillCadence`, `threatModel`) were run at **cap 8** and at **cap 10**, and every
`evidence/**/*.json` outside `test-results/` and `.baseline/` was md5'd at both — **248 files, 4
differ**. Then the two instruments that own those reports (`bossBudget`, `formPressure`) were re-run
at cap 8 a third time, and **reproduced the cap-8 baseline byte-for-byte**
(`853bafe4…` / `7a975e63…` / `afa9a752…`). That is what makes the cap the only variable: same tree,
same seeds, one number.

### 2.1 Per form — the ask and the reading

`summonsPeak` at cap 8 → cap 10, `horde/r1`, `horde/r2` (the other three scenarios read the same peak
for every form that has one):

| form | slice | skill ask r1/r2 | ult ask r1/r2 | peak @8 | peak @10 | report md5 (cap 10) | moved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `bulwark` | F01 | — | — | 0 | 0 | `90970aa1…` | no |
| `frostlord` | F02 | — | — | 0 | 0 | `13ee6c6b…` | no |
| `frostflame` | F03 | — | — | 0 | 0 | `d3f69397…` | no |
| `phoenix` | F04 | — | — | 0 | 0 | `b42c8986…` | no |
| **`legion`** | **F05** | 2 / 3+3 | 4 / 5 | **6 / 8** | **6 / 10** | `09931db8…` ← `853bafe4…` | **yes** |
| `thunderlord` | F06 | — | — | 0 | 0 | `2aa0498d…` | no |
| `void` | F07 | — | 4 / 5 | 4 / 5 | 4 / 5 | `50517300…` | no |
| `reaper` | F08 | — | 4 / 5 | 4 / 5 | 4 / 5 | `4086c91e…` | no |
| **`beastlord`** | **F09** | 3 / 4+4 | 6 / 6 | **8 / 8** | **9 / 10** | `0c12e8f6…` ← `7a975e63…` | **yes** |
| `windwarden` | F10 | — | 4 / 5 | 4 / 5 | 4 / 5 | `885f1a52…` | no |

(For the eight that did not move, the cap-8 and cap-10 md5 are the same string; the `←` column shows
the cap-8 value only for the two that did.)

**Eight of ten reports are bit-identical.** Only two forms ever approach the ceiling, and both moved.

### 2.2 `beastlord` (R2-F09) — the cell this slice is about

50 fields changed. Everything below is `cap 8 → cap 10`; `—` means the key is absent at cap 10.

| cell | field | @8 | @10 |
| --- | --- | --- | --- |
| all 8 | `summonsPeak` | 8 | **9** (r1) / **10** (r2) |
| horde r1 | `dealtBy.H012_CLONE` | 1651.16 | **1801.27** |
| horde r1 | `dealtBy.H012_R_CLONE` | 187.63 | **—** (zero) |
| horde r1 | `kitDealt` | 1838.80 | **1801.27** |
| horde r1 | `firstHitAt[0]` | 0.1167 | **0** |
| horde r2 | `dealtBy.H012_CLONE` | 1501.06 | **1801.27** |
| horde r2 | `dealtBy.H012_R_CLONE` | 375.26 | **—** (zero) |
| horde r2 | `kitDealt` | 1876.32 | **1801.27** |
| elite r1/r2 | `dealtBy.H012_CLONE` | 150.11 | **300.21** |
| elite r1/r2 | `dealtBy.H012_R_CLONE` | 562.90 | **375.26** |
| elite r1/r2 | `kitDealt` | 713.00 | **675.48** |
| elite r1/r2 | `firstHitAt[0]` | 0.05 | **0** |
| boss r1 | `dealtBy.H012_CLONE` | 35725.16 | **36926.01** |
| boss r1 | `dealtBy.H012_R_CLONE` | 9944.50 | **10132.14** |
| boss r1 | `kitDealt` | 73432.26 | **74820.74** |
| boss r2 | `dealtBy.H012_CLONE` | 61543.35 | **63945.04** |
| boss r2 | `dealtBy.H012_R_CLONE` | 9756.87 | **10132.14** |
| boss r2 | `kitDealt` | 99062.81 | **101839.77** |
| boss r2 / r1 ratio | `kitDealt` | 1.3490 | **1.3611** |
| ranged r1/r2 | `dealtBy` | `{H012_R_CLONE: 1125.79}` | **unchanged** |
| bossDodged r1 | `kitDealt` | 73282.15 | **74670.63** |
| bossDodged r2 | `kitDealt` | 99062.81 | **101839.77** |

Three things in that table are worth reading twice.

1. **`boss r2 H012_R_CLONE` is now equal to `boss r1`'s, digit for digit** (10132.14 = 10132.14). At
   cap 8 the *awakening reduced the clone half* (9756.87 < 9944.50) — the clones were paying for the
   fourth guard. The assertion that carried that was `.toBeLessThan`; it is `.toBe` now, and that one
   word is the whole slice.
2. **In the horde cell the awakening is now worth exactly nothing, and it is not a null result.** With
   nothing evicted rank 2 really does field a fourth guard — but the three that fire first already
   clear the ring, so the two ranks come out **bit-identical** (`horde.r2.dealtBy` `toEqual`
   `horde.r1.dealtBy`) and the clones never get a volley (`H012_R_CLONE` = 0, their first tick is
   `.8`). At cap 8 the cell showed a **+2.04% trade** in the wrong direction (guards −150.10, clones
   +187.63) because the eviction pushed the first volley back 0.12s. The cell cannot see the
   awakening at all now; the assertion says so out loud instead of quietly dropping the rank
   comparison.
3. **The elite cell got slightly *cheaper* (713.00 → 675.48) while the boss cell got more
   expensive.** Both are the same mechanism: the guards fire earlier (`firstHitAt` 0.05 → 0), so a
   single short-lived target dies to the guards before the clones can contribute (562.90 → 375.26),
   while a target that survives the whole window gets the guards' extra burst *and* the clones.

### 2.3 `legion` (R2-F05) — the cell outside `beastlord`

13 fields changed, and the shape is much simpler: **r1 does not move at all.**

| cell | field | @8 | @10 |
| --- | --- | --- | --- |
| all 4 r2 + bossDodged r2 | `summonsPeak` | 8 | **10** |
| boss r2 + bossDodged r2 | `dealtBy.H010_CLONE` | 76988.73 | **77378.55** |
| boss r2 + bossDodged r2 | `kitDealt` / `dealt` / `bossHpLost` | 131310.18 | **131700.00** |
| horde r2, ranged r2, elite r2 | `kitDealt` | 6067.98 / 2119.35 / 1164.62 | **unchanged** |

`legion` r2 asks 11 (see §0), so it was already over a cap of 8 and is **still** over a cap of 10 — the
cap is not gone for this kit, it just bites one body later. The only measurable consequence is
**+0.30%** on the boss cell (`H010_CLONE` +389.82). The three short scenarios are bit-identical
because the clones that the extra two slots admit never get a volley.

The `casts`/`ults` counts in the report are the receipt for the composition: `horde` reads
`casts: 2, ults: 1` (rank 1's guards expire before the 6s recast, so only one batch is ever alive →
peak 6; rank 2's do not → 3 + 3 + 5 = 11), and `boss` reads `casts: 15, ults: 1` (a full 90s
encounter, so rank 2 holds two batches for the whole fight).

⚠️ **A note against a number this slice inherited, and a correction to R2-F09's own doc.** R2-F09's
⚠ note (added earlier in this slice) claimed `legion` r2 reads 8 "because 3 + 5 = 8 is *exactly* the
limit, so `cap` never triggers". **Both halves are wrong.** `cap` does trigger for `legion` r2 — the
report reads 8 at cap 8 and **10** at cap 10, which is only possible if the ask exceeds 10 — and the
ask is 11, not 8, because the rank-2 guards outlive the cooldown and the second skill batch stacks on
the first. The note's *conclusion* ("the ceiling is shared by two forms, not reached by one") stands;
its mechanism is corrected in place in `R2-F09/IMPLEMENTATION.md`.

### 2.4 `R1g-12/boss-report.json` — the full-run cell

`bossBudget.test.ts` runs full `GameCore` runs (33 seeds × 6 cells). Exactly **one of six cells**
changed: `evolution / phone / unlock`.

| field | @8 | @10 |
| --- | --- | --- |
| `wins` | 19 / 33 | **19 / 33** (unchanged) |
| `minHpRatioMedian` | 0.707 | **0.645** |
| `takenInPhaseMedian` | 474 | **504** |
| `phaseSecondsMedian` | `[28.9, 26.4, 24.0]` | `[29.8, 26.3, 24.0]` |
| `bossShareOfPhaseDamage` | 0.382 | **0.370** |
| `topSources` `hostile-projectile` | 4774 | **4913** |
| `topSources` `B001-contact` | 3323 | **3374** |

`classic/phone/first`, `evolution/phone/first`, `classic/desktop/first`, `evolution/desktop/first`
and `classic/phone/unlock` are **bit-identical**. That is the shape a global rule should have: the
`unlock` driver is the one that actually fields summon kits, so it is the only cell the ceiling can
reach, and it moves in a coherent direction (the horde is cleared faster, the player reaches the Boss
at a lower HP floor and takes slightly more, the win count is unchanged at 19/33).

### 2.5 `R1g-12/manual-report.json` — G8

8 fields changed; the aggregate headline moves 0.3775 → 0.3765. **Per journey, only
`evolution/unlock` moves** — the same cell `boss-report.json` flagged, which is a useful cross-check
that the two instruments are seeing the same thing:

| field (`evolution/unlock`) | @8 | @10 |
| --- | --- | --- |
| `manualShare` | 0.3773 | **0.3725** |
| `manualCoreShare` | 0.374 | **0.369** |
| `manualShareMedian` | 0.3752 | **0.3533** |
| `byBucket.manualSkill` | 0.3577 | **0.3524** |
| `byBucket.autoSkill` | 0.4082 | **0.4132** |
| `byBucket.summon` | 0.0801 | **0.0793** |
| `byBucket.basic` | 0.1271 | **0.1277** |
| `totalDamage` | 19,950,097 | **19,858,531** |
| `minHpRatioMedian` | 0.707 | **0.645** |

`classic/first`, `evolution/first`, `classic/unlock` and `evolution/focus` are bit-identical.
`minHpRatioMedian` 0.707 → 0.645 is the same number `boss-report.json` reads for the same cell — two
independent instruments, one driver.

---

## 3. What the cell still cannot see

TASK.md asks this directly, and a passing suite is not an answer. **The ceiling is invisible in eight
of the ten cells, and that is a property of the kits, not of the harness.**

| why it cannot see the cap | forms | the number |
| --- | --- | --- |
| the kit never summons at all | `bulwark`, `frostlord`, `frostflame`, `thunderlord` | `summonsPeak: 0` in all eight cells — asserted `toBe(0)` at `:1780` |
| the kit's only summon is the ultimate's 4/5 clones | `void`, `reaper`, `windwarden` | `summonsPeak: 4 / 5`, asserted `toBe(4)` / `toBe(5)` at `:2897-2898` |
| **the kit is capped but the extra slots buy nothing measurable** | `legion` | peak 8 → 10, but three of four cells are bit-identical and the fourth moves +0.30% |

And one place the ceiling **is** reachable that no form-pressure cell exercises:

- **`S001` + any H012 ultimate.** `S001` asks `min(6, 1 + m.count)` and its units are `guard: true` on
  the `guard` route (`:192`), so an owned `S001` plus a `beastlord` ultimate asks 6 + 6 = 12. The
  form-pressure harness cannot see it (its `kit` lists do not include `S001`, and its control arms own
  no skills — asserted: no `_E` key appears in any cell). It is visible in the full-run instruments,
  which is part of why `evolution/unlock` moves.

So the honest statement of the boundary is: **the ceiling is a form-kit rule that `S001` also shares,
and only `legion` r2 and `beastlord` r1/r2 ever reach it in the pressure matrix.** If a future kit
summons more than 10 in one window, the pressure matrix will show it as a `summonsPeak` that stops
growing — which is exactly what R2-F09's `summonsPeak === 8` did, and why it was asserted as a
measured number on purpose.

---

## 4. The md5 accounting (per directory)

> **Coverage caveat (added by R2-F-HORDE-LEDGER).** The `248` below is what this slice measured on
> 2026-09-29. It is **not** the ledger's coverage today - see §10. The four differences are still
> correct; the count is not.

248 JSON files under `evidence/` (excluding `test-results/` and `.baseline/`) were md5'd at cap 8 and
at cap 10. **4 differ.**

| directory | file | md5 @8 | md5 @10 | re-checked |
| --- | --- | --- | --- | --- |
| `R1g-12/` | `boss-report.json` | `afa9a7521cc976673b249c7bacc8bce2` | `602eb6b2216c07fbffea2c977498faa0` | plain md5 + regenerated at cap 8 → matched |
| `R1g-12/` | `manual-report.json` | `30474d0f9a69c007f129c222ea6fd58f` | `8246b726fbfd70dcadebd1b0595bce97` | plain md5 (instrument run separately) |
| `R2-F05/` | `legion-pressure.json` | `853bafe4340c5033e1b42ccb885c1af8` | `09931db88dc3a674323aef283bf6fa7e` | plain md5 + regenerated at cap 8 → matched |
| `R2-F09/` | `beastlord-pressure.json` | `7a975e633db23a56c44731a89cd6da86` | `0c12e8f6de324ca73916308bfe155117` | plain md5 + regenerated at cap 8 → matched |
| `R2-F01..F04`, `F06..F08`, `F10` | `*-pressure.json` | — | **identical** | plain md5 |
| `R1g-1…R1g-11`, `R2-F-INST`, `R2-F01..F10` (all others) | — | — | **identical** | plain md5 |

**No report was moved between directories**, so the "rolling report" rule does not apply here: the
`slice` field of every touched report is still the slice that *owns* the question (`R1g-12` owns the
Boss budget and G8; `R2-F05`/`R2-F09` own their forms). The reports were rewritten in place by their
own instruments, which is the correct behaviour for a global rule.

**This slice adds one report of its own:** none — it changes no instrument. `evidence/R2-F-CAP/` holds
this document only.

---

## 5. Acceptance — which target this touches

`G8` (manual share ≥ 35%), `G9` (≥ 3 skills where manual is meaningfully stronger), `G10` (≥ 6 turning
points).

- **G8 — touched, still cleared.** The target is read per journey. At cap 10 the cells read
  `evolution/first` **0.4085**, `evolution/unlock` **0.3725**, `evolution/focus` **0.4085** —
  **three cells over 0.35**, unchanged in count from cap 8. The cell that moved
  (`evolution/unlock`) moved *down* by 0.48pp and the floor is 0.35, so there is 2.25pp of headroom
  left. `manualShareMedian` 0.3533 also still clears the 0.25 floor.
- **G9 — not touched.** It counts skills whose manual release is stronger than the auto release; the
  ceiling has nothing to do with it, and the count (10) is read from `manualDamage`'s
  `structure`/`damageRanking` block, which did not change its skill set.
- **G10 — not touched.** It counts turning points (evolutions / awakenings / fusions / charms); the
  number of bodies a kit can hold is not one of them.

**No target moved.** The only acceptance-relevant effect is a 0.48pp decrease in one G8 cell that
still clears by 2.25pp.

---

## 6. Documentation reconciliation

- **The catalogue copy is now true and needed no edit.** `evolutionCatalog.ts:23`
  `awakening: '四名近卫，延长驻守时间。'` — after ①, rank 2 really does field four guards. Note
  `QUEUE.md`'s #6j row predicted "若选 ①②，文案要跟着改" — **that prediction is wrong for both ① and
  ②**: ① fields four guards, and ② keeps 4 guards and evicts clones instead. Only ③ would have left
  the copy needing a change. Corrected in `QUEUE.md`.
- **No GDD line needed reconciling.** `docs/design/GDD-可玩性提升设计-v2.md` contains no `beastlord`
  / 冥契 / 近卫 prose; the only GDD line in this area is G8's baseline column ("S001 占 50%"), which is
  a *pre-R1g-7* number and is out of this slice's scope (R1g-7 recorded it).
- **A comparison assertion in `R2-F09/IMPLEMENTATION.md` was wrong and is corrected in place.**
  It read "F09 is the first form in the series to push `summonsPeak` to 8 — the earlier slices read
  4/6, never touching the ceiling." `legion` (R2-F05) rank 2 also read **8** — and it was being
  *capped to* 8, not sitting exactly at the limit (its ask is 11). So the ceiling is shared by two
  forms and one of them was already being cut by it, which makes R2-F09's "never touched the ceiling"
  wrong in both halves. Corrected with a dated ⚠ note under the original line; the original is left
  standing because that document is the R2-F09 record. (The note as first written this session had
  its own error — it claimed `legion` r2's ask was exactly 8 and that `cap` therefore never fired.
  Both halves are corrected.)
- **`QUEUE.md` #6j** gains the outcome and the `legion` finding; the "2329.25 → 2119.35" line in
  R2-F09's entry is annotated as a rank difference, not a cap difference.

---

## 7. Files changed

| file | change |
| --- | --- |
| `src/core/EvolutionCombat.ts` | `:137` `cap(this.summons, 8)` → `cap(this.summons, 10)` — **the only production line** |
| `src/core/formPressure.test.ts` | F09 identity: the cap test renamed to *"both casts land whole under the ten-slot cap…"*, totals 8/8 → **9/10**, guards 2/2 → **3/4**, ticks `[.12,.24]` → `[0,.12,.24]` and `[.24,.36]` → `[0,.12,.24,.36]`. F09 pressure: `summonsPeak` → `toBe(r1 ? 9 : 10)`; horde `H012_R_CLONE ?? 0` → `.toBe(0)` and `horde.r2.dealtBy` → `toEqual(horde.r1.dealtBy)`; elite comment restated; boss `H012_R_CLONE` `.toBeLessThan` → **`.toBe`**, ratio `1.349` → **`1.3611`**. F09 repost test renamed, totals 8/8 → **9/10**, `one.clones − two.clones` → `.toBe(0)`. File header's `beastlord` paragraph rewritten (`cap(…, N)`, 8 → 10). **F05's assertions were left alone — they are all relative (`toBeGreaterThan`), so 8 → 10 satisfies them unchanged.** |
| `src/core/evolutionCombat.test.ts` | `:77` `toHaveLength(8)` → `toHaveLength(10)` (the `S001` saturation arm) + comment |
| `src/core/elementalEvolution.test.ts` | `:106` `toHaveLength(8)` → `toHaveLength(10)` + comment |
| `tasks/game-remediation/evidence/R2-F09/IMPLEMENTATION.md` | dated ⚠ correction to the "first form to reach 8" claim |
| `tasks/game-remediation/evidence/R2-F-CAP/IMPLEMENTATION.md` | this document |

**No new dependency. No `_vXXOld*` wrapper. No other balance number touched.** `legacy` cannot reach
the line: `CombatSimulation:149` constructs `EvolutionCombat` only `if (progression.journey)`, and
`GameCore:67` sets that only for the `evolution` journey — classic, chapter and legacy runs never
build the object.

---

## 8. Gates

| gate | result |
| --- | --- |
| the eight report instruments @ cap 10 | **128 / 128 passed, 8 / 8 files** (1150s) |
| `formPressure` + `evolutionCombat` + `elementalEvolution` | **100 / 100 passed** |
| full suite `npm test` @ cap 10 | **43 files / 1442 tests passed** (1152s) |
| `npm run typecheck` | clean |
| single-switch counterfactual | the cap-8 re-run reproduced `853bafe4…` / `7a975e63…` / `afa9a752…` byte-for-byte |
| evidence tree after the full suite | md5-identical to the cap-10 snapshot — the instruments are deterministic |
| `npm run smoke` | `SMOKE OK` |
| `npm run audit` | `AUDIT OK` |
| `npm run context` | **8171 / 8192 bytes** — `CONTEXT OK` (21 bytes of headroom; both `TASK.md` and `STATE.md` were compressed to fit after the first attempt read 9922) |
| `npm run archive:verify` | `ARCHIVE VERIFY OK` (30/30 runnable HTML, 12 master docs) |
| `npm run check` | **cannot run in this session** — `spawnSync(process.execPath, …)` returns `EBUSY` for every file (the sandbox blocks `child_process`). Reproduced by hand: all **26** `index.html` script refs pass `node --check`, and the file has **26 `<script src=…>` tags with no inline script body and no `<style>` block**, so there is nothing the scripted check would have covered that the manual pass did not |
| Playwright | **never ran** (no output in this session, as in every prior slice) |

**No legacy JS file was touched**, so the `check` gate's subject matter is unchanged by this slice.

---

## 9. Write-back to the queue

- **#6j R2-F-CAP — done.** `cap` 8 → 10; copy verified correct; no target moved; `legion` reported as
  the cell outside `beastlord`.
- **New finding, not enqueued as a slice: `S001` shares the ceiling.** If a future kit ever summons
  more than 10 in one window, `summonsPeak` will stop growing silently. The pressure matrix's
  `summonsPeak` assertion for such a form must be written as a measured number (as R2-F09's was), not
  as `> 0`.
- **R2-F-SHADOW (#6k) is next** — the vortex pair, unchanged by this slice.

---

## 10. Coverage caveat (added by R2-F-HORDE-LEDGER, not by this slice)

Everything above is a **record of what this slice did**, and its `248` is correct *as of 2026-09-29
13:10*, when `cap10-md5.txt` was written. It is **not** a claim about today's tree.

The ledger drifted because the number `248` was never re-derived: it was a coverage claim in prose
whose backing list was hand-made. Eleven later slices added reports (six of them *rolling* - written
by a live harness on every run) and one report grew a schema field, and the ledger said nothing.
See `evidence/R2-F-HORDE-LEDGER/IMPLEMENTATION.md` for the full account.

The ledger now holds **261 lines** (the current `evidence/**/*.json` minus `test-results/` and
`.baseline/`), is regenerated by `node tasks/game-remediation/byte-ledger.mjs --write`, and is
enforced on every `npm test` by `apps/mobile-next/src/core/byteLedger.test.ts`. The four cap-8 →
cap-10 differences this slice found (`boss-report`, `manual-report`, `R2-F05/legion`, `R2-F09/beastlord`)
are unchanged and still correct.
