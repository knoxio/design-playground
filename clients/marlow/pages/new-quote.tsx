import { Button, Card, type PageMeta } from "@design/ui";

export const meta: PageMeta = { title: "Request quote", order: 3 };

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export default function NewQuote() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="mb-1 text-2xl font-bold">Request a quote</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Placeholder flow — the real shape is being decided in the quote-flow experiment.
      </p>
      <Card>
        <div className="space-y-4">
          <label className="block" htmlFor="lane">
            <span className="mb-1 block text-sm font-medium">Lane</span>
            <input id="lane" className={inputClass} placeholder="Sydney → Perth" />
          </label>
          <label className="block" htmlFor="pallets">
            <span className="mb-1 block text-sm font-medium">Pallets</span>
            <input id="pallets" className={inputClass} placeholder="6" />
          </label>
          <Button>Submit</Button>
        </div>
      </Card>
    </div>
  );
}
