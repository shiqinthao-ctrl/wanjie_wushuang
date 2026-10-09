# R2-F-BOSS-COVERAGE — no cell stages a Boss and a soldier at once

Base: R2-F-HORDE-LEDGER (`instrument + doc hygiene, zero production change`). Queue: `QUEUE.md` **#6w**.
Found in: `evidence/R2-F-BOSS-ADDS/IMPLEMENTATION.md` §3.1.
Harness: `apps/mobile-next/src/core/formPressure.test.ts`, block `R2-F-BOSS-COVERAGE` (appended at EOF).

---

## 0. One-line result

**The premise is true, and the gap is bigger than the queue's opening sentence — but the fix the
queue proposed does not work as specified, and that is this slice's finding.** The four pressure
cells never put a Boss and a soldier on the field together (measured, §1), while the shipped Boss
phase does so for **~95% of the encounter** (§2). Candidate B — a fifth cell built from **one**
`EN001` — does **not** stage that state: a single 98-HP body in reach of a kit firing fifteen casts
dies in **1–3 s** (§3). The cell that *does* stage it holds for the full 5400 frames, and it moves
the Boss reading the series is judged by by **+16.7% to −14.7%**, stably across ranks (§4).

**Ruling (Scope 3, D18): pin the gap with an instrument that makes it visible without moving a
balance number.** Zero production change, no `scenarios` key added — the ten shipped pressure
reports are **byte-identical** after this slice (`diff` on their ledger lines, §6).

---

## 1. Premise check (Scope 0) — all four cells counted, per form

The TASK said: *enumerate the pressure cells and, for each, report whether a Boss and at least one
soldier are simultaneously alive at any frame; count the `of cells` loop and the `NAMES`/`WINDOWS`
lists with a command.* Done:

| claim | measured (command) |
|---|---|
| the harness has **four** cells | `Object.keys(scenarios)` → `['horde','ranged','elite','boss']` |
| the `of cells` loop count | `grep -c 'of cells)'` → **62** (the TASK said to count, not trust) |
| `NAMES` is a list, and it is not the `scenarios` object | `NAMES` used at **9** sites (declaration + 8), `WINDOWS` at **5** |
| "three stage soldiers with no Boss, one stages a Boss with no soldiers" | **true**, and here is the number |

Coexistence, per cell, per form (rank 1; **identical at every form** — it is a property of the
scenario, not the kit):

| cell | window (frames) | `maxAdds` | `framesBoth` |
|---|---|---|---|
| `horde` | 600 | **12** | **0** |
| `ranged` | 600 | **6** | **0** |
| `elite` | 600 | **1** | **0** |
| `boss` | 5400 | **0** | **0** |

Two facts the cells were never asserted to have:

- The three soldier cells carry **12 / 6 / 1** bodies each and **no Boss** (`framesWithBoss = 0`
  everywhere).
