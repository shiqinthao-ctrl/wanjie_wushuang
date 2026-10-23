# R2-S01..12 — the twelve skill routes, one at a time

Base: R2-F-BOSS-COVERAGE (`instrument, zero production change`). Queue: `QUEUE.md` **#7**.
Harness: new `apps/mobile-next/src/core/skillRoutes.test.ts` (**11 `it`**), report
`evidence/R2-S01/route-report.json` (rolling — rewritten on every run).

---

## 0. One-line result

**All twelve `detail` promises hold as written — per shot, per jump, per body.** Every one is now
asserted against the container it actually produces (§2), so none of them can go quiet. Behind
those twelve, two **structural** findings that the `detail` text cannot express, both measured:

1. **`A011` has an evolution row (`E011`) and its route branch never reads `m.evo`**, while the
   un-routed branch does (`n = m.evo ? 3 : 1`). After evolution the baseline triples and the route
   does not, so **`volley` totals 65% and `nova` 48.3% of an un-routed A011** (§3.1). The per-shot
   ratio the text promises still holds; the route's *value* inverts.
2. **`skillModifier`'s evolution bonus `count++` has exactly one reader (`S001`).** `E013` buys
   **no extra jump** — measured `hits 2 → 2` — while `SE001` does buy a third body (`2 → 3`) (§3.2).

**Ruling (Scope 3, D19): assert what exists.** Zero production change; no edit to `skillRoutes`
and no edit to `EvolutionCombat.cast`. The two findings are pinned as assertions and in the rolling
report, not fixed here (TASK Out of scope).

---

## 1. Premise check (Scope 0) — counted, not trusted

The TASK said *do not trust the count in this file; count it*. Done:

| claim | measured (command) |
|---|---|
| "twelve routes" | `skillRoutes.length` → **12** (`expect(skillRoutes).toHaveLength(12)`) |
| "across five skills" | `new Set(skillRoutes.map(r => r.skill)).size` → **5** |
| per skill | `A011` 3 · `A026` 3 · `S001` 2 · `G2_FROST` 2 · `A013` 2 |
| the table and the branches both exist | yes — `EvolutionCombat.cast:177-199` names 9 of the 12 |
| **9 named, 3 by implicit `else`** | `nova` (`:183`), `roaming` (`:189`, via `follow=false`), `hunter` (`:192`) |

**The TASK's number is right.** What it did not say, and what matters for this slice, is that the
three implicit routes are reached by *falling through* — so their branch is also the branch that
runs when **no** route is picked. That asymmetry is what §3 measures.

---

## 2. Scope 1 — the twelve promises, driven and read

Each row is one cast of that route's skill, in a fresh simulation, with the route picked through
`RunEvolution.pick` (not by poking `routes`). `n` is the container count; `total` is the per-cast
output normalised by `atk`; `explode`/`radius` are the shipped numbers (`× m.range`, measured
**1.2544** on the fresh save).

| route | `detail` promise | measured | verdict |
|---|---|---|---|
| `volley` | 三道扇射，单发 65% | `n=3`, per-shot `.95×.65`, speed `390`, explode `58×r`, 3 angles `.23` apart | ✅ |
| `nova` | 速度降低、爆炸扩大、145% | `n=1`, `1.45×`, speed `260` (< 390), explode `110×r` (> 58) | ✅ |
| `ringfire` | 八方向、45%、爆炸缩小 | `n=8`, `.45×`, speed `300`, explode `28×r` (< 58), angles exactly `π/4` apart | ✅ |
| `roaming` | 向目标游走 | `follow=false`, velocity `85` aimed at `heroAim()` (due east for a due-east target: `vx=85, vy=0`) | ✅ |
| `orbit` | 围绕自身旋转 | `follow=true`; `CombatSimulation:491` re-places it on a **100**-unit circle around the player | ✅ |
| `ambush` | 固定、最多前置 220、80% | speed `0`; placed **on** the target at 160, capped at **220** at distance 1100; `r` ratio `110/82`; `dmg` ratio **0.8** | ✅ |
| `hunter` | 跟随、射影刃 | `guard=false`; body moves with the player and emits a `S001` projectile | ✅ |
| `guard` | 留守、范围斩击 | `guard=true`; body stays at its post and deals `S001` damage | ✅ |
| `glacier` | 驻留寒域、持续伤害+减速 | `field` at the player, `follow=false`, `chill=1.2`, `dmg=.18×atk`, **0 damage on the cast frame** | ✅ |
| `shatter` | 范围扩大、伤害与减速时间提高 | radius **200 vs 135** (a target 5 inside takes damage, 5 outside does not); `1.7 vs .9`; chill `2 vs 1.5` | ✅ |
| `relay` | 多跳两个、每跳 72% | `hits 2 → 4`; per-hit ratio vs un-routed **0.72** | ✅ |
| `thunderstrike` | 停跳、首目标周围 210% | `hits 2` (no chain); per-hit ratio vs un-routed **2.1** | ✅ |

