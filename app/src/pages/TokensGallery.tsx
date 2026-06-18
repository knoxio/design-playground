import { spacingForDensity, type TokenSet } from "@design/ui";
import { CopyButton } from "../components/CopyButton";
import { useThemeTokens } from "../shell/ClientTheme";

const typeSteps = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"] as const;
const typeClasses: Record<(typeof typeSteps)[number], string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};
const weightSteps = [400, 500, 600, 700];
const spacingSteps = [1, 2, 4, 6, 8, 12, 16, 24];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs text-muted-foreground">{children}</span>;
}

function ColorsSection({ tokens }: { tokens: TokenSet }) {
  return (
    <Section title="Colors">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(tokens.colors).map(([key, value]) => (
          <div
            key={key}
            data-dp-token={`colors.${key}`}
            className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2"
          >
            <span
              className="h-8 w-8 shrink-0 rounded-md border border-border"
              style={{ backgroundColor: value }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{key}</p>
              <Mono>--color-{key}</Mono>
            </div>
            <Mono>{value}</Mono>
            <CopyButton text={value} />
          </div>
        ))}
      </div>
    </Section>
  );
}

function TypeSection({ tokens }: { tokens: TokenSet }) {
  return (
    <Section title="Type">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span data-dp-token="type.sans">
          sans <Mono>{tokens.type.sans}</Mono> <CopyButton text={tokens.type.sans} />
        </span>
        <span data-dp-token="type.mono">
          mono <Mono>{tokens.type.mono}</Mono>
        </span>
        <span data-dp-token="type.numbers">
          numbers <Mono>{tokens.type.numbers}</Mono>
        </span>
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-surface">
        {typeSteps.map((step) => {
          const { size, lineHeight } = tokens.type.scale[step];
          return (
            <div
              key={step}
              data-dp-token={`type.scale.${step}`}
              className="flex items-baseline gap-4 border-b border-border px-3 py-2 last:border-0"
            >
              <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">{step}</span>
              <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">
                {size} / {lineHeight}
              </span>
              <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">
                {typeClasses[step]}
              </span>
              <p className={`min-w-0 truncate ${typeClasses[step]}`}>
                The quick brown fox — 0123456789
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-6">
        {weightSteps.map((w) => (
          <span key={w} style={{ fontWeight: w }}>
            {w} weight
          </span>
        ))}
      </div>
    </Section>
  );
}

function SpacingSection({ tokens }: { tokens: TokenSet }) {
  const base = spacingForDensity(tokens.density);
  return (
    <Section title="Spacing">
      <p data-dp-token="density" className="mb-3 text-sm text-muted-foreground">
        density <Mono>{tokens.density}</Mono> · base unit <Mono>{base}</Mono> — every spacing
        utility is <Mono>calc({base} × n)</Mono>
      </p>
      <div data-dp-token="density" className="space-y-1.5">
        {spacingSteps.map((n) => (
          <div key={n} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">
              {n}
            </span>
            <span
              className="h-3 rounded-xs bg-primary/70"
              style={{ width: `calc(var(--spacing) * ${n})` }}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

function ScaleSection({
  title,
  tokenGroup,
  entries,
  render,
}: {
  title: string;
  tokenGroup: string;
  entries: [string, string][];
  render: (key: string, value: string) => React.ReactNode;
}) {
  return (
    <Section title={title}>
      <div className="flex flex-wrap gap-6">
        {entries.map(([key, value]) => (
          <div key={key} data-dp-token={`${tokenGroup}.${key}`} className="text-center">
            {render(key, value)}
            <p className="mt-1">
              <Mono>{key}</Mono> <Mono>{value.length > 24 ? `${value.slice(0, 24)}…` : value}</Mono>{" "}
              <CopyButton text={value} />
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/**
 * The token spec sheet under the active theme — values shown and copyable,
 * so it doubles as handoff material. Used per-client and at /tokens.
 */
export function TokensGallery() {
  const tokens = useThemeTokens();
  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-1 text-2xl font-bold">Tokens</h1>
      <p className="mb-8 text-muted-foreground">
        The design system's foundations under the active theme — copy any value.
      </p>

      <ColorsSection tokens={tokens} />
      <TypeSection tokens={tokens} />
      <SpacingSection tokens={tokens} />
      <ScaleSection
        title="Radii"
        tokenGroup="radii"
        entries={Object.entries(tokens.radii)}
        render={(key) => (
          <div
            className="h-16 w-16 border border-border bg-accent"
            style={{ borderRadius: `var(--radius-${key})` }}
          />
        )}
      />
      <ScaleSection
        title="Shadows"
        tokenGroup="shadows"
        entries={Object.entries(tokens.shadows)}
        render={(key) => (
          <div
            className="h-16 w-16 rounded-md bg-surface"
            style={{ boxShadow: `var(--shadow-${key})` }}
          />
        )}
      />
    </div>
  );
}
