# R2-F-INST — the boss cell must measure a Boss that acts

Base: R2-F10. Queue: `tasks/game-remediation/QUEUE.md` #6i. Roadmap: `ROADMAP.md`.

This is an **instrument** slice. No production file changed: not `bossHp`, not `bossCastCooldown`,
not `bossSkillDamage`, not `bossContactDamage`, not `enemyDamage`, not `cap()`, not `fixedVortex`.
What changed is what the harness can see.

---

## 0. Scope 0 — premise verification

TASK.md's premises were read against the code, line by line.

| Premise (as written in TASK.md / as inherited from R2-F08) | Verdict |
| --- | --- |
| "its first cast is `1.7 * bossCastCooldown` = 24.33s away" | ✅ `FirstBoss.ts:41` `castCd: 1.7 * this.castCdScale`, `:67` `castCdScale = sim.threat?.bossCastCooldown ?? 1`, `threatV2.json:14` = **14.31** ⇒ **24.327s** |
| "the window is `FRAMES = 600` — ten seconds" | ✅ `formPressure.test.ts:123`; the Boss is spawned at `sim.time = 270` inside `scenarios.boss`, so the cell starts at the Boss's t=0 |
| "`bossCasts = 0` in all ten" | ✅ measured, and it was the *only* value the field ever took |
| "the Boss is spawned fresh at `sim.time = 270`" | ✅ `scenarios.boss` sets `sim.time = 270` then calls `sim.bossEncounter.updateObjective()`; `spawn()`'s gate is `sim.time < firstStage.bossAt` (`:34`), and `firstStage.bossAt = 270` |
| **"does `updateAI` run on a fresh Boss at all?"** | ✅ **yes, every frame.** `CombatSimulation:346` calls `bossEncounter.updateAI(dt)` unconditionally from `beginFrame`; the only guard inside is `if (!boss || this.destroyed) return` (`:69`). So the Boss decrements `castCd`/`castLock`, walks toward the player when `distance > 155` (`:96`) and applies body contact (`:103`) — it just never reaches `castCd <= 0` |
| **"which field gates the first cast?"** | `boss.castCd`, tested at `:104` (`if (boss.castCd > 0 || boss.castLock > 0) return`). Its initial value is set once, in `spawn()` |
| **"what else does the same constant suppress?"** | ⚠️ **`castCdScale` is read at three sites, not one**: `:41` (opening cast, 1.7×), `:80` (each phase change, 1.2×) and `:124` (after every cast, `max(.9, (3 − phase·.38)/speed)×`). So 14.31 slows **every fresh cooldown**, which is why a whole 90s encounter contains **two** casts rather than two hundred. It also means the *phase-change* reset (17.17s) is a third cadence the cell can reach — and in the harness only `phoenix`/r2 does (§5.4) |
| **"what is the browser robot's Boss experience?"** | ⚠️ **not ten seconds.** `tests/settlement.spec.ts` plays the real stage with a `620_000` ms deadline (`:104`) against a 360s stage whose Boss appears at 270s — so the robot's Boss fight is the stage's own **90s**, it presses `e`/`r`/`f` every step, and since R1g-11 it also reads `首领招式` and presses 闪避/Space inside a 1.5s window (`:99/132-146`). The cell's 10s window was never the robot's situation |
| `bossCastCooldown` and `bossSkillDamage` are two knobs | ⚠️ **they hold the same number, 14.31, by design**: `skillScale = bossDamage × bossSkillDamage = 0.6 × 14.31 = 8.586`, so R1g-10's trade is "per-move damage ×8.586, cadence ÷14.31" — net Boss skill DPS ×0.6 (the `bossDamage` term), single-move legibility ×8.586. The cadence knob is the *legibility* half, and its side effect is that the encounter is 2 casts long |
| the other three cells are "snapshots" | ❌ **not all of them.** Measured at 600 vs 5400 frames: `elite` is identical for all ten forms, `horde` for nine, but `ranged` **differs for six** (§3) |

No premise was false in the sense R1g-8 meant (a rule that does not exist). The premise that *was*
wrong is the one the slice is named after: the cell's 10s window was never a property of the Boss.

---

## 1. The instrument change

Two edits, both in `src/core/formPressure.test.ts`, no production file touched.

