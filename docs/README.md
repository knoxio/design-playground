# Playground documentation

The Design Playground is a Vite + React app that wraps thin tooling around Claude
Code: a designer builds interactive client prototypes by talking to Claude, and
engineers later rebuild the real application from the PRD, the prototype, and
the exported tokens.

## Start here

- **New to the project?** Read [`overview/architecture.md`](overview/architecture.md),
  then keep [`overview/glossary.md`](overview/glossary.md) open.
- **A designer building prototypes** → [`guides/for-designers.md`](guides/for-designers.md)
- **A developer maintaining or extending the core** →
  [`guides/for-developers.md`](guides/for-developers.md)
- **Setting up the repo for the first time** →
  [`guides/getting-started.md`](guides/getting-started.md)
- **Deploying your own Cloudflare stack** →
  [`guides/cloudflare-setup.md`](guides/cloudflare-setup.md)
- **What's built vs planned** → [`roadmap.md`](roadmap.md)

## Map

| Folder                                             | What's in it                                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`overview/`](overview/)                           | The system model (`architecture.md`) and vocabulary (`glossary.md`).                     |
| [`guides/`](guides/)                               | How to use it: `getting-started`, `for-designers`, `for-developers`, `cloudflare-setup`. |
| [`reference/`](reference/)                         | The client folder contract, the skill registry, testing, and operations runbook.         |
| [`prds/`](prds/)                                   | One spec per buildable chunk, describing the **target** product.                         |
| [`adr/`](adr/)                                     | Architecture decision records — why the system is shaped as it is.                       |
| [`roadmap.md`](roadmap.md)                         | Build status: what exists, what's planned.                                               |
| [`implementation-plan.md`](implementation-plan.md) | The build plan for the planned work, phased, with tests.                                 |
| [`ui-backlog.md`](ui-backlog.md)                   | Design-system UI improvements, each gated by the trigger that justifies it.              |
| [`walkthrough.md`](walkthrough.md)                 | A full fictional engagement, end to end — the narrative _why_.                           |

## How the layers relate

- **ADRs** record decisions (why). **PRDs** specify capabilities (what to
  build). The **contract** (`reference/client-folder-contract.md`) is the
  structure skills and PRDs program against. **Skills**
  (`reference/skills.md`) are the operations that act on it, each justified by a
  PRD and constrained by ADRs. The **roadmap** tracks which PRDs are real yet.
- PRDs describe the target state; the roadmap is where "not built yet" lives, so
  the specs stay clean.
