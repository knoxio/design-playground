# Roadmap and status

The PRDs describe the **target** product. This page is the single source of
truth for **what is actually built** versus planned. When a planned item ships,
flip its row here and the status header in its PRD.

Status: **Built** (shipped to `main`) · **Partial** (core built, an extension
planned) · **Planned** (specified, not yet built).

## Capabilities

| Area                                                     | Status                          | PRD                                          |
| -------------------------------------------------------- | ------------------------------- | -------------------------------------------- |
| Client scaffolding + filesystem discovery                | Built                           | [01](prds/prd-01-client-lifecycle.md)        |
| Design system & theming (4 scopes, galleries, live swap) | Built                           | [02](prds/prd-02-design-system-theming.md)   |
| Figma → theme import path                                | Built                           | [02](prds/prd-02-design-system-theming.md)   |
| Transcript → brief + PRD skeleton                        | Built                           | [03](prds/prd-03-transcript-brief.md)        |
| Experiments & variants, graduation-as-merge              | Built                           | [04](prds/prd-04-prototyping-experiments.md) |
| Experiments attached to pages / page-tree nav            | Built                           | [04](prds/prd-04-prototyping-experiments.md) |
| Comment overlay, thread service, MCP, apply loop         | Built                           | [05](prds/prd-05-overlay-feedback.md)        |
| Scoped per-client preview builds                         | Built                           | [06](prds/prd-06-scoped-previews.md)         |
| Handoff package                                          | Built (awaiting first real use) | [07](prds/prd-07-handoff.md)                 |
| Deployment & access (Cloudflare/Terraform)               | Built                           | [08](prds/prd-08-deployment-access.md)       |
| Viewport tool + client-view bottom toolbar               | Built                           | [09](prds/prd-09-viewport-tool.md)           |
| Flows (page = file or folder) & page states              | Built                           | [10](prds/prd-10-flows-and-states.md)        |
| Canonical addressing scheme                              | Built                           | [10](prds/prd-10-flows-and-states.md)        |
| Import from code                                         | Built                           | [11](prds/prd-11-import-from-code.md)        |
| Linear integration                                       | Built                           | [12](prds/prd-12-linear-integration.md)      |

## Testing

| Layer                                                    | Status  |
| -------------------------------------------------------- | ------- |
| Registry/contract unit tests                             | Built   |
| Shell-helper unit tests                                  | Built   |
| Render-smoke (every kit demo, page, component)           | Built   |
| Playwright e2e (internal + scoped, path-filtered CI job) | Built   |
| Worker API tests (Miniflare + D1, in the gate)           | Built   |
| Skill lint + mechanical-skill tests (in the gate)        | Built   |
| Judgment-skill evals (LLM-as-judge, nightly non-gating)  | Planned |
| Page "play" tests (Playwright runner + page `play`)      | Built   |

See [`reference/testing.md`](reference/testing.md) for the layer model.

## Open work

Tracked in priority order; detail in each PRD. The sequencing and per-item
build/test plan is in [`implementation-plan.md`](implementation-plan.md).

1. **Experiments attached to pages / page-tree model** — prerequisite for flows
   and states. [04](prds/prd-04-prototyping-experiments.md)
2. **Flows and states** — pages as files-or-folders, named states, the
   addressing scheme. [10](prds/prd-10-flows-and-states.md)
3. **Import from code** — scaffold a client folder from an existing app repo.
   [11](prds/prd-11-import-from-code.md)
4. **Linear integration** — ingest issues into threads/experiments.
   [12](prds/prd-12-linear-integration.md)
5. **Figma import validation** — exercise the existing path against a real file.
   [02](prds/prd-02-design-system-theming.md)
6. **Reusable domain data providers** — shared medical/legal/accounting mock
   data. Parked; lowest priority.
7. **Skill and play tests** — testing layers 2 and 3.
   [reference/testing.md](reference/testing.md)
