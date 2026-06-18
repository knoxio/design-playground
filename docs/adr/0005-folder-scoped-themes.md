# 0005 — Folder-scoped themes

**Status:** Accepted

## Context

A theme is a complete token set — colors, type scale, density, radii,
shadows, numeric variants — applied to the prototype by runtime CSS-variable
injection. Themes exist at several reaches: the house set every client can
use, a client's own brand, a rebrand exploration that should not pollute the
client's theme list, a single variant's experimental palette. A flat theme
namespace would force every exploratory theme into the client's permanent
list and offer no place for an experiment's theme to live and die with it.

## Decision

A `themes/` folder may exist at four layers; a theme is exposed only within
its layer's scope:

| Layer      | Location                    | Exposed                            |
| ---------- | --------------------------- | ---------------------------------- |
| Global     | repo-root `themes/`         | every client                       |
| Client     | `clients/<id>/themes/`      | everywhere in that client          |
| Experiment | `experiments/<exp>/themes/` | only while viewing that experiment |
| Variant    | `.../variants/<v>/themes/`  | only while viewing that variant    |

A theme is placed at the narrowest scope that needs it. Resolution runs
variant → experiment → client → global. The dock's switcher lists exactly
the current scope chain, grouped by layer, globals last. (Exception: the
design-system galleries expose every theme of the client, labeled by owner,
so any theme can be judged against the kit without visiting its scope.)

The playground chrome — shell, dock, overview — is Design-branded,
client-agnostic, and CSS-isolated. A client theme styles the prototype
canvas only; **chrome is never client-themed**, so the dark Design frame
visibly ends where the client's product begins.

## Consequences

- A rebrand experiment carries its own theme without adding to the client's
  list; archiving the experiment takes the theme with it.
- Graduation moves a theme up a scope: deciding an experiment whose declared
  `theme` lives in experiment/variant scope relocates that file into the
  client's `themes/`, because Main now embodies the direction (ADR-0006).
- The token schema is core-owner territory; it is never extended to satisfy
  one client. A client tunes values, not the shape.
