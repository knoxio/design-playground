import { Card, type PageMeta } from "@design/ui";

export const meta: PageMeta = { title: "Review", order: 4 };

const summary = [
  { label: "Lane", value: "Sydney → Perth" },
  { label: "Consignment", value: "6 pallets · 4,200 kg" },
  { label: "Dangerous goods", value: "No" },
  { label: "Pickup", value: "Mon 15 Jun · anytime" },
  { label: "Your reference", value: "PO-1842" },
];

export default function Review() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <Card title="Review your quote request">
        <div className="space-y-4">
          <dl className="divide-y divide-border rounded-md border border-border">
            {summary.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-3 py-2">
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                <dd className="text-sm font-medium tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            Carrier pricing usually comes back within one business day. You'll see the quote on your
            Quotes page as soon as it lands.
          </p>
        </div>
      </Card>
    </div>
  );
}
