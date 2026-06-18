# 0014 — Claude-only authoring

**Status:** Accepted

## Context

The sole design user (Mary) is a designer and PM, not an engineer, and never
edits code directly. All authoring happens through Claude Code sessions plus
direct interaction with the running prototype. This constraint is load-bearing
for every guardrail: output quality cannot depend on Mary's prompting, and the
failure mode to prevent is a repo Claude has tangled with no engineer in the
loop and no way for Mary to recover.

## Decision

Authoring is Claude plus the running prototype — there is no code editor in
Mary's loop. The system is shaped around that:

- **Skills own the recurring operations** (new client, new theme, new
  experiment, apply feedback, decide/archive, handoff) so output quality does
  not depend on prompting.
- **Mechanics in scripts, judgment in skills.** Anything deterministic —
  scaffolds, exports, inventories, the scoped-build check — is a `pnpm`
  script a human can run without Claude; skills drive the scripts and own
  only the judgment steps.
- **All work flows through PRs;** `clients/**`-only changes merge on green
  (ADR-0003). Recovery is a button (discard an iteration), not a git command.
- **The root `CLAUDE.md` carries the rules Claude enforces** on Mary's
  behalf: the boundary rules (ADR-0003), the kit-mutation rule (ADR-0004),
  file placement.

## Consequences

- The codebase is the document model: Claude edits JSX and tokens, git is
  persistence and history, the registry provides variant switching, previews
  are share links. No separate document format, canvas, or codegen pipeline
  exists.
- Determinism is recoverable without an agent: a human engineer can run any
  script directly at handoff.
- The guardrails (boundaries, kit-mutation rule, inert YAML, scoped builds)
  exist precisely because a helpful agent driven by a non-coder will
  otherwise reach across boundaries.
