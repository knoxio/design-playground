import { kitManifest, type KitCategory } from "@design/ui";

const categoryOrder: KitCategory[] = [
  "actions",
  "forms",
  "display",
  "feedback",
  "navigation",
  "overlay",
];
const categoryLabels: Record<KitCategory, string> = {
  actions: "Actions",
  forms: "Forms",
  display: "Display",
  feedback: "Feedback",
  navigation: "Navigation",
  overlay: "Overlay",
};

/** The shared-kit catalog, manifest-driven and grouped by category. */
export function KitCatalog() {
  return (
    <>
      {categoryOrder.map((category) => {
        const entries = kitManifest.filter((e) => e.category === category);
        if (entries.length === 0) return null;
        return (
          <div key={category} className="mb-10">
            <h3 className="mb-6 border-b border-border pb-2 font-display text-sm font-semibold tracking-widest text-muted-foreground uppercase">
              {categoryLabels[category]} · {entries.length}
            </h3>
            {entries.map((entry) => (
              <section key={entry.id} data-dp-kit={entry.id} className="mb-8">
                <h4 className="mb-2 text-base font-semibold">{entry.id}</h4>
                <p className="mb-3 text-sm text-muted-foreground">{entry.description}</p>
                {entry.demo()}
              </section>
            ))}
          </div>
        );
      })}
    </>
  );
}
