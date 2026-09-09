# G5 frost-flame evolution evidence

Date: 2026-09-09. Tag: `mobile-next-g5-20260909`.
Baseline: `6aec45bcdb4605710b9fe03ad1781ad8d3da7d3e`.
Prior live runtime/rollback: `05b82accc53bcc2284e0f721922cec9c9185ed7d`,
Render deployment `dep-daggvhbl550s73bkiq30` (G4).

## Playable change

Evolution Journey adds H001 Frostflame: choose the form at Lv.3. Its basic
attack chills within125 for1.2s at55% attack, then fires an80%-attack flame
blade with one pierce. Awakening raises the frost radius to155 and pierce
to three. The skill chills within180 for2s at60% attack, then leaves a fixed
radius130 fire field at30% attack per pulse for3s. Awakening raises these
radii to220/180 and fire duration to5s. The gear-adjusted6s cooldown remains.
The ultimate spends100 gauge on a radius260 frost burst at200% attack with
3s chill, followed by a radius260 fire burst at400% attack. Frost/fire damage
sources and elemental scaling stay separate. The form guides paid G2_FROST
upgrades through Lv.3 and retains the Lv.8 + activeLv.3 awakening gate.

A011 gains Ringfire, a third mutually exclusive Lv.3 route: eight evenly
spaced fireballs, first ray using existing heroAim, speed300, radius9,
45% ordinary fireball damage each, explosion radius28 times range, existing
level/evolution/cooldown and P024 split. Advice explains both alternatives
and wasted directions when targets cluster on one side.

Thermalshock requires positive-level G2_FROST and any owned fire-tag active.
All fire sources then deal30% more damage to living, currently chilled normal
and elite enemies before existing damage resolution. Chill is not consumed
or extended; no recursive proc, expired-chill bonus, Boss bonus, Boss chill
or displacement is added. Form identity alone grants no bond. A cyan/orange
crossed-blade crest and distinct frost effects identify the new form.

The catalog now has three starters, eleven forms, twelve routes and eight
bonds. No new dependency, public debug UI, classic combat, legacy source,
script-order or save/schema change is included. Existing bounded collections,
once-only settlement, fresh/defeat zero stars, non-story star isolation and
Boss Loot priority remain covered by the existing checks.

## Automated evidence

Root: `evidence/G5/`. All attempts are retained; no browser retries or skips.

| Evidence | Result | Scope |
| --- | --- | --- |
| red.json | 13 expected failures | New behavior absent before implementation |
| green-01.json | 12 pass,1 fail | First implementation run; test used nonexistent cap fields |
| rules-01.json | 974/974 pass | Full rules/UI suite after correcting that test to established limits |
| natural-01 | 3/3 pass | Desktop1280x720, phone390x844, narrow320x844 |
| regression-01 | 51/51 pass | Storage, settlement, evolution, lifecycle and touch regressions |
| gates.json | Pass | Five ordered root gates, 49 legacy hashes, app types/build |

Desktop and phone use fresh saves and visible keyboard/native CDP touch input
to acquire Frostflame, Ringfire, Thermalshock and awakening, defeat the
encounter Boss, save rewards, retry with evolution reset, and reload progress.
Narrow verifies choices, alternatives, bond guide, touch, exit without reward
mutation and reentry. Both full matches win naturally; no battle state,
save, RNG or clock injection or time acceleration is used. All three finish
without game console, page or response errors. Effects off/on and pause are
included. The same readiness assertions as G4 are retained.

The 51 related integration cases include synthetic transaction/result fault
fixtures; they establish storage and component behavior, not natural battle
outcomes. They cover duplicate receipts, rollback, stale writes, concurrent
tabs, interrupted controls, viewport changes, remounts and missing assets.
The full historical browser suite is not rerun or claimed green.

The fresh Schema30 fixture remains
`c4903f476644792538691fef91d9d8da168c312d0b6aaadd21a637c4fb72c685`.
The existing Phaser chunk warning remains (1432.36kB / 378.19kB gzip).
No measured phone-performance improvement is claimed.

## Review and recordings

Independent read-only code review found no required corrections. It checked
frost-before-fire order, live-chill multiplication, owned-skill gates,
Boss/classic isolation, eight directions, modifiers, bounded collections,
destruction and advice. Optional stronger exact frost-damage/nonzero-aim
assertions and the existing skill-name conditional chain remain follow-up
test/structure improvements, not detected implementation defects.

