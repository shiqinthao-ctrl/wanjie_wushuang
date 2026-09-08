# Wanjie mobile-next

Independent, portrait-first migration. The legacy root entry remains available.
Current milestone and missing parity are tracked in
`../../tasks/mobile-modernization/STATUS.md`.

## Evolution Journey
Choose `进化征途` in the lobby, then choose 赤焰战神 (H001), 炎忍 (H010),
or 影忍 (H012). This opt-in new design is separate from classic rule parity.
At run level 3, pick one of three hero forms. At level 8 with an active skill
at level 3, awaken that form. Evolution changes attacks and abilities without
healing, resetting cooldowns or buying a permanent hero. Mastery belongs to
the starter, and every new run starts from that hero again.

Ten active skills and eleven passives share a randomized pool with six slots
per category. Fireball, tornado, clone, frost and lightning skills each offer
two exclusive level-3 routes. Six skill combinations activate mechanical bonds,
including frost/lightning damage, frost/summon pulses and faster lightning/summon
attacks. New forms guide paid signature-skill choices until level 3; they never
grant free skills or bond tags. Open `本局路线` during battle to pause and inspect
owned skills, branches, requirements and bonds. The result retains the run's
evolution recap. See `../../tasks/mobile-modernization/EVOLUTION.md` for details
and `../../tasks/mobile-modernization/G1-EVIDENCE.md` for verification.
The G2 additions and recordings are documented in
`../../tasks/mobile-modernization/G2.md` and `G2-EVIDENCE.md` beside it.

G3 adds readable lightning hit paths, frost lifetime arcs and distinct guard /
hunter markings. Route choices explain playstyles, tradeoffs and exclusivity;
later upgrades retain the selected route's description. Bond conditions name
the actual skills owned or missing. The pause-menu effects toggle changes
short-lived visuals only; area boundaries, danger and pickups remain visible.
See `../../tasks/mobile-modernization/G3-EVIDENCE.md` and the replay viewer at
`../../tasks/mobile-modernization/evidence/G3/index.html`.

The journey uses each starter's initial skills and the common choice pool;
the saved loadout remains intact. Hero selection updates only the isolated
slot's selected hero. Classic preview remains the default entry and supports
H001; switch to Evolution Journey to play H010 or H012 after a reload.
Journey merchants offer healing and leaving only; the unsupported legacy
firepower purchase is rejected before payment in this ruleset.

## Run
Use Node >=22.12, then from this directory:
```
npm ci
npm run dev
```
Open http://127.0.0.1:5178/mobile-next/ . For the production build use
`npm run build` and `npm run preview` (port 4178). Deploy `dist/` under
`/mobile-next/`; the directory is intentionally separate from the old entry.

Development milestone: `mobile-next-g3-20260908`, on branch
`codex/mobile-web-modernization`. The annotated tag identifies the exact source;
`CHANGELOG.md` records player-visible changes. The GitHub prerelease contains
the preview build, four recordings, a standalone report and SHA-256 checksums.
Extract previews into a separate directory and serve them over HTTP; the game
does not start from `file://`. Export saves before changing origin/port. To
return to the legacy game, use the preserved root entry and its original saves;
there is no automatic reverse conversion of new progression.

## Verify
From the repository root run `npm test` and
`node tasks/mobile-modernization/verify-baseline.mjs`, then here run
`npm run verify`. Browser tests use a locally installed Chrome and temporary
contexts, never a personal profile. `playwright-report/` and `test-results/`
contain local reports, screenshots and failure traces.

P2j verification is still in progress. The full `npm run verify` is not a green
gate: `natural corner-contact defeat, zero stars, save reload and replay` has
not produced HP-death from the unchanged fresh preparation. Its assertion is
retained. Imported low-growth HP-death is supplemental evidence only. See
`../../tasks/mobile-modernization/P2j-EVIDENCE.md` for passing and pending paths.

## Boundaries
GameCore is pure TypeScript with no timers/DOM. Phaser supplies the only frame
driver and owns render entities. Vue owns navigation, small UI snapshots and
input commands. Renderer and UI can be replaced without changing rules.

Versions are exact in package.json and package-lock.json. TypeScript 7.0.2 was
tested and failed with vue-tsc 3.3.11 (ERR_PACKAGE_PATH_NOT_EXPORTED for lib/tsc).
TypeScript 5.9.3 passes the strict Vue typecheck. Phaser 4.2.1 / Vite 8.2.2 /
Vue 3.5.42 have passed a production build. Browser and device evidence must be
reported separately; viewport emulation does not certify phones.

The preview contains H001 combat, growth, map interactions, scheduled encounters,
timed chests, supported evolutions/fusions, B001 and isolated local
save management. The native IndexedDB database is `wanjie-mobile-next`; legacy
localStorage keys are not read or written. JSON imports create additional slots
and retain exact UTF-8 source text for export. Unsupported preparation remains
exportable and cannot start a silently substituted preview run.

Merchant and gold-chest encounters at 45s/150s pause for a visible choice. Their
currency is committed once to the run's original slot before local effects;
failed writes keep the choice paused for retry. Gear remains local until the
run settles. The legacy merchant buff does not affect H001's
effective dedicated basic attack; the purchase describes that limitation.

Timed chests at 90/210/300s require explicit claim, pause for a choice, and apply
one reward per token. Fusion/evolution priority and actual supported attacks
match isolated legacy oracles. Gear shares the run-local encounter loot array.

B001 appears at 270s with original attacks, map interactions and Boss Loot.
The delayed loot offer uses 180ms of unpaused battle time, so it cannot open
after leaving the run. An automatic drop and one selected extra item stay
run-local. Victory waits for the choice and original completion guards; a
living Boss at 360s causes timeout.

GameCore captures a detached, recursively frozen final record once. RunSession
owns both event payments and settlement revisions for the original save slot.
Gold, mastery, account XP, stars, inventory and the settlement receipt commit
in the same native IndexedDB transaction. Failed or unconfirmed writes keep
the result visible for retry; replay unlocks after a confirmed commit and
loads that same slot again. Leaving an unfinished run grants no final reward.
The classic settlement scope is H001 / ST001-01 / story / normal. Evolution
Journey additionally supports H010/H012 with a matching run recap; unsupported
content or changed preparation is rejected before mutation. Original unknown
save/drop fields survive. A retry after a lost response returns the stored
receipt without a second reward.

Rule fixtures include eight captured effective legacy settlement outcomes.
Native fault/concurrency and synthetic component tests are labeled separately
from natural keyboard/multi-touch acceptance. See the status/evidence files
for the checks actually completed; none certifies phones or production readiness.
Refreshing an active battle restores saved preparation and returns to the lobby.
