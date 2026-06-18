import { Card, type PageMeta } from "@helix/ui";
import { wizardInput } from "../../../../shared/wizard";

export const meta: PageMeta = { title: "Freight", order: 2 };

export default function Freight() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <Card title="What's in the consignment?">
        <div className="space-y-4">
          <label className="block" htmlFor="pallets">
            <span className="mb-1 block text-sm font-medium">Pallets</span>
            <input id="pallets" className={wizardInput} placeholder="6" inputMode="numeric" />
          </label>
          <label className="block" htmlFor="weight">
            <span className="mb-1 block text-sm font-medium">Total weight (kg)</span>
            <input id="weight" className={wizardInput} placeholder="4,200" inputMode="numeric" />
          </label>
          <label className="block" htmlFor="dangerous-goods">
            <span className="mb-1 block text-sm font-medium">Dangerous goods</span>
            <select id="dangerous-goods" className={wizardInput} defaultValue="no">
              <option value="no">No</option>
              <option value="yes">Yes — DG declaration to follow</option>
            </select>
          </label>
        </div>
      </Card>
    </div>
  );
}
