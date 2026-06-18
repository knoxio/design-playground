import { Button, Card, type PageMeta } from "@design/ui";

export const meta: PageMeta = { title: "Welcome", order: 1 };

export default function Welcome() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <Card title="Welcome to Demo Co">
        <p className="mb-6 text-sm text-muted-foreground">
          A variant page — one answer to the onboarding question. Variants override or add to the
          client's main pages; everything not overridden falls through, so this view is always a
          complete app.
        </p>
        <div className="flex gap-3">
          <Button>Get started</Button>
          <Button variant="ghost">Skip for now</Button>
        </div>
      </Card>
    </div>
  );
}
