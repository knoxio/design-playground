import { Button, Card, type PageMeta } from "@helix/ui";
import { invoices } from "../data/invoices";

export const meta: PageMeta = { title: "Home", order: 1 };

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demo Co — Invoices</h1>
          <p className="text-muted-foreground">A sample prototype page using the shared kit.</p>
        </div>
        <Button>New invoice</Button>
      </div>
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{invoice.customer}</p>
                <p className="text-sm text-muted-foreground">{invoice.id}</p>
              </div>
              <div className="flex items-center gap-4">
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
