import { Button, Card, type PageMeta } from "@helix/ui";
import { ConsignmentStatus } from "../../../../../components/ConsignmentStatus";
import { consignments } from "../../../../../data/consignments";

export const meta: PageMeta = { title: "Dashboard", order: 1 };

export default function Dashboard() {
  const active = consignments.filter((c) => c.status !== "delivered");
  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-2 inline-block rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
        Rebrand preview
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations</h1>
          <p className="text-sm text-muted-foreground">
            Same dashboard, new identity — judge the brand, not the layout.
          </p>
        </div>
        <Button>Request quote</Button>
      </div>
      <Card title="Active consignments">
        <div className="space-y-2">
          {active.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span className="font-mono text-xs">{c.id}</span>
              <span className="text-muted-foreground">
                {c.origin} → {c.destination} · {c.carrier}
              </span>
              <span className="text-muted-foreground">ETA {c.eta}</span>
              <ConsignmentStatus status={c.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