1. **A per-scenario window.** `BOSS_FRAMES = Math.round((firstStage.duration − firstStage.bossAt)/DT)`
   = `(360 − 270) × 60` = **5400 frames = 90s**, and
   `WINDOWS = { horde: FRAMES, ranged: FRAMES, elite: FRAMES, boss: BOSS_FRAMES }`.
   `matrix()` now runs each scenario at its own window and records `windows` in the report;
   `frames` stays 600 and keeps its meaning as *the default*.
   The window is **read off the stage config, not chosen**: it is the interval in which the Boss is
   on the field, so it is the interval in which the Boss can act.
2. **A declared second arm for the boss cell.** `matrix()` now also runs the boss cell with
   `{ ...opts, dodge: true }` — R2-F08's switch, the robot's own reactive dodge rule — and records it
   as `bossDodged`. It exists for **every** form, not only the one whose kit contains a dodge,
   because the question it answers is what the Boss costs a player who reads the HUD. The switch was
   *unreachable* before this slice, which is why R2-F08 had to declare a hand-picked 30s window to
   reach it at all; R2-F08's `DODGE_FRAMES` is now `BOSS_FRAMES`, so its arm and the report's cell
   are on the same clock.

**Why the window and not a pre-warmed `castCd`.** Pre-warming the Boss's clock is synthetic: it
invents a Boss that has already been alive for 24s at the moment the cell starts, which is a state
the shipped game never produces, and it would leave the cell's *end* arbitrary. Extending the window
is what the browser robot actually does — it stands in front of the Boss for the stage's whole 90s.
The two candidates are not symmetric: one is the robot's situation and the other is a fabrication,
and TASK.md asked for the former.

**Cost.** The suite went from 1.33s to ~7.4s of test time for the whole file (ten `matrix()` calls,
each now 6×600 + 2×5400 + 2×5400 frames instead of 8×600).

---

## 2. What the cell now reads

`r1` at both windows, for all ten forms. `bossHp` in this harness is **452,115.7** (the *evolution*
budget, `threatV2.json:8` × `firstBoss.json` 7000 × the growth term), so the Boss survives the window
in every cell and is never killed — the cell measures a full encounter, not a kill.

| form | `bossHpLost` 10s → 90s | `taken` 10s → 90s | `hpMin` 10s → 90s | r2/r1 `kitDealt` 10s → 90s | `died` |
| --- | --- | --- | --- | --- | --- |
| bulwark | 6,710 → **30,606** | 0 → **69.41** | 1.0000 → **0.9090** | 1.0000 → **1.6359** | false |
| frostlord | 2,454 → **18,754** | 0 → **235.86** | 1.0000 → **0.6908** | 1.1496 → **1.1837** | false |
| frostflame | 4,763 → **38,752** | 0 → **235.86** | 1.0000 → **0.6908** | 1.1377 → **1.1577** | false |
| phoenix | 13,240 → **104,573** | 32.69 → **513.60** | 0.9363 → **0.0000** | 1.5925 → **1.4253** | **true** |
| legion | 22,808 → **92,359** | 0 → **280.48** | 1.0000 → **0.4539** | 1.2465 → **1.4217** | false |
| thunderlord | 2,912 → **16,367** | 0 → **280.48** | 1.0000 → **0.4539** | 1.0000 → **1.0000** | false |
| void | 15,104 → **56,928** | 0 → **280.48** | 1.0000 → **0.4562** | 1.1323 → **1.0772** | false |
| reaper | 13,565 → **35,108** | 32.69 → **514.78** | 0.9366 → **0.0019** | 1.2157 → **1.2419** | false |
| beastlord | 17,621 → **73,432** | 0 → **280.48** | 1.0000 → **0.4562** | 1.0319 → **1.3490** | false |
| windwarden | 14,367 → **53,211** | 0 → **280.48** | 1.0000 → **0.4562** | 1.1445 → **1.1369** | false |

`bossCasts` is **2** in every one of the ten boss cells, at **24.33s** and **61.83s** (the second gap
is `max(.9, (3 − 1·.38)/1) × 14.31 = 37.49s`), and **0** in the other thirty cells.

The Boss's own behaviour is therefore a **constant of the cell**, not a variable: the same two cues
(`蛮王冲锋 · 横向闪避`, then `旋风断军 · 绕至侧后`) at the same two times for all ten kits. The only
reason the `taken` column splits into three values is the *player's* defence — 280.48 for the H010
and H012 kits, 235.86 for H001, 69.41 for bulwark whose shield eats the rest.

### The dodge arm (`bossDodged`, r1, 90s)

