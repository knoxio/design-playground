import { kitManifest } from "@helix/ui";
import { useParams } from "react-router";
import { getClient } from "../registry/clients";
import type { ClientComponentEntry } from "../registry/types";
import { KitCatalog } from "./KitCatalog";

function ComponentCard({ component, scope }: { component: ClientComponentEntry; scope: string }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
        <p className="font-mono text-sm">{component.id}</p>
        <span className="flex items-center gap-2">
          {component.promoteCandidate ? (
            <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              ★ promotion candidate
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground">{scope}</span>
        </span>
      </div>
      <div className="p-6">
        {component.demo ? (
          <component.demo />
        ) : (
          <p className="text-sm text-muted-foreground">
            No <span className="font-mono">demo</span> export — add one to preview here.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Every component reachable from this client, separated by scope — the
 * component ladder rendered: client → experiment-shared → shared kit.
 */
export function ComponentsGallery() {
  const { clientId } = useParams();
  const client = getClient(clientId);
  if (!client) return null;

  const experimentsWithComponents = client.experiments.filter(
    (e) => e.status === "active" && e.components.length > 0,
  );

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-1 text-2xl font-bold">Components</h1>
      <p className="mb-8 text-muted-foreground">
        Everything this client can use, narrowest scope first. Starred client components are
        candidates for promotion into the shared kit.
      </p>

      <h2 className="mb-4 border-b border-border pb-2 font-display text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        This client · {client.components.length}
      </h2>
      {client.components.length === 0 ? (
        <p className="mb-10 text-sm text-muted-foreground">
          None yet. Client components live in <span className="font-mono">components/</span> and may
          export a zero-prop <span className="font-mono">demo</span> for this gallery.
        </p>
      ) : (
        <div className="mb-10 space-y-6">
          {client.components.map((component) => (
            <ComponentCard key={component.id} component={component} scope="client" />
          ))}
        </div>
      )}

      {experimentsWithComponents.map((exp) => (
        <div key={exp.id}>
          <h2 className="mb-4 border-b border-border pb-2 font-display text-sm font-semibold tracking-widest text-muted-foreground uppercase">
            Experiment · {exp.name} · {exp.components.length}
          </h2>
          <div className="mb-10 space-y-6">
            {exp.components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                scope={`experiments/${exp.id}/shared`}
              />
            ))}
          </div>
        </div>
      ))}

      <h2 className="mb-4 border-b border-border pb-2 font-display text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        Shared kit · {kitManifest.length}
      </h2>
      <KitCatalog />
    </div>
  );
}
