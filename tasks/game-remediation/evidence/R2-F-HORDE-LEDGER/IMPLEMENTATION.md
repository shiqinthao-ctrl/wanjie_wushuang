# R2-F-HORDE-LEDGER — the byte ledger checked four reports where the directory holds eleven

Base: R2-F-HORDE-BAND (`instrument, zero production change`). Queue: `QUEUE.md` **#6v**.
Harness: `apps/mobile-next/src/core/byteLedger.test.ts` (new) + `tasks/game-remediation/byte-ledger.mjs` (new).

---

## 0. One-line result

**The queue's diagnosis was right about the symptom and wrong about the size.** The ledger did not
miss five reports in one directory - it missed **thirteen reports across the whole tree**, and the
stale line the queue named was not a finding but a **legitimate refresh of a rolling report whose
schema had grown**. The fix is not a corrected number; it is a **generator** (`byte-ledger.mjs`) plus
a **gate** (`byteLedger.test.ts`) so that "the ledger covers the tree" is now a command that runs on
every `npm test`, not a sentence in a markdown file that nobody re-derives.

Ledger: **248 → 261 lines**. Of the 248 historical lines, **247 are byte-identical, 1 is refreshed,
0 removed**; 13 are added.

---

## 1. Premise check (Scope 0) — three of four claims were right, one was wrong

| queue claim | verdict | measured |
|---|---|---|
| `evidence/R1g-12/` holds **eleven** rolling `.json`, not six | ✅ **true** | `ls R1g-12/*.json` → **11**; `find R1g-12 -name '*.json'` → **11** (no subdirectories) |
| the older ledgers named **four** of them | ⚠️ **half true** | the two evidence pages (R2-F-CADENCE §6.1, R2-F-CIRCLE §6.1) each checked **four** by hand; but the **ledger file itself** (`cap10-md5.txt`) already listed **all 11**. The hand-copy was in the *prose*, not the file. |
| the one-line mismatch is `manual-report.json` alone | ✅ **true** | recomputed 248 lines: `same 247 / diff 1`, the diff is `R1g-12/manual-report.json` |
| the cause is "a hand-copied list" | ✅ **true**, but larger | see §2 - the hand-copied list was not only of R1g-12's reports; it was of **the whole tree**, and it stopped being re-derived the day it was written |

**The count that matters was never the R1g-12 one.** Walking `evidence/` shows the tree holds **261**
`*.json` (excluding `test-results/` and `.baseline/`), and the ledger lists **248** - so **13 files
are absent from the ledger entirely**.

---

## 2. What the ledger is a ledger *of* (Scope 1)

`cap10-md5.txt` was produced once, on **2026-09-29 13:10**, by
`find -print0 | xargs -0 md5sum | sort -k2` (recorded in `R2-F-SHADOW` §6.1). Every slice since has
re-verified it by **re-hashing the 248 listed paths** - a check that cannot see a file the list does
not name. That is the whole defect: **the verification was over the list, not over the tree.**

To fix it, each file must be classified. There are exactly two kinds:

- **ROLLING** — a harness in `apps/mobile-next/src/**` writes it on every run, so its hash
  legitimately moves. A hash change is a refresh.
- **FROZEN** — nothing writes it (a probe archive, a `.bak` snapshot, a data file). A hash change is
  **a finding about a slice that changed it**.

The classification is **derived, not inspected**: grep the harness sources for
`writeFileSync(resolve(<dir>, '<name>'))`. That yields **26 rolling reports** (16 direct writer sites
+ the 10 `*-pressure.json` written through `formPressure.test.ts`'s `spec.evidence`/`spec.report`
loop). Today's tree:

| kind | count | members |
|---|---|---|
| ROLLING | **26** | the 10 `*-pressure.json`; `threat-report`, `boss-report`, `manual-report`, `growth-report`, `fusion-report`, `cadence-report`, `boss-threat-report`, `boss-cadence-report`, `boss-hud-arms`, `boss-hud-report`, `cadence-sweep`, `circle-report`, `g4rows-report`, `bossphase-report`, `boss-adds-report`, `horde-report` |
| FROZEN | 235 | everything else - including `R2-F-CAP/manual-cap{8,10}.json`, the `probe-{ids,hazard}.json` archives, and `manual-report.pre-suffix.json` |

---

## 3. The `manual-report.json` decision (Scope 3) — rolling, refresh, **not** a finding

### 3.1 It is rolling

mtime `2026-10-08 19:24:59` - rewritten by the full suite this slice's predecessor ran.
Writer: `manualDamage.test.ts:1151`. No ambiguity.

### 3.2 The stale hash is a schema growth, proven three ways