All57 raw WebMs fully decode:54 executions plus3 second-tab recordings.
The full original-speed MP4s are314.84s desktop and319.00s phone, uncut.
Raw WebMs, timelines, choice logs and screenshots are preserved.
`recordings.json` records decode results, durations, byte sizes and SHA-256;
the packager verifies every source and ZIP entry. Narrow screenshots and the
phone contact sheet were visually reviewed: new choices, alternatives,
active bond, touch controls, combat and saved victory are visible.
The phone timeline selects the form at25.6s, Ringfire at27.4s, activates the
frost skill at38.9s, awakens at96.8s and shows saved victory at314.2s.

## Reproduce and delivery boundary

```powershell
cd apps/mobile-next
$env:G5_ATTEMPT = 'new-natural-check'
npx playwright test --config playwright.g5.config.ts frost-flame-recording.spec.ts
```

Use another unique attempt for the five related regression specs. The config
refuses to overwrite existing reports. Set G5_LIVE=1 for public URL tests.
`package-g5-release.py --media` prepares media; `--release` requires a clean
tagged checkout and matching Render manifest. Seven assets are prepared:
combined runtime ZIP, all-test-recordings ZIP, two full MP4s, preview PNG,
notes and SHA256SUMS. Remote publication and Render acceptance are pending
at packaging time; a documentation-only follow-up will record the results
without moving the runtime tag or replacing its assets.

Render settings were rechecked: same branch, empty root, existing build
command, dist/render publish directory and Auto-Deploy Off; editor cancelled
unchanged. Rollback uses the prior full G4 deployment above, preserving Git
history and saves. Legacy remains at `/`, preview at `/mobile-next/`.

Open gates: P2l fresh natural HP-death and stationary phone timeout; G4's
initial live desktop readiness timeout remains unexplained despite its
separate passing rerun. No assertions or balance are changed to force these
outcomes. Legacy favicon404, physical phones, performance/30-minute endurance,
remaining gameplay/audio parity and PWA/offline remain separate work.

## Public delivery verification

Runtime commit `821b90ca489e7d2e0ed1ea695f3c56025cedc563` and annotated tag
`mobile-next-g5-20260909` were pushed on the existing development branch.
Render deployment `dep-dagi1c740ujc73f9nikg` became Live at17:02:58 GMT+8 on
2026-09-09 after Clear build cache & deploy. The source commit matches the
tagged runtime. `local-http-01.json` and `live-http-01.json` each confirm all51
file hashes/sizes, both entries, legacy baseline and repository-path exclusion.
`render-deploy.txt` records the dashboard observations and unchanged settings.

The first public natural attempt, `delivery-live-01`, finished2/3 passed.
Desktop and narrow passed; phone failed the unchanged `guided` assertion.
Its saved victory screenshot shows awakened Frostflame, Thermalshock, Lv.18
and a279-second win. The choice log contains only one A011 upgrade, toLv.2;
Ringfire was not acquired before victory, so the guide validation requiring
that route never ran. No game console/page/HTTP errors were recorded. This
is incomplete target-build acceptance, not evidence of a broken settlement
or a natural HP-death. The report and full recording remain intact.
`live-recordings-01.json` preserves all three timelines/choices, full-decode
results and hashes. A separate unchanged phone-only natural run is recorded
under `delivery-live-phone-02`; it does not replace the first attempt.

That phone-only run passed1/1, without retries/skips, code changes, weakened
assertions, forced choices, injected state or time acceleration. It verified
Ringfire, Thermalshock, awakening, natural saved victory, retry reset and
reload persistence. The full video is344.08s. `live-recordings-02.json` records
its complete timeline and hash. All four public raw videos fully decode;
combined with the57 local originals,61 raw recordings are preserved. The
second phone's bond and result screenshots were visually inspected. Public
raw videos remain local; the immutable release recording ZIP contains the
original local acceptance evidence only. JSON reports/timelines are committed.

GitHub prerelease:
https://github.com/shiqinthao-ctrl/wanjie_wushuang/releases/tag/mobile-next-g5-20260909

Published at2026-09-09T09:24:08Z. All7 asset IDs, sizes and GitHub SHA-256
digests match the local originals; `github-draft.json` and `github.json`
preserve before/after publication checks. `RELEASE-BODY.md` is the verified
public description. Tag and attachments are unchanged. `delivery.json`
summarizes this delivery; `final-gates.json` records the final ordered checks.
The evidence-only follow-up is pushed separately and is not redeployed.
The in-app browser also loaded both public lobbies; the mobile lobby showed
three starters/eleven forms. That spot check reused the browser's existing
saves and is separate from the fresh automated runs. The local package
verification server was stopped after use. All previously listed open gates
remain open, including G4's unexplained startup timeout.
