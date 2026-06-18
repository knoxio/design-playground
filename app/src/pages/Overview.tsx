import { Card } from "@design/ui";
import { Link } from "react-router";
import { clients, globalThemeErrors } from "../registry/clients";
import { OrientationCard } from "./OrientationCard";

export function Overview() {
  return (
    <div className="mx-auto max-w-4xl animate-fade-in p-8">
      <div className="mb-10 flex items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[0.12em] uppercase">
            Design <span className="font-light text-muted-foreground">Playground</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Clients, experiments, and prototypes ·{" "}
            <Link
              to="/tokens"
              className="text-accent-foreground transition-colors duration-150 hover:text-primary"
            >
              Tokens →
            </Link>{" "}
            ·{" "}
            <Link
              to="/components"
              className="text-accent-foreground transition-colors duration-150 hover:text-primary"
            >
              Components →
            </Link>{" "}
            ·{" "}
            <Link
              to="/icons"
              className="text-accent-foreground transition-colors duration-150 hover:text-primary"
            >
              Icons →
            </Link>
          </p>
        </div>
      </div>
      <OrientationCard />
      {globalThemeErrors.length > 0 ? (
        <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-3">
          <p className="mb-1 text-xs font-semibold text-destructive uppercase">
            Global theme errors
          </p>
          {globalThemeErrors.map((error) => (
            <p key={error} className="text-xs break-words">
              {error}
            </p>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {clients.map((client) => {
          const active = client.experiments.filter((e) => e.status === "active").length;
          const firstPage = client.pages[0];
          const card = (
            <Card
              title={client.name}
              className={
                client.errors.length > 0
                  ? "border-destructive"
                  : "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              }
            >
              <p className="text-sm text-muted-foreground">
                {client.pages.length} page{client.pages.length === 1 ? "" : "s"} · {active} active
                experiment{active === 1 ? "" : "s"}
              </p>
              {client.errors.length > 0 ? (
                <div className="mt-3 space-y-1">
                  {client.errors.map((error) => (
                    <p key={error} className="text-xs break-words text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              ) : null}
            </Card>
          );
          return firstPage ? (
            <Link key={client.id} to={`/c/${client.id}/p/${firstPage.id}`}>
              {card}
            </Link>
          ) : (
            <div key={client.id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
