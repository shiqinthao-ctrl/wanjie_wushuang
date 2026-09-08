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

Deployment and live-browser evidence will be appended after the service is Live.
The packaging checks and app typecheck/build pass locally. P2k already records
946/946 rules and 42/42 related browser cases passing; the latest 54 distinct
browser cases include 51 passes and three fresh natural HP-death target
failures. Those failures remain open. Physical phones, performance/endurance,
audio/full parity and PWA are not accepted by this preview deployment.