| form | `taken` | `hpMin` | what still lands |
| --- | --- | --- | --- |
| bulwark | 38.19 | 0.9499 | cone only (and rank 2 eats even that: `taken = 0`, `hpMin = 1`) |
| frostlord / frostflame | 121.41 | 0.8409 | cone |
| legion / thunderlord / void / beastlord / windwarden | 144.38 | 0.7189–0.7200 | cone |
| phoenix / reaper | 147.11 | 0.7136 / 0.7148 | **body contact**, both casts avoided |

---

## 3. Scope 4 — the other three cells

TASK.md asked whether any other scenario silently depends on the same ten-second window. It was
measured rather than argued: each of `horde` / `ranged` / `elite` was run at 600 and at 5400 frames
for all ten forms, and the cells' *answers* (`dealt`, `kitDealt`, `taken`, `hpMin`, `killed/of`)
compared.

- **`elite` — no.** Identical at both windows for all ten forms. It is a genuine snapshot: one
  `EN006` that dies to the first clone shot / the skill+ultimate.
- **`horde` — nine of ten.** The ring dies on the first field tick and the cell is over. The
  exception is `legion`, whose `dealt` rises 2,395.65 → 2,590.56: its clones keep shooting bodies the
  director spawns and that `run()` culls at the end of the same frame, so a kit with persistent
  summons accumulates damage against bodies the cell then deletes. Recorded; not a conclusion that
  changes (the ring is cleared either way, `taken` is unchanged at 56.04).
- **`ranged` — six of ten, and this is the real one.** The cell is not a snapshot but a *sustained
  exchange*, so its `taken` is a **ten-second sample of a rate**, not a total:

  | form | `taken` @600 | @1800 | @5400 | `hpMin` @600 → @5400 |
  | --- | --- | --- | --- | --- |
  | bulwark | 0 | 203.17 | **731.70** | 1 → **0.0409** |
  | frostlord | 164.95 | 618.55 | **762.91** | 0.7838 → **0** (dies) |
  | beastlord | 196.15 | 515.74 | 515.74 | 0.6197 → **0** (dies) |
  | void | 171.63 | 424.99 | 441.34 | 0.6674 → 0.1448 |
  | reaper | 147.11 | 400.48 | 400.48 | 0.7155 → 0.2263 |

  (measured on the **default** arm — no `ult` grant, so these are the F01–F04 report arms and a
  default-arm probe for F05–F10, not the shipped `ult: true` arms.)

  **No conclusion in any `IMPLEMENTATION.md` changes**, because every ranged-cell claim the series
  makes is either a reachability claim (can the kit touch a 520px line at all) or a *relative* claim
  ("the kit cuts the cost") on the same sample. But the sampling is now asserted in the suite rather
  than left implicit: the R2-F-INST block measures that the ranged cell's answer *does* move with the
  window while the elite cell's does not.

**Decision: the other three cells keep `FRAMES`.** The boss cell's window is the encounter because
its subject has a schedule; the horde/elite cells are snapshots that complete inside ten seconds; the
ranged cell's question is answered by a sample, and lengthening it would turn a reachability reading
into a survival reading the cell was never designed to make. The finding is recorded, and the
assertion that makes it falsifiable is in the suite.

---

## 4. The single-switch result

The instrument change is one switch, so the check is the same shape as every other slice's: **what
moved, and what did not.**

All ten reports were snapshotted to `R2-F-INST/.baseline/` before the edit and compared cell by cell
after:

| report | `horde` | `ranged` | `elite` | `boss` | top-level keys |
| --- | --- | --- | --- | --- | --- |
| R2-F01 … R2-F10 (all ten) | **identical** | **identical** | **identical** | **CHANGED** | `windows`, `bossDodged` added; none dropped |

So the revision moves exactly the cell it was aimed at. The `horde`/`ranged`/`elite` sub-objects are
byte-identical in all ten reports — not "close", identical — which is what makes the boss-cell deltas
attributable to the window and to nothing else.

md5, before → after, per directory (these files are rewritten on every run, so the numbers belong to
the run that produced them):

