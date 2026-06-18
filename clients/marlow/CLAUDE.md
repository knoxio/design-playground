# Marlow Freight — Client Brief

> Fictional client (the docs walkthrough engagement, made real as a second
> playground exercise). Read before any prototyping work for this client.

## Who they are

Mid-size freight broker. Customers currently email or call for quotes and
shipment status; ops staff burn hours relaying information that should be
self-service.

## The problem

No customer-facing portal. They want customers to request a quote, accept and
book it, track consignments, and see invoices — without calling.

## Agreed scope

- Dashboard: active consignments + pending quotes at a glance
- Quote request flow (contested — see `quote-flow` experiment)
- Quote list
- Consignment tracking
- Invoices (later phase, not yet prototyped)

## Out of scope

- Carrier-side tooling
- Live GPS tracking (carrier ETAs come from a slow upstream API — do not
  promise live updates in the UI)

## Design system decisions

- Navy `#1b2a4a`, amber accent, dense and utilitarian — "more like a terminal
  than a brochure" (ops lead, kickoff). `themes/default.yaml`
- Softer alternate on file for comparison: `themes/relaxed.yaml`
- Tabular numbers everywhere money or IDs appear

## Vocabulary

- "Consignment", never "package" or "shipment"
- "Carrier", never "vendor"
- "Quote", never "estimate"

## Key people

- Ops lead — pushed the dense single-form quote flow
- MD — wants the guided wizard; final say on brand

## Open questions

- Invoice payment: link out to their existing biller, or in-portal?

## Decision log

(append-only; one line per decided experiment)
