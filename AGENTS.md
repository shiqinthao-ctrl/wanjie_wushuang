# AGENTS.md

- Execute only `TASK.md`.
- Do not preload `archive/` or `docs/reference/`; use `docs/INDEX.md` to read one relevant reference only when needed.
- Preserve Schema30 saves, fresh 0-star chapters, defeat=0 star, non-story star isolation, one settlement per run, and V3.0 safety fixes.
- Keep ordered script loading unless the task explicitly scopes migration.
- Prefer merging existing logic; avoid adding new `_vXXOld*` wrapper layers.
- No public Debug UI. No new dependency unless TASK explicitly requires it.
- Before completion run: `npm run check && npm run smoke && npm run audit && npm run context && npm run archive:verify`.
- Update `handoff/STATE.md` after the task.
