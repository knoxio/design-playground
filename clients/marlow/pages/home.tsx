import { Button, Card, type PageMeta, type PlayTest } from "@helix/ui";
import { ConsignmentStatus } from "../components/ConsignmentStatus";
import { consignments } from "../data/consignments";
import { quotes } from "../data/quotes";

export const meta: PageMeta = { title: "Dashboard", order: 1 };

export default function Dashboard({
  consignmentList = consignments,
  quoteList = quotes,
}: { consignmentList?: typeof consignments; quoteList?: typeof quotes } = {}) {
  const active = consignmentList.filter((c) => c.status !== "delivered");
  const pending = quoteList.filter((q) => q.status === "pending" || q.status === "quoted");
  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {active.length} active consignments · {pending.length} quotes awaiting action
          </p>
        </div>
        <Button>Request quote</Button>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card title="Active consignments">
          <div className="space-y-2">
            {active.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{c.id}</span>
                <span className="text-muted-foreground">
                  {c.origin} → {c.destination}
                </span>
                <ConsignmentStatus status={c.status} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Quotes awaiting action">
          <div className="space-y-2">
            {pending.map((q) => (
              <div key={q.id} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{q.id}</span>
                <span className="text-muted-foreground">{q.lane}</span>
                <span className="font-medium">{q.amount ?? "pending"}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Delayed">
        {consignmentList
          .filter((c) => c.status === "delayed")
          .map((c) => (
            <p key={c.id} className="text-sm">
              <span className="font-mono text-xs">{c.id}</span> — {c.origin} → {c.destination} via{" "}
              {c.carrier}, new ETA {c.eta}
            </p>
          ))}
      </Card>
    </div>
  );
}

export const states = {
  empty: () => <Dashboard consignmentList={[]} quoteList={[]} />,
};

export const play: PlayTest = async ({ getByRole, getByText }) => {
  await getByRole("heading", { name: "Dashboard" }).expectVisible();
  await getByText("Active consignments").expectVisible();
};