| dir | before | after |
| --- | --- | --- |
| `R2-F01/form-pressure.json` | `ade446395c3a3012b1ee5502d54e77f5` | `90970aa1bc224ff0877b2e06f923cb33` |
| `R2-F02/frost-pressure.json` | `443166ff4694adf333da8ca5733c715c` | `13ee6c6b5cb61fadcb5e89c95db56dac` |
| `R2-F03/frostflame-pressure.json` | `85605480fef86c8bcfc9df5d47dd0174` | `d3f69397823de6b46ca5344b66800042` |
| `R2-F04/phoenix-pressure.json` | `da5de5673c0f775719564dcea6570ecb` | `b42c8986b8239f6f75c0184d636ea54b` |
| `R2-F05/legion-pressure.json` | `888e9f2b07c853d42315e00ee89d7dc2` | `853bafe4340c5033e1b42ccb885c1af8` |
| `R2-F06/thunderlord-pressure.json` | `37a25a9ac1968b122a981aa9843932ef` | `2aa0498dbebba7c3258c7aa21513c728` |
| `R2-F07/void-pressure.json` | `b1308fa4d172427e4350c66b9f066345` | `50517300cd6e24ac0b2347e660e85354` |
| `R2-F08/reaper-pressure.json` | `c3d1119f44cafc202005b5fa820e55f6` | `4086c91edb9cf756434ddb0f2ab4c96e` |
| `R2-F09/beastlord-pressure.json` | `cba69b082c4799e53983134daa140694` | `7a975e633db23a56c44731a89cd6da86` |
| `R2-F10/windwarden-pressure.json` | `6b817009de4b030bb4c55c32374ab3ce` | `885f1a52184b952a3a814741d349e460` |

The baseline copies live in `R2-F-INST/.baseline/` so the comparison can be re-run; they are
snapshots, not rolling artefacts, and must not be refreshed.

---

## 5. Findings

