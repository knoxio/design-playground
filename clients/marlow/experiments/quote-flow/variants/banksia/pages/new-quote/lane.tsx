import { Card, type PageMeta } from "@helix/ui";
import { wizardInput } from "../../../../shared/wizard";

export const meta: PageMeta = { title: "Lane", order: 1 };

export default function Lane() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <Card title="Where is it going?">
        <div className="space-y-4">
          <label className="block" htmlFor="origin">
            <span className="mb-1 block text-sm font-medium">Origin</span>
            <input id="origin" className={wizardInput} placeholder="Sydney" />
          </label>
          <label className="block" htmlFor="destination">
            <span className="mb-1 block text-sm font-medium">Destination</span>
            <input id="destination" className={wizardInput} placeholder="Perth" />
          </label>
        </div>
      </Card>
    </div>
  );
}
