# 0002 — The filesystem is the registry

**Status:** Accepted

## Context

The playground discovers clients, pages, themes, experiments, and variants
at runtime. A designer who never edits code adds these through Claude. Any
registration step — a manifest to edit, an index to append to, an id field
to keep in sync — is a place the registry drifts out of step with the tree
and a place a non-coder's edit silently breaks discovery.

## Decision

The filesystem is the registry. Entities are discovered by convention from
their location and filename:

- `clients/<id>/` is a client; `<id>` is the id — there is no id field.
- `pages/<page-id>.tsx` is a page; the filename is the route segment.
- every YAML in a `themes/` folder is a theme; the filename is its id.
- `experiments/<exp>/variants/<v>/` are experiments and variants.

YAML files hold only facts that cannot be derived from the tree (a client's
display name, its default theme, an experiment's decision). They are **data
only**: no logic, no imports. Everything behavioral is TypeScript.

`app/src/registry/discover.ts` globs the tree, validates each file against a
Zod schema, and emits typed entries plus an `errors[]` array. A malformed
file degrades to an error card naming the file and the violation; it never
white-screens the app, and other clients are unaffected.

## Consequences

- Adding a page, theme, or variant is adding a file. There is no second
  place to update and nothing to drift.
- YAML being inert makes a whole class of boundary violations impossible
  rather than merely forbidden — a data file cannot import across a boundary
  because it cannot import at all. Plain scripts (handoff, promotion lists)
  read it without a bundler.
- The contract is enforceable as code: `errors[]` is the client-folder
  contract written as assertions, and the discovery tests (ADR-0009) check
  each rule against fixture folders.
- Relationships are filename-derived, never declared — a variant page
  overrides a Main page purely by sharing its name (ADR-0006).