1. **The boss cell was a blindfold, and the number that hid it was `bossCasts = 0`.** Not "the Boss
   is harmless" — the Boss was never asked. Ten slices' worth of "the kit costs X against the Boss"
   were claims about a stationary target that only took damage. Restated: the Boss's two casts are
   **280.48 of incoming for eight of the ten kits** (235.86 for the H001 kits, 69.41 leaked through
   bulwark's shield) out of a 513.6 / 762.9 bar.
2. **The 10s window also under-reported the awakening, by an order of magnitude in one case.**
   `beastlord`'s rank-2 awakening read **+3.19%** on the old window because that window contained
   exactly *one* skill cast, so the guard-life difference (6s vs 8s) had nothing to compound. Over
   the encounter's fifteen casts the same awakening is worth **+34.90%** (73,432 → 99,063).
   `windwarden`'s barely moves (1.1445 → 1.1369) because its two gains are per-cast.
3. **The encounter window is where the dash forms' cost becomes visible.** `phoenix` **dies at
   88.92s** (`hpMin = 0`, both ranks) — the old cell read a comfortable 0.9363. `reaper` survives
   with **1.5 HP** (`hpMin = 0.0019`), where the old cell read 0.9366. Both are body contact:
   233.12 / 234.29 of the 513.60 / 514.78 total, i.e. the dash parks the player inside the Boss's
   61px body radius and it grinds. This is R2-F04 §5.4's finding, now with the size of the bill.
4. **Bulwark's awakening is a survival reading against the Boss, and only the long window shows it.**
   Rank 1's shield eats 244.13 of the two casts and leaks 69.41; rank 2's raised cap eats **both
   whole** (`taken = 0`, `hpMin = 1`). `absorbed` rises 244.13 → 345.93. On the old window the cell
   read `taken = 0` at both ranks, so this rank difference was invisible.
5. **The robot's dodge rule defeats the charge in every one of the ten kits, and never the cone.**
   `bossDodged` r1 has `takenBy['B001-蛮王冲锋'] === 0` for all ten (asserted), while the cone lands
   for eight; the two exceptions are the dash forms, which dodge out of the cone and pay body contact
   instead. So the cell now separates the two halves of the Boss's kit for the first time: the charge
   is answerable by the shipped reaction, the cone is not.
6. **The phase-2 branch is reachable in the cell, for one form.** `phoenix`/r2 crosses the 70% line
   at **82.25s** (its `hpFracMin` is 0.6703), which resets `castCd` to `1.2 × 14.31 = 17.17s`; that
   reset lands past the end of the window, so the cast count stays 2. Every other cell stays at
   phase 1. Recorded because it means the `:80` cooldown is not dead code in this harness.
7. **The other three cells: only `ranged` depends on the window** (§3). The elite cell is a true
   snapshot; the horde cell is one for nine forms; the ranged cell's `taken` is a sample and is now
   asserted as one.
8. **The Boss's behaviour is a constant of the cell, so the cell's variation is entirely the kit.**
   Same two cues, same two times, for all ten forms — which is what makes the `taken` column a
   reading of the player's defence and the `dealt` column a reading of the kit.

---

## 6. Documentation reconciliation

Every doc that quoted a boss-cell number from the ten-second window had to be re-read. What changed
and what did not:

- **Not changed (they are historical records of their own slice's run):** each
  `evidence/R2-F0*/IMPLEMENTATION.md` §"eight cells" table and its quoted boss numbers, and the
  per-form comments that were *restated in place* in `formPressure.test.ts` with the reason. A
  history of what the old instrument read is the thing that makes this slice legible.
- **Changed (they are current values):** the six `taken + absorbed === 0` assertions in the test
  file became measurements of the two casts; `R2-F08`'s `kitDealt` ratio 1.2157 → **1.2419**;
  `R2-F09`'s 1.0319 → **1.349**; `R2-F10`'s 1.1445 → **1.1369**; `R2-F09`/`R2-F10`'s
  `bossCasts === 0` became `2` for the boss cell and stayed `0` for the other three.
- **`handoff/WORKSHOP-BRIEF.md`** carries a "current" section that is not inside the active context
  bundle and is therefore never checked by the `context` gate; it is updated in this slice.

---

## 7. Files changed

| file | change |
| --- | --- |
| `apps/mobile-next/src/core/formPressure.test.ts` | `BOSS_FRAMES` + `WINDOWS`, per-scenario window in `matrix()`, `bossDodged` arm, header §"The window", six restated boss assertions, `R2-F08`'s `DODGE_FRAMES` folded into `BOSS_FRAMES`, new `R2-F-INST` acceptance block (4 tests). **66 → 70 tests** |
| `tasks/game-remediation/evidence/R2-F01…F10/*.json` | rewritten by the run (rolling artefacts) |
| `tasks/game-remediation/evidence/R2-F-INST/.baseline/*.json` | the ten pre-change reports, frozen for the comparison in §4 |
| `tasks/game-remediation/evidence/R2-F-INST/IMPLEMENTATION.md` | this file |

**No production file changed.** `git status` on `apps/mobile-next/src` shows only
`src/core/formPressure.test.ts` touched by this slice.

---

## 8. Gates

| gate | result |
| --- | --- |
| `formPressure` | **70/70 green** (66 + 4) |
| full `vitest` | **43 files / 1442 tests green** (1184s). `formPressure` 66 → 70; the previous slice recorded **1431** for the same 43 files, and the 7-test difference is in files this slice did not touch - recorded rather than smoothed over |
| `vue-tsc --noEmit` | clean |
| `check` | manual equivalent (26 JS + 1 CSS, no inline) — `child_process` is blocked in this session |
| `smoke` / `audit` / `context` / `archive:verify` | see `handoff/STATE.md` |
| `legacy` byte-identical | no production file touched |
| Playwright | not runnable in this session (probe silent for 8–10 min); the browser robot was read, not executed |

---

## 9. Write-back to the queue

1. **#6i `R2-F-INST` — done by this slice.** Remove from the queue.
2. **New: `R2-F-CADENCE` (design question, not a defect).** The shipped `bossCastCooldown = 14.31`
   makes the *whole* 90s encounter contain **two** casts, so a player sees `蛮王冲锋` once and
   `旋风断军` once, and **never sees `震地斩`** (the circle move needs a third cast, i.e. >99s). The
   dodge button therefore has two opportunities per boss fight. That is a legible-by-design trade
   (R1g-10 raised per-move damage ×8.586 and divided cadence by 14.31), but "how many dodge
   opportunities should a boss fight contain" has never been asked. Route to the design owner before
   any balance change; the harness can now measure it directly.
3. **New: `R2-F-CIRCLE` (cell coverage, low priority).** At the cell's 90px standoff the circle move
   (`r = 70` at phase 1, centred on the player at cast time) is **out of range by construction** —
   90 > 70 — and it is also the move that needs the third cast. So the boss cell cannot measure the
   circle move at any window length. If that move's readability matters (G4 names the *weakest*
   move), it needs a cell that stands inside 70px, which is inside the 61px body radius and would
   therefore also measure contact. Note it as a coverage gap; do not "fix" it by moving the standoff.
4. **`R2-F-SHADOW` and `R2-F-CAP` unchanged** — both are balance decisions and both are still open.
5. **`R2-F-SUFFIX` unchanged** — analysis-layer only.
6. **Note for whoever re-runs the rolling reports:** the ten pressure reports are now written at
   `boss: 5400` frames, so any doc quoting a boss-cell `taken`/`hpMin`/`kitDealt` from before
   R2-F-INST is quoting the ten-second sample. The `windows` key in each report is the marker.