Two of these are ratio assertions against **the un-routed baseline measured in the same context**
(`relay` 0.72, `thunderstrike` 2.1, `volley` 0.65, `nova` 1.45, `ringfire` 0.45, `ambush` 0.8),
which is the only way the word 「普通/原来的」 in the text can be checked: the baseline is a
production branch, not a constant.

---

## 3. The evolution axis — what the `detail` text cannot say

`m.evo` is **per skill**, not per journey: `combatMath:68` resolves it from `state.evolved[key]`,
and `TimedChests:55` writes that record **through the simulation itself** (`GameCore` passes
`this.combat` as `forms`). So `sim.evolved.E011 = true` is reachable in production: `A011` at Lv.5
+ `P026 ≥ 1` opens `E011` at a chest. Four of the five route skills have an evolution row —
**`G2_FROST` has none**, so `glacier`/`shatter` are unaffected by this axis.

### 3.1 `A011`: the route branch does not read `m.evo`, the baseline does

| state | un-routed A011 | `volley` | `nova` | `ringfire` |
|---|---|---|---|---|
| plain | 1 shot × .95 = **0.95** | 1.8525 (**1.95×**) | 1.3775 (**1.45×**) | 3.42 (**3.6×**) |
| `E011` evolved | 3 shots × .95 = **2.85** | 1.8525 (**0.65×**) | 1.3775 (**0.483×**) | 3.42 (**1.2×**) |

The legacy branch reads `m.evo` (`EvolutionCombat:377`, `n = m.evo ? 3 : 1`); the route branch
hard-codes `3 / 1 / 8` and reads neither `m.evo` nor `m.count`. **After the skill's own evolution,
picking `volley` or `nova` is worse than leaving `A011` un-routed** — and `volley`'s headline
promise (「三道扇射」) describes the evolved baseline exactly, so the route has no distinct identity
there. Per-shot ratios still hold, which is why this is invisible in the text.

### 3.2 `count++` has one reader

`skillModifier` grants `count++` when the skill is evolved (`combatMath:69`). Measured:

| skill | reads `m.count`? | evidence |
|---|---|---|
| `S001` | **yes** — `Math.min(6, 1 + m.count)` | bodies **2 → 3** with `SE001` |
| `A013` | **no** — computes `2 + P023 + bond` itself | hits **2 → 2** with `E013`; `dealt` still rises **1.55×**, so `m.dmg` lands and only the count is dropped |
| `A026` | no (a vortex is not counted) | radius **102.86 → 169.34** — it reads `m.evo` for size, so the axis works here |
| `A011` | no | the legacy branch hand-rolls `m.evo ? 3 : 1`; the route branch hard-codes |

So the evolution's fourth bonus is **live for one of the five route skills**. That is not a bug in
this slice's scope (no balance change allowed), but it is the mechanism behind §3.1 and it is now
asserted in both directions — the reader and the non-readers.

---

## 4. Scope 2 — exclusivity and boundary

| requirement | assertion | result |
|---|---|---|
| the second choice is never **offered** | after `pick('volley')`, `special(2, {A011:3})` is `[]` — not merely a rejected pick | ✅ |
| the offer moves on to the next skill | with `{A011:3, A026:3}`: offers `volley/nova/ringfire`; after a pick, offers `roaming/orbit/ambush` | ✅ |
| a route for an **unowned** skill is never offered | `{A013:3}` offers `relay/thunderstrike` only; `pick('volley')` is `false` | ✅ |
| the route survives **rank 1 → rank 2** | `pick('dragon')` then `pick('awaken')`: `routes` still `{A011:'nova'}`, `rank === 2` | ✅ |
| it survives the **level-19** awakening | see below | ✅ (with a caveat) |

