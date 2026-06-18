import { Button, type PageMeta } from "@design/ui";
import { invoices, type InvoiceStatus } from "../../../../../data/invoices";

export const meta: PageMeta = { title: "Home", order: 1 };

const statusStyles: Record<InvoiceStatus, string> = {
  paid: "text-muted-foreground",
  due: "text-accent-foreground",
  overdue: "text-destructive font-semibold",
};

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} records</p>
        </div>
        <Button>New invoice</Button>
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-left">
              <th className="px-3 py-2 font-medium text-muted-foreground">Invoice</th>
              <th className="px-3 py-2 font-medium text-muted-foreground">Customer</th>
              <th className="px-3 py-2 font-medium text-muted-foreground">Status</th>
              <th className="px-3 py-2 font-medium text-muted-foreground">Due</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted">
                <td className="px-3 py-2 font-mono text-xs">{invoice.id}</td>
                <td className="px-3 py-2">{invoice.customer}</td>
                <td className={`px-3 py-2 ${statusStyles[invoice.status]}`}>{invoice.status}</td>
                <td className="px-3 py-2 text-muted-foreground">{invoice.dueDate}</td>
                <td className="px-3 py-2 text-right font-medium">{invoice.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Tip: flip the theme to <span className="font-mono">dense</span> — this layout is built for
        it (tabular numbers, compact spacing).
      </p>
    </div>
  );
}
