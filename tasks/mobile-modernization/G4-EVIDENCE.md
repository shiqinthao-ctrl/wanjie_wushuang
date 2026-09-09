# G4 wind-shadow evolution evidence

Date: 2026-09-09. Tag: `mobile-next-g4-20260909`.
Baseline: `bc0c9d293daa208b98f7227a8e7d5ebeac00d0dd`.
Prior live runtime/rollback: `649b0b54e16b0016de9ba88dd148516aefd0da8b`,
Render deployment `dep-dagdr1142hec73brst60` (P4c).

## Playable change

In the opt-in Evolution Journey, select Shadow Ninja (H012), reach Lv.3 and
choose Windwarden. Basic attacks fire three 65%-attack shadow blades with
one pierce; awakening raises pierce to three. The skill places a fixed wind
formation toward the nearest enemy/Boss within 180 units, radius120, 35%
attack per pulse, life4s; awakened radius160/life6s. The ultimate spends100
gauge on radius200/65%-attack/life6s and retains four/five shadow companions.
The existing gear-adjusted 6s skill cooldown and Lv.8/activeLv.3 awakening
gate remain. Choosing this form guides paid A026 upgrades through Lv.3.

A026 Lv.3 now offers Roaming, Orbit and Ambush as three mutually exclusive
routes. Ambush stays at its cast point, placed within220 of the hero, with
radius110 (145 evolved), 80% ordinary pulse damage and existing range/life
modifiers. Each route explains both alternatives forfeited this run.

Galephantom requires positive-level A026 and A015 or S001. Each live vortex
pulse can emit one shadow blade toward the nearest enemy/Boss within300 of
the vortex: speed420, one pierce, base75% pulse damage, A026-level and shadow
passive/bonus scaling. Form identity alone does not grant a bond. No target,
out-of-range target or expired vortex gives no shot. Every existing vortex
source participates when the bond is active; this includes void/fusion
vortices. Empty-target placement retains the engine's existing aim fallback
(angle0), not a new last-movement-facing system. Bosses are never pulled.

The catalog now contains ten forms, eleven routes and seven bonds. Fixed
formations have a perimeter/lifetime arc and the new form has a three-blade
crest. The Phaser update loop and bounded effect collections remain shared;
no frame state is added to Vue and no dependency/public debug UI is added.
Schema30, legacy sources/loading, classic combat and settlement contracts
retain their boundaries. No save migration or fixture change is included.

## Automated evidence

Root: `evidence/G4/`. No browser retry or skipped case; all attempts retained.

| Evidence | Result | Scope |
| --- | --- | --- |
| red.json | 12 expected failures | New behavior absent before implementation |
| green-01.json | Pass | Focused new rules/advice after implementation |
| rules.json | 960/960 pass | Full current rules and UI unit suite |
| natural-01 | 3/3 pass | Desktop1280x720, phone390x844, narrow320x844 |
| regression-01 | 51/51 pass | Same three browser profiles |
| gates.json | Pass | Five ordered root gates, legacy hashes, app types/build |

The desktop and phone tests use normal keyboard/native CDP touch input from
the lobby, acquire the form, A026, Ambush, Galephantom and awakening, defeat
the encounter Boss, persist rewards, replay with evolution reset and reload
the same save. The narrow test acquires the new build, inspects all four
hero options/three route options and the bond guide, then exits without
changing progress and reenters. All three report no browser errors. Effects
off/on, pause and simultaneous touch movement/skills are included. RNG,
clock, core state and saves are not injected in these natural cases.

The 51 related cases cover storage/settlement/evolution transactions, stale
and failed writes, concurrent tabs, touch cancellation/viewport changes,
remounts and missing assets. Transaction/result fault fixtures are explicitly
synthetic browser integration evidence, not natural battle outcomes.
The full historical browser suite is not rerun or claimed green.

49/49 legacy baseline hashes and the unchanged fresh Schema30 fixture hash
`c4903f476644792538691fef91d9d8da168c312d0b6aaadd21a637c4fb72c685`
are verified. The existing Phaser chunk warning remains at 1,431.23 kB
(377.88 kB gzip); this batch makes no measured performance improvement claim.

## Recordings and review

All 57 raw WebMs fully decode: 54 browser executions plus three second-tab
recordings. `recordings.json` stores hashes, sizes, duration and decode status.
Two complete original-speed MP4s are provided without cuts: desktop316.84s
and phone313.64s. They include the natural match and retry; the phone video
selects Windwarden around26s, Ambush around75s, awakens around112s, and shows
saved victory around309s. The original choice/timeline JSON and screenshots
remain in the recordings ZIP. Narrow form/route/bond screenshots and the
four-frame phone contact sheet were visually inspected.

Independent read-only code review found no required corrections. Review
confirmed paid/gated choices, fixed placement, pulse timing, element scaling,
bounded effects/destruction, no Boss pull, classic isolation and UI advice.
The aim fallback and all-vortex participation described above are deliberate
existing-system conventions, not claims of added facing/physics behavior.