The ledger's line is `8246b726fbfd70dcadebd1b0595bce97`. Three facts pin what that number is:

```
ledger baseline                              = 8246b726fbfd70dcadebd1b0595bce97
R2-F-SUFFIX/manual-report.pre-suffix.json    = 8246b726fbfd70dcadebd1b0595bce97   <- byte-identical
  (i.e. the ledger line is a PLAIN md5 of the report as it stood BEFORE R2-F-SUFFIX)
current file                                 = 9c71d8836995ee06eda32af1586b6bba
current, new keys stripped, sort_keys=True   = 1f4bfd3c320a7e9495ddcd6007c49a79
R2-F-SUFFIX's own recorded de-keyed rebuild  = 1f4bfd3c320a7e9495ddcd6007c49a79   <- reproduced exactly
```

`R2-F-SUFFIX` added exactly three keys - `suffixReading`, `headline.gddSnippetShare`,
`cells[].gddSnippetShare` - and **zero scalar diffs on every shared key** (verified by a key-set diff
against the pre-suffix snapshot). So the numeric content never moved; only the shape grew.

### 3.3 Therefore: rebuild **directly**, refresh the line, record it as a refresh

TASK Scope 3 asks which rule applies: *"if the schema changed, rebuild the md5 off the new keys; if
not, md5 the file directly."* Here the answer is **md5 the file directly**, because:

- the ledger is a list of **files on disk**, and the file on disk now *has* the new keys. Stripping
  them to reproduce `1f4bfd3c…` is the right move for an **equality** check across a schema change
  (that is what R2-F-SUFFIX did, and it passed) - it is the wrong move for a **coverage** ledger,
  where every line must name a real file's real bytes.
- the de-keyed comparison is preserved anyway: `1f4bfd3c…` is reproduced in §3.2 and lives in
  R2-F-SUFFIX's evidence page, so the "no number moved" proof is not lost.

**Verdict: rolling → refresh. Not a finding.** No slice needs to be hunted.

---

## 4. Scope 2 — coverage is now executable

Two artifacts, both new:

**`tasks/game-remediation/byte-ledger.mjs`** — the generator *and* the verifier.
- One filesystem walk produces the path list (never typed).
- The rolling set is derived by scanning `apps/mobile-next/src/**/*.{test,spec}.ts`.
- `--write` rewrites the ledger; default mode verifies; `--coverage` prints the classification;
  `--json` is machine-readable.
- Exit code is non-zero on **missing**, **extra**, or a **frozen** hash move. A rolling move is
  reported but does not fail (it is expected between a snapshot and now).
- Exposed as `npm run ledger:verify` / `ledger:write` / `ledger:coverage`.

**`apps/mobile-next/src/core/byteLedger.test.ts`** — the gate. It **re-derives** the classification
independently rather than importing the tool, so the test cannot pass merely because the tool agrees
with itself. Five assertions, run on every `npm test`:

1. names every report on disk (fails with the **exact list** of what the ledger forgot);
2. lists nothing that is not on disk;
3. the rolling set is non-empty and contains known members (guards the scanner itself - if it
   matched nothing, every file would look frozen and a refresh would read as a finding);
4. every hash matches, and **every** mismatch is a rolling report;
5. the ledger is exactly one line per report (no truncation, no duplication).

### 4.1 Negative tests (the fix is installed *and* it can fail)

| induced fault | expected | observed |
|---|---|---|
| delete the `horde-report.json` line from the ledger | 2 red, printing `"R2-F-TOUGH-HORDE/horde-report.json"` | ✅ red, exact path printed |
| mutate a **frozen** file's bytes (`R2-F-KITKEY/probe-ids.json`) | 1 red naming it as a frozen drift | ✅ red, `"rel": "R2-F-KITKEY/probe-ids.json"` |
| restore both | all green | ✅ 5 passed / 403 ms |

---

## 5. The regeneration, line by line

Backed up to `%TEMP%/horde-ledger/cap10-md5.before.txt` (md5 `b34b5a3cef428cbe5ca07e03746020b2`,
248 lines) **before** regenerating. Diff against the new ledger:

