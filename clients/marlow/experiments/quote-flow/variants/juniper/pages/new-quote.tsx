import { Button, type PageMeta } from "@helix/ui";

export const meta: PageMeta = { title: "Request quote", order: 3 };

const inputClass =
  "w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

function Field({
  label,
  placeholder,
  span,
}: {
  label: string;
  placeholder: string;
  span?: string;
}) {
  return (
    <div className={span}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input className={inputClass} placeholder={placeholder} />
    </div>
  );
}

export default function NewQuote() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Request a quote</h1>
        <Button>Submit</Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Everything on one screen — built for repeat shippers who quote daily.
      </p>
      <div className="rounded-md border border-border bg-surface p-4">
        <div className="grid grid-cols-4 gap-3">
          <Field label="Origin" placeholder="Sydney" span="col-span-2" />
          <Field label="Destination" placeholder="Perth" span="col-span-2" />
          <Field label="Pallets" placeholder="6" />
          <Field label="Weight (kg)" placeholder="2400" />
          <Field label="Pickup date" placeholder="2026-06-16" />
          <Field label="Reference" placeholder="PO-1182" />
          <Field label="Dangerous goods class" placeholder="None" span="col-span-2" />
          <Field label="Notes for carrier" placeholder="Tailgate required" span="col-span-2" />
        </div>
      </div>
    </div>
  );
}
