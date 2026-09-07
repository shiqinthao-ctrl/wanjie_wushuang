# Wanjie mobile-next

Independent, portrait-first migration. The legacy root entry remains available.
Current milestone and missing parity are tracked in
`../../tasks/mobile-modernization/STATUS.md`.

## Run
Use Node >=22.12, then from this directory:
```
npm ci
npm run dev
```
Open http://127.0.0.1:5178/mobile-next/ . For the production build use
`npm run build` and `npm run preview` (port 4178). Deploy `dist/` under
`/mobile-next/`; the directory is intentionally separate from the old entry.

## Verify
From the repository root run `npm test` and
`node tasks/mobile-modernization/verify-baseline.mjs`, then here run
`npm run verify`. Browser tests use a locally installed Chrome and temporary
contexts, never a personal profile. `playwright-report/` and `test-results/`
contain local reports, screenshots and failure traces.

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
future settlement slice. The legacy merchant buff does not affect H001's
effective dedicated basic attack; the purchase describes that limitation.

Timed chests at 90/210/300s require explicit claim, pause for a choice, and apply
one reward per token. Fusion/evolution priority and actual supported attacks
match isolated legacy oracles. Gear shares the run-local encounter loot array.

B001 appears at 270s with original attacks, map interactions and Boss Loot.
The delayed loot offer uses 180ms of unpaused battle time, so it cannot open
after leaving the run. An automatic drop and one selected extra item stay
run-local. Victory waits for the choice and original completion guards; a
living Boss at 360s causes timeout. Atomic settlement and full natural
victory/defeat/retry remain required for P2. The receipt-based mutation
primitive is not yet a migrated settlement implementation.
Refreshing an active battle restores saved preparation and returns to the lobby.
