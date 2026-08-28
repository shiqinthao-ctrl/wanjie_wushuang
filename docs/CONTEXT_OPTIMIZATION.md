# CONTEXT_OPTIMIZATION.md

## Active packet

Only these are intended for a normal task start:

| File | Bytes |
|---|---:|
| `AGENTS.md` | 739 |
| `TASK.md` | 782 |
| `handoff/STATE.md` | 914 |
| `docs/INDEX.md` | 678 |

Total active packet: **3113 bytes**.

Codex project instruction cap in `.codex/config.toml`: **8192 bytes**.

## Before → after

Previous root `AGENTS.md`: 2598 bytes  
Previous start prompt: 1271 bytes  
Previous root docs total: 9302 bytes

V3.1.2 no longer tells Codex to read all reference docs at startup.

## Workflow

1. `AGENTS.md`
2. `TASK.md`
3. `handoff/STATE.md` only for continuation
4. `docs/INDEX.md` only if routing is needed
5. Open one relevant `docs/reference/*` file/section only when necessary

## 413 prevention

- Never paste full repository files into chat if Codex can read them locally.
- Never paste previous thread history into a new thread.
- One thread = one focused task.
- Update `handoff/STATE.md` before starting a fresh thread.
- Use `npm run context` after editing agent/task docs.
