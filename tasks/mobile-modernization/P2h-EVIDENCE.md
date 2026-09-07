# P2h timed chests and evolution

Effective ST001-01 rewards are offered at 90, 210 and 300 seconds. Readiness
does not pause combat: the player explicitly opens each chest and chooses one
of three options. The choice suspends simulation, clears movement and rejects
duplicate or invalid tokens. Background pause resumes the same choice. Existing
level and encounter choices prevent chest claims.

Fusion candidates precede evolution candidates in original configuration order.
Remaining slots use the original owned-skill upgrade/gear rules. Evolution flags
remain after fusion. Purple chest gear and gold encounter gear share the run's
loot array; persistence awaits the settlement slice. No balancing changes.

## Rule evidence

The isolated legacy Chrome capture records eight candidate-order cases, claim
guards, purple gear and RNG, six evolved skill attacks and F001/F002/F004 fusion
attacks. These are synthetic fixtures, not natural gameplay acceptance.

Fusion pulses preserve the 3.4s clock, including clock advancement before any
fusion is acquired. F001 trails apply to ordinary vortices before expiry
removal. F002 retains meteor RNG and default color. F004 retains the original
eight-shot angle, pierce and explosion parameters. The director counts fusions.

The legacy random comparator remains intact. Node validates owned upgrades;
an isolated Chrome fixture checks exact skill/passive results and RNG calls.
TimedChests tests retain the Boss Loot claim guard for the next slice; GameCore
does not yet have a Boss Loot state to connect to that guard.

## Validation status

Legacy five gates, 30/30 archives, 49/49 baseline hashes, strict types,
836/836 rules and production build passed. All 54 Chrome paths passed (12.4m)
across desktop, 390px and 320px portrait layouts. Ready and choice screenshots
were inspected at all three sizes; all options are visible without overflow.
Natural browser paths use real keyboard/touch input through 45s encounters and
ordinary level choices to reach the first timed chest. No battle state or time
injection is used by those paths. Advanced form/clock cases are synthetic.

## Remaining boundary

P2 requires B001, Boss Loot, kill gear, atomic settlement and a natural complete
stage/retry path. Full content/audio, physical phones, thermal endurance and
PWA remain pending. Phone-size Chrome tests do not establish physical-device
acceptance. Legacy code, entry, saves and dependency lockfiles are preserved.
Lazy battle mount is 371.09 KB gzip; the existing large-chunk warning remains.
No performance gain or production release is claimed.
