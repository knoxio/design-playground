import { Button, type PageMeta, type PlayTest } from "@helix/ui";
import { quotes } from "../data/quotes";

export const meta: PageMeta = { title: "Quotes", order: 2 };

export default function Quotes({
  rows = quotes,
  error,
}: { rows?: typeof quotes; error?: string } = {}) {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <Button>Request quote</Button>
      </div>
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left">
                <th className="px-3 py-2 font-medium text-muted-foreground">Quote</th>
                <th className="px-3 py-2 font-medium text-muted-foreground">Lane</th>
                <th className="px-3 py-2 font-medium text-muted-foreground">Pallets</th>
                <th className="px-3 py-2 font-medium text-muted-foreground">Weight</th>
                <th className="px-3 py-2 font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    No quotes yet — request one to get started.
                  </td>
                </tr>
              ) : (
                rows.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted">
                    <td className="px-3 py-2 font-mono text-xs">{q.id}</td>
                    <td className="px-3 py-2">{q.lane}</td>
                    <td className="px-3 py-2">{q.pallets}</td>
                    <td className="px-3 py-2">{q.weightKg} kg</td>
                    <td className="px-3 py-2 text-muted-foreground">{q.status}</td>
                    <td className="px-3 py-2 text-right font-medium">{q.amount ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const states = {
  empty: () => <Quotes rows={[]} />,
  error: () => <Quotes error="Couldn't load quotes — the carrier pricing API timed out." />,
};

export const play: PlayTest = async ({ getByRole }) => {
  await getByRole("heading", { name: "Quotes" }).expectVisible();
  await getByRole("button", { name: "Request quote" }).expectVisible();
};
