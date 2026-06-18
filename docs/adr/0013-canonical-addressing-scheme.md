# 0013 — Canonical addressing scheme

**Status:** Accepted

## Context

A reviewable surface is a point in a coordinate space with four orthogonal
axes: which design (Main or experiment + variant), which page, which step
(when the page is a flow), which state. Comments must anchor to a specific
surface and survive being reopened, shared, and handed off. Without one
canonical form, the same surface has several URLs and a comment cannot be
trusted to reopen what its author saw; the full design is
[`prd-10`](../prds/prd-10-flows-and-states.md).

## Decision

Every reviewable surface has **one canonical address**. The route encodes the
coordinate; the fragment anchors a comment within it:

```
/c/<client>/[x/<experiment>/<variant>/]p/<page>[/<step>][?state=<state>][#<anchor>]
```

- no `x/…` segment → Main; `x/quote-flow/banksia` → that variant.
- `/<step>` present only when the page resolves to a flow (ADR-0010).
- `?state=empty` selects a named state (ADR-0011); absent → the default.
- `#<anchor>` → the element/token/kit/selector anchor of a comment.

The single `x/<experiment>/<variant>` segment is what the
one-experiment-per-lineage rule (ADR-0012) guarantees is sufficient.
Switching one coordinate preserves the others best-effort, falling back to
the nearest valid parent when the target lacks them.

## Consequences

- "The empty state of the schedule step of the wizard variant of
  request-quote, anchored to the submit button" is a single URL.
- The comment thread store already carries free-form `route`, `anchor`, and
  `viewport`, so this is a routing and navigation concern, not a thread-API
  change (ADR-0017).
- Handoff and scoped-preview routing consume the same address; one parser
  serves every consumer.
