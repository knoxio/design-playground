# Architecture decision records

Retroactive ADRs for the Design Playground: the decisions that shape the
system, recorded so a future dev understands why it looks the way it does.
Each ADR follows Title / Status / Context / Decision / Consequences (with an
optional Alternatives note). They describe the current design in plain
present tense — the rationale sources are
[`../overview/architecture.md`](../overview/architecture.md) and the PRDs under
`../prds/`.

Most are implemented. Three (0010, 0011, 0013) are accepted but designed-
not-yet-built — the flows/states/addressing layer specified in
[`prd-10`](../prds/prd-10-flows-and-states.md).

| #    | Title                                        | Status                         | Governs                                                   |
| ---- | -------------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| 0001 | One app, clients as folders                  | Accepted                       | prd-01-client-lifecycle; overview/architecture            |
| 0002 | The filesystem is the registry               | Accepted                       | prd-01-client-lifecycle; reference/client-folder-contract |
| 0003 | Module boundary rules                        | Accepted                       | prd-01-client-lifecycle; prd-06-scoped-previews           |
| 0004 | Shared-kit mutation rule                     | Accepted                       | prd-02-design-system-theming                              |
| 0005 | Folder-scoped themes                         | Accepted                       | prd-02-design-system-theming                              |
| 0006 | Experiments, variants, graduation            | Accepted                       | prd-04-prototyping-experiments                            |
| 0007 | Scoped previews by physical exclusion        | Accepted                       | prd-06-scoped-previews                                    |
| 0008 | Access-based confidentiality                 | Accepted                       | prd-08-deployment-access                                  |
| 0009 | Automated testing layers                     | Accepted                       | reference/client-folder-contract; all PRDs                |
| 0010 | Pages are files or folders                   | Accepted (designed, not built) | prd-10-flows-and-states                                   |
| 0011 | States as colocated exports                  | Accepted (designed, not built) | prd-10-flows-and-states                                   |
| 0012 | At most one experiment per lineage           | Accepted                       | prd-04-prototyping-experiments; prd-10-flows-and-states   |
| 0013 | Canonical addressing scheme                  | Accepted (designed, not built) | prd-05-overlay-feedback; prd-10-flows-and-states          |
| 0014 | Claude-only authoring                        | Accepted                       | prd-01-client-lifecycle; prd-03-transcript-brief          |
| 0015 | E2E outside the pre-push gate                | Accepted                       | prd-06-scoped-previews; reference/client-folder-contract  |
| 0016 | The Cloudflare stack                         | Accepted                       | prd-08-deployment-access                                  |
| 0017 | The feedback engine is Mary's Claude session | Accepted                       | prd-05-overlay-feedback; prd-12-linear-integration        |