- The `boss` cell carries **neither**: `scenarios.boss` returns `[]` and the director's own spawns
  are culled every frame by `run()`'s `keep` filter (`formPressure.test.ts:489`), so `maxAdds = 0`.
  It is a Boss **and nothing else** — and `R2-F-INST:3040` asserts exactly that ("nothing but the
  Boss lands here"), which is why `scenarios.boss` must not be edited (TASK Out of scope).

**So "a Boss and a soldier are never on the field together" is true of all four cells × all ten
forms = 40 cell-runs, and no assertion in the repo said so.**

---

## 2. The gap is a knob, not an absence (Scope 1)

The Boss cell reads clean because it *seeds nothing* and *culls everything*. Remove the cell's own
cull and the same geometry — player at `boss.x − 90`, a live Boss — carries the director's spawns:

| form | `framesBoth` | of 5400 | `firstAddAt` | `maxAdds` |
|---|---|---|---|---|
| bulwark / frostlord / frostflame / phoenix / legion | 5195 | 96.2% | 144 (2.4 s) | 6 |
| thunderlord | 5092 | 94.3% | 144 | 6 |
| void / reaper / beastlord / windwarden | 5206 | 96.4% | 144 | 6 |

**Every kit: ≥94% of the encounter has a Boss and at least one soldier alive together**, first add at
**2.4 s**, peak **six** bodies.

The knob is `bossPhaseSpawnInterval` — **a multiplier on the director's interval, not a switch**
(`CombatSimulation:341-342`): `interval = base * (bossActive ? threat.bossPhaseSpawnInterval[journey] : 1)`.
Read live off the model: `{ classic: 2, evolution: 3 }`. This is what "shipped-config" means: a real
Boss fight is *bracketed by adds throughout*, and every Boss number this harness reports is measured
in a fight where they are absent. **A fidelity gap, not a balance one.**

---

## 3. Candidate B priced (Scope 2) — and it does not work as specified

Candidate B (from `R2-F-BOSS-ADDS` §3.1): a fifth cell `boss-adds` = shipped boss geometry with
**standoff 110** and **one `EN001` at 100 px, reversed** (`offset = π`).

Measured: **the add dies.** A single `EN001` is **98.154 HP on the field** (the catalogue's `70`
scaled by difficulty — the number the catalogue lists is not the number that lands). A kit that
presses its skill **fifteen times in 90 s** does not leave one 98-HP body standing:

| form | add alive (frames) | seconds |
|---|---|---|
| thunderlord | 59 | 0.98 |
| bulwark / frostlord / frostflame | 63 | 1.05 |
| void / beastlord / windwarden | 99 | 1.65 |
| phoenix / legion | 119 | 1.98 |
| reaper | 173 | **2.88** |

**The longest-lived body is gone in 2.88 s of a 90 s encounter** — candidate B as specified stages
coexistence for **≤5.3%** of the window (max 173/5400), and for most kits **~1–2%**. A cell whose
stated purpose is to stage the shipped state would stage it for a two-second blip.

### The cell shape that *does* stage it

A body that **cannot be one-shot** (`hp = maxHp = 1e6`, immobile — the exact shape this harness
already uses for multi-body readings, e.g. `line()` / `dummy()` at `:347-349`) holds the field for
**all 5400 frames**: `framesBoth = 5400`, i.e. **100%** of the encounter. That is the shape the
queue's candidate B was reaching for; the body type is the missing half of the spec.

**This is the Scope-2 finding the TASK did not anticipate:** pricing candidate B item by item
reveals that its own geometry cannot deliver its own purpose. Landing the cell requires the spec to
say *"a body that survives the kit"*, not *"one `EN001`"*.

### Itemized candidate-B cost (if it were landed)

| item | cost |
|---|---|
| `R2-F-INST:3018` `WINDOWS` assertion | must gain a `boss-adds` key; `:3024` `toEqual` rewritten |
| `NAMES` sync | `NAMES` (8 use sites) and `scenarios` are **two independent lists** — both grow |
| the `of cells` loop | **62** sites re-evaluated (many are `toEqual([...])` on 4-length arrays) |
| ten shipped reports | schema changes ⇒ all ten invalidated; md5 rebuilt off the new keys |
| ten control arms | `matrix()` loops `NAMES`, so every form gains a fifth arm |

Not landed this slice (§5). The **cheaper** route to visibility, which is what landed, costs none of
the above.

---

## 4. The delta: what a body does to the Boss reading (Scope 2, decisive)

The body in reach does not merely sit there — it **changes `bossHpLost`**, the number the Boss cell
reports as the kit's contribution:

| form | off (no body) | on (durable body) | ratio |
|---|---|---|---|
| reaper | 7730.92 | 9019.17 | **1.1666** |
| bulwark | 9473.18 | 10954.36 | 1.1564 |
| frostlord | 13471.90 | 14953.08 | 1.1099 |
| thunderlord | 11379.84 | 12339.76 | 1.0844 |
| frostflame | 27813.32 | 29294.50 | 1.0533 |
| beastlord | 27762.59 | 29050.84 | 1.0464 |
| windwarden | 33165.65 | 34453.90 | 1.0388 |
| void | 34703.24 | 35991.49 | 1.0371 |
| legion | 37512.02 | 38873.58 | 1.0363 |
| **phoenix** | **73937.61** | **63064.23** | **0.8529** |

- **Direction is not uniform.** Eight kits read *higher* (a body in the ring lets more basic-attack
  hits connect — the aim/ring spread changes), one reads **15% lower** (`phoenix`: the extra body
  absorbs the ring's damage before it reaches the Boss).
- **It is stable across ranks**: r1 and r2 ratios are **identical for 7/10** forms and keep the same
  sign for the rest (e.g. `reaper` 1.1666 → 1.1190, `phoenix` 0.8529 → 0.8777).
- **It is not noise**: the spread is **+16.7% to −14.7%** on the reading the series is judged by.
  Every Boss number the ten reports carry is, by this measurement, off by up to a sixth in a
  direction that depends on the kit.

**This is the size of the fidelity gap**, and it is the reason the ruling is "pin it visibly" rather
than "leave it": a gap that moves the headline number by ±15% cannot be allowed to go quiet.

---

## 5. Ruling (Scope 3, D18)

Three options were on the table (TASK Scope 3): **land the cell**, **pin the gap with an instrument
that makes it visible without moving a balance number**, or **leave it with a priced option**.

**Chosen: pin it visibly. Zero production change, no `scenarios` key, ten reports byte-identical.**

Why not land candidate B:
- It does not work as specified (§3) — landing it would require first fixing its body type, which is
  a bigger change than "add a cell".
- Its itemized cost (§3) touches the `WINDOWS` assertion, both name lists, 62 loops, ten reports and
  ten control arms — for a cell that, unfixed, stages coexistence for 2% of the window.
- The TASK's own constraint — *"state coverage in the same breath as the numbers"* — is satisfied by
  asserting the coverage directly, which is cheaper and cannot regress.

Why not "leave it with a priced option": the option is priced (§3), but leaving it *unasserted* is
what let the gap exist through two slices. The instrument makes it permanent.

### What landed

`formPressure.test.ts`, block `R2-F-BOSS-COVERAGE` (EOF, 5 `it`, ~1.2 s):

1. **the four cells, counted** — `maxAdds` = 12/6/1/**0**, and `framesBoth = 0` for **all four**,
   per form. The assertion the harness never had.
2. **the gap is a knob** — ≥90% coexistence with the cull removed (measured 94.3–96.4%), first add
   at 2.4 s, peak 6; the knob `{classic:2, evolution:3}` read live off `sim.threat`.
3. **candidate B does not stage the state** — the body is 98.154 HP, dies in <5 s (measured ≤2.88 s),
   coexistence for <5% of the window.
4. **a durable body holds the whole window and moves the reading** — `framesBoth = 5400`; the ratio
   spread is >1.1 on the high side and <0.9 on the low; `phoenix` loses.
5. **writes the coverage report** — `boss-coverage-report.json` (rolling), so the gap cannot go
   quiet: the report records the coexistence table, the knob, the candidate-B verdict and the delta.

Appended at **EOF**, so **no line above moves** (`manualDamage.test.ts` cites four of them by line);
no `scenarios` key is added, so **the ten shipped reports stay bit-for-bit**.

---

## 6. Files changed

- `apps/mobile-next/src/core/formPressure.test.ts` — `+243` lines, one `describe` at EOF, 5 `it`.
  **No existing line moved.**
- `tasks/game-remediation/evidence/R2-F-BOSS-COVERAGE/boss-coverage-report.json` — **new** (rolling,
  rewritten on every run of this block).
- `tasks/game-remediation/evidence/R2-F-CAP/cap10-md5.txt` — **262** lines (261 → 262: the new
  rolling report; the ten shipped pressure reports are byte-identical, verified by `diff`).
- `DECISIONS.md` **D18**; `QUEUE.md` #6w done / #7 next; `TASK.md` repointed; `STATE.md` fields;
  `handoff/WORKSHOP-BRIEF.md` §0/§2/§4/§5/§6/§7a; `MEMORY.md` + daily log.

**Zero production change.** No file under `src/**` other than the test file.

---

## 7. Why the gate lives in vitest

Same reasoning as `R2-F-HORDE-LEDGER` (§7 there): the root `npm test` chain audits the **legacy root
tree** (`assets/js/**` + `index.html`), while this assertion guards the **mobile harness**. Its gate
is the vitest file that carries it — `formPressure.test.ts` runs on every `npm test` in
`apps/mobile-next`, so the coexistence assertion runs with it.

---

## 8. Acceptance

- Coexistence counted for all four cells: **`framesBoth = 0`** everywhere, asserted.
- The knob shown, not "untested": **≥94%** of a shipped-config encounter carries adds, asserted.
- Candidate B priced item by item, and found **not to stage its own purpose** — asserted via the
  body's measured lifetime (`< 5 s`).
- The delta measured: **+16.7% / −14.7%**, both signs asserted, `phoenix`'s loss asserted.
- The gap is asserted where it cannot go quiet: the block runs on every `npm test`, and the report
  is on disk.
- **Zero production change**; **no `scenarios` key added**; the ten shipped reports are
  byte-identical (§6).
- Full suite: green; see §9.

---

## 9. Gate numbers

- `typecheck` (`vue-tsc --noEmit`): **clean**.
- `formPressure.test.ts`: **89 passed** (was 84; `+5` = this block), **21.08 s**.
- Full suite: **44 files / 1475 tests green** (EXIT=0, **1625.57 s**); `1475 − 1470 = +5` = this
  block's five `it`. (The first run reported 1476 — see §9.1; the clean-tree run is authoritative.)
- `ledger:verify`: **`LEDGER OK`** — 262/262, `missing 0 / stale 0 / moved 0 / extra 0`;
  **rolling writers = 27**.
- `smoke` / `audit` / `archive:verify`: **OK** (`SMOKE OK`; `AUDIT OK` 7 modes/30 gear/20 runes/
  5 pets/20 talents; `ARCHIVE VERIFY OK` 30/30 + 12).
- `context`: **7105 / 8192 bytes**.

### 9.1 Two instrument findings on the way out (both fixed, neither shipped)

1. **Probe residue ran in the first full suite.** `formPressure.test.ts` still carried a
   `describe('PROBE3 add survivability')` block and the slice directory still carried
   `survivability.json` when the first full run started, so that run reported **1476** tests
   (`+6`) instead of the slice's true **`+5`**. The residue was removed (file back to no probes;
   the slice directory left holding only `IMPLEMENTATION.md` and `boss-coverage-report.json`;
   `survivability.json` is **not** in the slice — its numbers live in `it3` and in §2 here), and
   the full suite was re-run on the clean tree. **The `+N` disagreeing with the slice's own new
   `it` count is the signal to look for a probe, not to edit the docs to match.**
2. **The ledger classified this slice's report as FROZEN at first.** `byte-ledger.mjs` derives its
   rolling set by scanning for the literal shape `writeFileSync(resolve(<dir>, '<name>'))`. The
   first write here used an aliased import (`{ writeFileSync: write }`) with a pre-bound path, and
   a three-argument `resolve(...ROOT, 'DIR', 'x.json')`; none matches, so
   `boss-coverage-report.json` read as FROZEN — a legitimate rewrite would then have reported as
   `MOVED (frozen: finding)`. It now uses the file's own established shape (`const dir =
   resolve(EVIDENCE_ROOT, 'R2-F-BOSS-COVERAGE')` then `writeFileSync(resolve(dir, '…'))`), and
   `ledger:coverage` reports **27 rolling** with the file named. The scanner also reads **comments**,
   so writing the call shape into prose conjures phantom report names (`<name>`, `name.json`) — the
   coverage command's name list, not its count alone, is the check.

---

## 10. Write-back to the queue

- **#6w R2-F-BOSS-COVERAGE — done.** Gap asserted, zero production change, D18.
- **Open, from this slice's §3:** candidate B needs its body type fixed before it can be landed
  ("one `EN001`" → "one body the kit cannot one-shot"). Not enqueued as a slice; recorded here so a
  future slice that lands the fifth cell starts from the measured body lifetime, not the queue's
  literal spec.
- **#7 R2-S01..12 is next.**
