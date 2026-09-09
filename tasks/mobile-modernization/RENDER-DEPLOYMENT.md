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

## P4b release preparation - 2026-09-09

The P4b compact portrait HUD slice includes P4a's portrait edge-camera fix.
All five root gates, 49 legacy hashes, app types/build, 946 rules and 27 latest
related browser cases pass. All 42 P4b recordings and 35 P4a recordings remain.
See P4b-EVIDENCE.md for failed attempts and the natural/synthetic distinction.

Early GitHub TLS and Render connection failures recurred. A later read-only
retry succeeded: remote branch was d2ab258 and the dashboard loaded the
existing WJWS service, linked to codex/mobile-web-modernization. It still
showed 75e139b / dep-dag058on74is73bukk40 as the last successful deployment.
P4a/P4b push, release upload and exact-source clean-cache deployment follow
local tagged packaging. Their completed outcome will be appended separately.
No TLS, proxy or service settings have been changed.

## P4b verified delivery - 2026-09-09

P4a and P4b are pushed to `codex/mobile-web-modernization`, with immutable
annotated tags at `212c4fc2fc899371aff3d98e35d2cba045df6951` and
`4c371250af4822575c230bf47063e35510b4a168` respectively. Both GitHub
prereleases are published; each of the six uploaded assets matches its local
size and SHA-256 digest. Reports: `evidence/P4b/github-p4a.json` and
`evidence/P4b/github-p4b.json`. The P4a attachment's network-blocked note is
historical packaging evidence; the GitHub release body records the recovery.

The existing service settings were freshly verified: same branch, Node 24.18.0,
empty root, recorded build command, publish `dist/render`, auto-deploy Off.
The selected Off option was inspected and the editor cancelled without changes.
Manual **Clear build cache & deploy** produced:

- Deployment: `dep-dagd7tp42hec73bpec70`
- Source: `4c371250af4822575c230bf47063e35510b4a168`
- Started: 2026-09-09 11:35:19 GMT+8; duration 18.2 seconds
- Live log: 11:35:37 GMT+8; dashboard `Deploy succeeded`
- Notice: `Build cache cleared`; dependency audit: zero vulnerabilities
- Build/typecheck passed; existing Phaser chunk-size warning remains.

The first HTTPS verification failed with transient TLS `ECONNRESET`. A normal
retry of `node scripts/verify-render-site.mjs https://wjws.onrender.com`
passed: exact source/version manifest, 51 file hashes/sizes, both entry asset
references, unchanged legacy baseline and four blocked repository-only URLs.
No network, TLS or proxy settings were changed. All 52 public package files
are the 51 runtime files plus `version.json`; no repository material is added.

Natural browser acceptance used the local production package and public site.
Local classic battle enters, pauses, resumes and exits; legacy start loads.
Live 320 x 568 evolution battle naturally reaches Lv.2, selects Tornado,
activates Wind/Fire bond, uses the hero skill, pauses/resumes and returns to
lobby. Reload retains Flame Ninja and 6,000 gold; session mode resets to
classic. The legacy Continue button loads the existing lobby. Local/live game
tabs report no console warnings/errors. Viewport override reset afterward.
See `evidence/P4b/delivery.json`, live PNGs and `render-deploy.txt`.

This is a browser-emulated presentation acceptance. P2k's three fresh natural
HP-death failures, physical phones, landscape HUD, performance/endurance,
remaining gameplay parity and PWA remain open. No full match was recorded in
this live smoke check; the release contains the 42 original P4b recordings.

Preferred rollback remains `dep-dag058on74is73bukk40` / `75e139b` with its
allowlisted mobile and legacy package. No rollback was executed. Keep saves,
both runtime tags and auto-deploy Off. The final documentation-only commit
records this deployment without changing the running 4c37125 build.

## P4c verified delivery - 2026-09-09

The landscape HUD slice is live at the isolated mobile path. Annotated tag
`mobile-next-p4c-20260909` points to `649b0b54e16b0016de9ba88dd148516aefd0da8b`.
The branch and tag are pushed; main remains 30d05f2 and previous tags are
unchanged. GitHub prerelease 385221073 contains six verified assets (remote
sizes/SHA-256 match); see evidence/P4c/github.json and P4c-EVIDENCE.md.

The existing service settings were rechecked: codex/mobile-web-modernization,
empty root, Node 24.18.0, unchanged build command, publish dist/render and
Auto-Deploy Off. The Off option was inspected, then the editor cancelled.
Manual **Clear build cache & deploy** produced:

- Deployment: `dep-dagdr1142hec73brst60`
- Source: `649b0b54e16b0016de9ba88dd148516aefd0da8b`
- Started: 2026-09-09 12:16:04 GMT+8; duration 18.1 seconds
- Live log: 12:16:22 GMT+8; dashboard Deploy succeeded / Live
- Build cache cleared; zero dependency vulnerabilities; existing chunk warning

Local HTTP and public HTTPS verification pass every one of the 51 runtime
hashes/sizes, entry references, legacy baseline and repository-only path
exclusions. All 52 public files are the allowlisted runtime plus version.json.
Visible live landscape entry, skill, pause/resume/exit and legacy Continue
to lobby pass without game console warnings/errors. Viewport override reset.
Three additional native Playwright cases against the live URL pass natural
upgrade/touch/safe-area/rotation/remount at all three landscape sizes; their
recordings are separate from the 57 original local recordings. The temporary
live config's initial ESM loading error is preserved in delivery.json; it
occurred before test execution and required no application change.

P4c has 946 passing rules and 45 latest local related browser cases. P2k's
three natural fresh HP-death failures remain open; full gameplay, physical
phones, performance/endurance, other content and PWA are separate gates.
No full match or real-phone acceptance is claimed for this deployment.

Immediate previous runtime: `4c371250af4822575c230bf47063e35510b4a168` /
`dep-dagd7tp42hec73bpec70`. Older known rollback: `75e139b8d7aa50198471fb4aab3b92d027c97bd5` /
`dep-dag058on74is73bukk40`. Use the selected previous deployment's Render
rollback action to recover its complete package; do not reset Git or saves.
Rollback has not been executed. Keep auto-deploy Off and immutable runtime
tags/assets; the final evidence commit does not replace the running build.
