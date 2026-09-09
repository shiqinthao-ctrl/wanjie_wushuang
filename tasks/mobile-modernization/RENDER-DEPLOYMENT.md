# Render mobile preview deployment

## Scope

The user authorized this existing service update on 2026-09-08. The deployed
preview contains the current P2k/G3 runtime: three starters, nine evolved forms,
ten skill routes and six bonds. This task changes packaging, not game rules.

- Service: WJWS, `srv-d9v8cm1t0dsc73ch79k0`
- Legacy entry: https://wjws.onrender.com/
- Mobile preview: https://wjws.onrender.com/mobile-next/
- Public version record: https://wjws.onrender.com/version.json
- Repository: https://github.com/shiqinthao-ctrl/wanjie_wushuang

## Previous production baseline

Observed in the service dashboard before any settings changes:

- Live deployment: `dep-daba4dmq1p3s73fkctmg`
- Live source: `30d05f291a4860f653a7d7a1ecbbf5015b2145fc`
- Branch: `main`; root directory: empty; build command: empty.
- Publish directory: `.`; automatic deployments enabled.
- No custom redirect/rewrite rules or response-header rules.

The existing legacy entry and assets are copied byte-for-byte from the
49-file migration baseline. Legacy local storage and the mobile app's isolated
IndexedDB remain unchanged. A refresh returns the mobile preview to its lobby.

## Target build settings

- Branch: `codex/mobile-web-modernization`
- Root directory: empty
- Node: `24.18.0`, pinned in the root `.node-version`
- Build command:

```sh
npm --prefix apps/mobile-next ci --include=dev && npm --prefix apps/mobile-next run build && node scripts/build-render-site.mjs
```

- Publish directory: `dist/render`
- Auto-deploy: off; trigger a manual deployment of the verified commit.
- Preserve domain, redirects/headers, account, access and billing settings.

The output contains only legacy `index.html` and `assets/`, the mobile Vite
production build under `mobile-next/`, and `version.json`. Repository documents,
source TypeScript, tests, recordings and save fixtures are excluded.
`version.json` records the full source commit plus all 51 runtime file hashes.

## Reproduce and verify

Run the five root gates in order, then:

```sh
node tasks/mobile-modernization/verify-baseline.mjs
npm --prefix apps/mobile-next run build
node scripts/build-render-site.mjs
node scripts/verify-render-site.mjs
```

Build from the committed checkout, so the public source marker is accurate.
After Render reports Live for that same commit:

```sh
node scripts/verify-render-site.mjs https://wjws.onrender.com
```

The HTTP check verifies every asset against the local build, both entry asset
references, unchanged legacy hashes and blocked repository-only URLs. Browser
acceptance checks lobby, hero selection, battle startup, pause/continue/exit,
save UI, reload and the legacy entry. Browser evidence is separate from phone
acceptance and does not replace the existing gameplay regression evidence.

## Rollback

In this service's Deploys page, select the previous Live deployment
`dep-daba4dmq1p3s73fkctmg` and use its rollback action. Check the root entry and
source commit afterward. Rolling back the deployment does not change browser
saves. Keep auto-deploy off to prevent an immediate replacement deployment.

If a rebuild of the original version is necessary, restore branch `main`,
empty root/build settings and publish directory `.`, then deploy the recorded
previous source commit. Prefer the retained deployment rollback because the
old publish-directory setting exposes more than the allowlisted game package.
Do not reset or force-push either branch to perform a rollback.

## Acceptance status

Completed on 2026-09-08. Render's deployment page reports
`Deploy succeeded | Live` for `dep-dag058on74is73bukk40`, source
`75e139b8d7aa50198471fb4aab3b92d027c97bd5`. It started at 20:42:11 GMT+8,
took 19.3 seconds, and the log reports Live at 20:42:30. The dashboard confirms
`Build cache cleared` and Node 24.18.0. Auto-deploy is off.

Deployment tag: `mobile-next-render-20260908`, pointing to that exact source.
The subsequent documentation-only commit records this acceptance and does not
change the running version. GitHub branch: `codex/mobile-web-modernization`.

### Deployment retry and public package

