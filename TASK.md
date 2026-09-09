# TASK.md - R1a isolated chapter contracts

Status: complete. R0 accd764; deployed G5 runtime 821b90c.
Implement only the first R1 foundation slice from tasks/game-remediation.

## Scope
- Add typed chapter1-v1 preparation, CH001 stage catalog, independent H001/
  H010/H012 startup values and starting skills; no legacy growth calculation.
- Add optional version-1 mobileChapter data: fresh progress, discoveries,
  charms and capped reports. Validate known fields, preserve unknown fields;
  future versions stay importable/exportable but cannot be played or written.
- First-stage settlement adapter must bind the original slot/run, commit the
  report/progress/unlocks and receipt together, and reject invalid finals.
  Duplicate calls, abort/retry, response loss, reload and stale writers tested.
- Stage 2/3 are catalog contracts only. No chapter gameplay entry yet: actual
  combat/progression/charms/art/audio/other stages remain separate R1/R3 work.
- No new dependency, public debug UI, legacy source, archive, old settlement
  formula, deployment, or immutable release modification.
- Preserve Schema30, fresh/defeat zero stars, non-story isolation, one settlement,
  Boss Loot priority, V3.0 safety fixes and ordered scripts.

## Acceptance
1. Meaningful unit tests first; real IndexedDB browser tests use clearly labeled
   synthetic final-run inputs, never claim natural gameplay from these fixtures.
2. Old saves/import backups and unknown fields survive; rich and fresh legacy
   accounts receive identical chapter preparation. Failed imports do not replace.
3. Run check, smoke, audit, context, archive:verify in order; types, full rules,
   production build and focused browser regression; preserve all attempts.
4. Record results/recordings and limitations, update five handoff fields,
   commit and push codex/first-chapter-remediation. Keep G5 live on Render.
5. Next slice R1b: new progression and GameCore integration, then R1c combat.
