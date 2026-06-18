import { Badge, type BadgeTone } from "@helix/ui";
import type { ConsignmentStatus as Status } from "../data/consignments";

const tones: Record<Status, BadgeTone> = {
  booked: "neutral",
  "in-transit": "brand",
  delivered: "positive",
  delayed: "negative",
};

export function ConsignmentStatus({ status }: { status: Status }) {
  return <Badge tone={tones[status]}>{status}</Badge>;
}

export function demo() {
  return (
    <div className="flex items-center gap-2">
      <ConsignmentStatus status="booked" />
      <ConsignmentStatus status="in-transit" />
      <ConsignmentStatus status="delivered" />
      <ConsignmentStatus status="delayed" />
    </div>
  );
}
