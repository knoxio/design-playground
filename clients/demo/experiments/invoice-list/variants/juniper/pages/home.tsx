import { Button, Card, type PageMeta } from "@helix/ui";
import { InvoiceStatusBadge } from "../../../../../components/InvoiceStatusBadge";
import { invoices } from "../../../../../data/invoices";

export const meta: PageMeta = { title: "Home", order: 1 };

export default function Home() {
  const open = invoices.filter((i) => i.status !== "paid");
  const overdue = invoices.filter((i) => i.status === "overdue");
  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Everything outstanding, at a glance.</p>
        </div>
        <Button>New invoice</Button>
      </div>
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-muted-foreground">Open</p>
          <p className="text-2xl font-bold">{open.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-destructive">{overdue.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Paid this month</p>
          <p className="text-2xl font-bold">{invoices.length - open.length}</p>
        </Card>
      </div>
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{invoice.customer}</p>
                <p className="text-sm text-muted-foreground">
                  {invoice.id} · due {invoice.dueDate}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <InvoiceStatusBadge status={invoice.status} />
                <span className="font-semibold">{invoice.amount}</span>
                <Button variant="secondary">View</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