**Caveat found while asserting it:** at the paced gate the awakening is offered at Lv.19 and it
**preempts** the route offer — `special(19, {A011:3})` returns `['awaken']` and
`pick(19, …, 'route', 'nova')` is `false`. A route cannot be picked at the same level the awakening
opens; it becomes available at Lv.20. That is a priority rule, not a loss: the route is still
pickable one level later and then survives rank 2 unchanged. Asserted as measured.

---

## 5. What was already covered (so this slice does not claim it)

| route | already asserted in | this slice adds |
|---|---|---|
| `ringfire` | `frostFlame.test.ts:75-85` (8 shots, 45%, `r=9`, split, spacing, exclusivity) | the blast-radius comparison and the `π/4` spacing read back from the container |
| `ambush` | `windShadow.test.ts:41-56` (r ratio, 80%, fixed, reach, world clamp) | aim direction and the 1100-distance cap case |
| `hunter`/`guard` | `evolutionCombat.test.ts:68-82` (post vs follow, delivery, cap 10, expiry) | structural body count and per-body damage |
| `glacier`/`shatter` | `elementalEvolution.test.ts:44-54` (field vs instant, exclusivity, expiry) | radius boundary **inside/outside**, chill duration, zero damage on the cast frame |
| `relay`/`thunderstrike` | `elementalEvolution.test.ts:62-70` (hit counts, ordering) | the **0.72** and **2.1** per-hit ratios against the un-routed baseline |
| `volley`/`nova` | `evolutionCombat.test.ts:34-41` (count, speed, explode ordering) | the **0.65 / 1.45** per-shot ratios and the fan spacing |
| `roaming`/`orbit` | `evolutionCombat.test.ts:42-49` (follow vs forward) | the aim vector and the **100**-unit orbit radius |
| **the evolution axis** | **nothing** | §3 — both findings |

Coverage per route is recorded in the report's `coverage` field, in the same object as the numbers.

---

## 6. Scope 3 — ruling (D19)

**Land the assertions; change nothing in production.** The twelve promises are now each asserted
against the container they produce, in a file whose failure mode is a named route (not "the suite is
red"). The two structural findings are asserted with their measured numbers rather than thresholds,
so a future change that moves them reports *which* one moved.

Not done here, and deliberately: the `A011` route branch could read `m.evo` (making `volley` 3 shots
at 65% of a 3-shot baseline is still a downgrade — the real fix is a design decision about what the
route should add after evolution), and `A013` could read `m.count`. Both are balance/design
changes; TASK Out of scope forbids them.

---

## 7. Gates

- `typecheck` (`vue-tsc --noEmit`): **clean**.
- `skillRoutes.test.ts`: **11 passed** (33 ms).
- `byteLedger.test.ts`: **5 passed** — the guard of the guard still holds with one more rolling report.
- `ledger:write` → **263 lines** (was 262); `ledger:verify` → **`LEDGER OK`**,
  `rolling writers = 28` (was 27), `missing 0 / stale 0 / moved 0 / extra 0`.
- `smoke` / `audit` / `context` (**7209 / 8192**) / `archive:verify` (**30/30 + 12**): OK.
- Full suite on the clean tree: **46 files / 1487 tests, all pass** (`EXIT=0`, 1654.73 s) =
  1475 baseline **+11** (`skillRoutes.test.ts`) **+1** (`treeHygiene.test.ts`).
- The **first** full run of this slice reported **1487 on a dirty tree**: it still contained
  `src/core/__probe_routes.test.ts` (untracked, 1 test, 69 lines). `+N` did not match the eleven
  `it` this slice added, which is the only signal that exists for that failure — the probe is
  deleted and the number above is the rerun. `treeHygiene.test.ts` (new) now fails on any file
  under `src/` whose name contains `probe` or that carries an inline probe marker, and it was
  shown to fail by planting `__probe_guardcheck.test.ts` before it was trusted.

---

## 8. Write-back to the queue

- **#7 R2-S01..12 — done.** Twelve routes asserted, zero production change, D19.
- **Open, from §3:** `A011`'s three routes are priced against an un-evolved baseline; `A013`
  ignores the evolution's `count++`. Both need a design decision (not a defect fix), and both are
  now visible in the report. Recorded so the next slice that touches evolution starts from the
  measured table, not from the `detail` text.
- **#8 R2-B01..08 is next** (eight bonds).