```
CHANGED (1):
  R1g-12/manual-report.json  8246b726fbfd70dcadebd1b0595bce97 -> 9c71d8836995ee06eda32af1586b6bba
ADDED (13):
  R2-F-BOSS-ADDS/boss-adds-report.json          (rolling)
  R2-F-BOSSPHASE/bossphase-report.json          (rolling)
  R2-F-CADENCE/cadence-sweep.json               (rolling)
  R2-F-CIRCLE/circle-report.json                (rolling)
  R2-F-G4ROWS/g4rows-report.json                (rolling)
  R2-F-TOUGH-HORDE/horde-report.json            (rolling)
  R2-F-CAP/manual-cap10.json                    (frozen - the cap-10 snapshot this ledger indexes)
  R2-F-CAP/manual-cap8.json                     (frozen)
  R2-F-GDD-G8/probe-keys.json                   (frozen - archived probe)
  R2-F-GDD-G8/probe-progression.json            (frozen - archived probe)
  R2-F-KITKEY/probe-hazard.json                 (frozen - archived probe)
  R2-F-KITKEY/probe-ids.json                    (frozen - archived probe)
  R2-F-SUFFIX/manual-report.pre-suffix.json     (frozen - archived snapshot)
REMOVED (0):
```

**The 248 historical hashes are not rewritten** (TASK constraint): 247 are byte-identical and the
one change is the refresh of §3, which is the point of the slice. The six rolling additions are the
reports of the six slices that shipped after the ledger was built and never re-derived it.

Final state: **261 lines**, `LEDGER OK`, `missing 0 | stale 0 | moved 0 | extra 0`.

---

## 6. Files changed

**Production: 0 files, 0 lines.** (`legacy` byte-identical.)

| file | change |
|---|---|
| `tasks/game-remediation/byte-ledger.mjs` | **new** - generator + verifier (walk the tree, derive the rolling set, md5, classify) |
| `apps/mobile-next/src/core/byteLedger.test.ts` | **new** - the gate; 5 `it`, ~0.4 s, re-derives the classification |
| `tasks/game-remediation/evidence/R2-F-CAP/cap10-md5.txt` | **regenerated**: 248 → 261 lines (1 refreshed, 13 added, 0 removed) |
| `tasks/game-remediation/evidence/R2-F-CAP/IMPLEMENTATION.md` | **appended** §10 + a caveat box at §4 - the old `248` is stamped as a dated record, not a live claim |
| `package.json` | `ledger:verify` / `ledger:write` / `ledger:coverage` scripts (**not** added to `test` - see §7) |
| `tasks/game-remediation/evidence/R2-F-HORDE-LEDGER/` | **new** - this file |

No file that is line-referenced was restructured: §10 is an append, the §4 box is an insertion that
shifts no referenced line (nothing cites `R2-F-CAP/IMPLEMENTATION.md` by line number).

---

## 7. Why the gate lives in vitest, not in the root `test` chain

The root `npm test` chain (`check && smoke && audit && context && archive:verify`) audits the
**legacy V3.1.3 root tree** (`assets/js/**`, `index.html`). The ledger indexes
`apps/mobile-next`'s evidence, and the reports it names are written by that package's suite. So the
gate belongs where the writers are: `npm test` inside `apps/mobile-next`. Adding it to the root chain
would also mean the root chain has to walk `tasks/game-remediation/evidence/**`, which no root gate
does today - a coupling with no payoff. `ledger:verify` is exposed at the root for manual use.

---

## 8. Acceptance

- Ledger covers the tree: **261/261**, `missing 0, extra 0, moved 0`.
- The gate fails on a hole and on a frozen drift (negative-tested, §4.1).
- `manual-report.json` decided: **rolling, refreshed, not a finding** (§3), with the de-keyed
  equality reproduced to the byte.
- Zero production change; historical hashes preserved except the one refresh.
- Coverage is stated in the same breath as the numbers (§4, §5) - the constraint that mattered most.
- Full suite: **44 files / 1470 tests, all green** (1723.05s, `EXIT=0`; `1470 - 1465 = +5` = this
  slice's five `it`). `npm run ledger:verify` re-run **after** that suite - which rewrites all 26
  rolling reports - still prints `LEDGER OK` with `stale(rolling) 0`: a rolling report is a function
  of the code, so a rerun of the same code reproduces the same bytes, and the ledger stays valid
  across a full-suite pass without regeneration.

---

## 9. Write-back to the queue

- **#6v R2-F-HORDE-LEDGER — done.** Ledger regenerated by a command; coverage gated on every
  `npm test`; `manual-report.json` ruled a refresh.
- **Not enqueued as a slice (a note for whoever touches `evidence/` next):** the generator walks the
  tree, so a **new** evidence directory is covered automatically - but its report is only classified
  correctly if its writer uses `writeFileSync(resolve(<dir>, '<name>'))`. A writer that assembles the
  path some other way would be classified FROZEN and a move would read as a finding. That is the
  right failure direction (loud, not silent), so it is left as-is rather than special-cased.
- **#6w R2-F-BOSS-COVERAGE is next** — "Boss + adds" coexistence, a coverage hole of the same family
  as this one (a scenario nothing exercises) but in the *scenario* space rather than the *artifact*
  space.
