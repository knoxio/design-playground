import { Badge, type BadgeTone } from "@helix/ui";
import type { InvoiceStatus } from "../data/invoices";

const tones: Record<InvoiceStatus, BadgeTone> = {
  paid: "positive",
  due: "neutral",
  overdue: "negative",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={tones[status]}>{status}</Badge>;
}

export function demo() {
  return (
    <div className="flex items-center gap-2">
      <InvoiceStatusBadge status="paid" />
      <InvoiceStatusBadge status="due" />
      <InvoiceStatusBadge status="overdue" />
    </div>
  );
}