The first deployment, `dep-dag03qgu01pc73c9nqrg` at 20:39:06 GMT+8,
reported Live with the same source and all runtime hashes matched. However,
HTTP checks found that `/TASK.md` and `/package.json` still returned old
September 1 content, including with cache-busting queries. Acceptance failed.
Render's **Clear build cache & deploy** action produced the current deployment
and resolved those stale files without redirect or header changes.

Final `verify-render-site.mjs https://wjws.onrender.com` passed: all 51 file
hashes and sizes, both entry asset references, the legacy baseline and four
repository-only URLs. The latter return 403/404. The remote version record
matches the local verified build and full source commit. Root checks passed
in order, archive integrity passed (30 files / 12 documents), migration hashes
passed 49/49, and the app typecheck/build passed locally and on Render.
Render's dependency audit reported zero vulnerabilities. The existing Phaser
chunk warning remains (1,429.18 kB minified / 377.14 kB gzip).

### Browser observations

The following checks used ordinary visible controls in the Codex browser;
no battle state, save data or game clock was injected.

| Surface | Observed result |
| --- | --- |
| Local production package | Both entries load; all three starters selectable. Shadow starter naturally levels up, selects an upgrade, pauses/resumes and returns to lobby. Save page and reload preserve selection and 6,000 gold. |
| Live desktop | Lobby loads; evolution mode and fire starter selection update the visible hero and attributes. |
| Live phone layout | 390 x 844 viewport (375 px document width excluding scrollbar). Fire starter enters battle, naturally reaches Lv.2/Lv.3, upgrades fire dash, activates the hero skill and evolves into the lightning form. Lv.4 selects lightning bolt. |
| Live battle lifecycle | Pause displays the lightning form, three active skills and six bond requirement panels. Continue advances game time. A natural golden-chest event is dismissed through its Leave button; pausing again and returning to lobby succeeds. |
| Live persistence | Abandoning the run returns to the fire starter and retains 6,000 gold. Save page loads; refresh returns to lobby and preserves the starter/currency. Session mode resets to classic as designed; evolution mode remains selectable. |
| Live legacy entry | Original start screen and existing progression load at the root URL. |
| Runtime errors | Local and live game tabs report no console warnings/errors during these checks. |

Phone-layout screenshots were inspected in-session; this is browser emulation,
not physical-device acceptance. No new complete-match recording was produced
for this packaging-only update. The 12 complete P2k recordings and evidence
remain available in the existing GitHub release:
https://github.com/shiqinthao-ctrl/wanjie_wushuang/releases/tag/mobile-next-p2k-20260908.

### Open gates

P2k previously recorded 946/946 rules and 42/42 related browser cases passing;
the latest 54 distinct browser cases include 51 passes and three fresh natural
HP-death target failures (actual outcome: victory). Those failures remain open.
The full gameplay suite was not rerun for this packaging-only update. Physical
phones, performance/endurance, audio/full parity and PWA are not accepted by
this preview deployment. Phone HUD/control occlusion remains a follow-up.
The prior deployment's rollback action was observed but not executed.

## P4a update attempt - 2026-09-09

The next local preview is `mobile-next-p4a-20260909`, a presentation-only
portrait edge-camera fix. Packaging/build settings remain those above.
The user has already authorized this GitHub and existing-service update.

Local rules (946), related browser cases (17 latest), five root gates,
49 legacy hashes and app types/build pass. See P4a-EVIDENCE.md for failed
attempt preservation and recordings. Physical-device and full-gameplay
acceptance are still separate.

Remote delivery is blocked by network access: the selected browser returns
ERR_QUIC_PROTOCOL_ERROR / ERR_CONNECTION_CLOSED for the dashboard. GitHub
Git and CLI calls return TLS handshake failure / EOF; independent HTTPS checks
also fail. No deploy was triggered and no service/network/security settings
were changed. Last known live remains the Sep 8 deployment recorded above;
it cannot be freshly verified while the external connection is unavailable.

Resume by pushing the local branch and annotated P4a tag, uploading the assets
under releases/mobile-next-p4a-20260909, and using Clear build cache & deploy
for the exact tagged source. Build from that source, run local and HTTPS
package verification, then check natural startup/pause/exit and legacy root.
Record the new deployment ID and full commit only after verified Live.
The preferred P4a rollback is `dep-dag058on74is73bukk40` / `75e139b`, which
preserves the allowlisted mobile preview and legacy entry. Do not reset Git
or delete saves. The rollback action has not been executed for this slice.
