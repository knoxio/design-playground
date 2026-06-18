import { Card, type PageMeta } from "@design/ui";
import { wizardInput } from "../../../../shared/wizard";

export const meta: PageMeta = { title: "Schedule", order: 3 };

export default function Schedule() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <Card title="When should it move?">
        <div className="space-y-4">
          <label className="block" htmlFor="pickup-date">
            <span className="mb-1 block text-sm font-medium">Pickup date</span>
            <input id="pickup-date" type="date" className={wizardInput} />
          </label>
          <label className="block" htmlFor="pickup-window">
            <span className="mb-1 block text-sm font-medium">Pickup window</span>
            <select id="pickup-window" className={wizardInput} defaultValue="anytime">
              <option value="anytime">Anytime</option>
              <option value="morning">Morning (6am–12pm)</option>
              <option value="afternoon">Afternoon (12pm–6pm)</option>
            </select>
          </label>
          <label className="block" htmlFor="reference">
            <span className="mb-1 block text-sm font-medium">Your reference (optional)</span>
            <input id="reference" className={wizardInput} placeholder="PO-1842" />
          </label>
        </div>
      </Card>
    </div>
  );
}