## Reproduce and delivery

```powershell
cd apps/mobile-next
$env:G4_ATTEMPT = 'new-natural-check'
npx playwright test --config playwright.g4.config.ts wind-shadow-recording.spec.ts
```

For native regressions select evolution.native.spec.ts, storage.native.spec.ts,
settlement.native.spec.ts, lifecycle.spec.ts and camera-controls.native.spec.ts
with another unique attempt name. The config refuses to overwrite reports.
`package-g4-release.py --media` decodes and prepares media; `--release`
requires a clean tagged checkout with matching Render manifest. It verifies
gates, browser counts, recording hashes and all ZIP entry hashes.

Seven GitHub prerelease assets: combined Render ZIP, all-test-recordings ZIP,
two full MP4s, build preview PNG, notes and SHA256SUMS. Remote publication and
Render verification are pending at packaging time and will be appended in a
documentation-only follow-up, keeping the runtime tag and assets immutable.
Render settings were inspected: same branch, empty root, existing build
command, publish dist/render and Auto-Deploy Off (editor cancelled unchanged).

P2l's requested fresh natural HP-death and stationary phone timeout remain
open. This batch does not rerun or weaken those assertions, change balance
to force failure, or count imported deaths as fresh acceptance. Physical
phones, performance/30-minute endurance, remaining content/modes, audio/full
parity and PWA remain separate work. The preview remains isolated under
`/mobile-next/`; the root legacy game is retained. Rollback uses the prior
complete Render deployment above without resetting Git history or saves.

## Verified deployment and additional live acceptance

The runtime commit is `05b82accc53bcc2284e0f721922cec9c9185ed7d`, pushed with
its immutable annotated G4 tag. Main remains `30d05f2`. Render's manual
clear-cache deployment `dep-daggvhbl550s73bkiq30` started at 15:50:29 GMT+8
on 2026-09-09, took20.5s and logged Live at15:50:49. The source, Node24.18.0,
zero dependency vulnerabilities, build/typecheck and original chunk warning
were observed in the dashboard. No service settings changed; Auto-Deploy Off.

Local HTTP attempt01 used port4190, which Node fetch rejects before sending
a request. The identical package passed on4188 in attempt02. Public HTTPS
verification passed all51 runtime hashes/sizes, source manifest, both entries,
unchanged legacy baseline and repository-only path exclusions. See
`evidence/G4/live-http-01.json`, `delivery.json` and `render-deploy.txt`.

Additional natural tests against the public URL preserve four executions:

- `delivery-live-01`: phone and narrow pass; desktop fails the unchanged
  5s battle-readiness assertion. The screenshot remains on the loading screen.
- `delivery-live-02`: a separate desktop execution passes the full natural
  match with the identical assertions and runtime. No retry mode was enabled.
- The latest desktop/phone runs acquire Windwarden, Ambush, Galephantom and
  awakening, win, save rewards, replay with reset and reload. Narrow verifies
  the build, choices, guide, touch and exit/reentry. All three passing runs
  report no game console, page or response errors.

These are three passes and one preserved failure, not four first-pass
successes. All four live WebMs fully decode and remain separate from the
57 local originals and the immutable release MP4s. `live-recordings.json`
records their hashes and durations. The temporary live `.mts` config changed
only baseURL to the public mobile path and removed the local webServer; it
was removed after testing. Set a new G4_ATTEMPT to preserve future attempts.

Visible browser checks also pass mobile entry, H012 skill, pause/resume,
return to lobby and legacy Continue. A fresh startup diagnostic measured
2,744ms from start-click completion to readiness; this single observation is
not a performance acceptance or proof of the first timeout's cause. The
combined diagnostic is marked failed because legacy `/favicon.ico` returns
404, confirmed separately with console location in `legacy-probe-02.json`.
The legacy lobby works and no legacy runtime exception was observed. The
timeout cause and legacy icon remain follow-up issues; no application,
legacy or assertion changes were made to hide them.

## Completed GitHub delivery

GitHub prerelease385317014 is published at
https://github.com/shiqinthao-ctrl/wanjie_wushuang/releases/tag/mobile-next-g4-20260909.
All seven assets match local byte lengths and SHA-256 before and after
publication; `github-draft.json` and `github.json` preserve both checks. The
public release body matches `RELEASE-BODY.md` and records the completed live
deployment and remaining issues. Attached notes retain their packaging-time
status as immutable historical evidence.

The initial slow upload was interrupted after five assets completed. A resume
refused the already-uploaded phone MP4, so the remote asset list was read again
and only the two missing files were uploaded through a command-scoped existing
local proxy. All uploads finished successfully. No clobber, token exposure,
global proxy/TLS change, tag move or main-branch change occurred. See
`delivery.json` and `github-upload-progress.json` for preserved attempts.

The final follow-up commits documentation and evidence only. It is not
redeployed: the public runtime remains the verified tagged05b82ac package.
