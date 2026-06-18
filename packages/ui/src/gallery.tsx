import { Alert } from "./components/Alert";
import { Avatar } from "./components/Avatar";
import { Badge } from "./components/Badge";
import { Button } from "./components/Button";
import { Card } from "./components/Card";
import { Checkbox } from "./components/Checkbox";
import { Dialog, DialogClose } from "./components/Dialog";
import { DropdownMenu } from "./components/DropdownMenu";
import { Input, Label, Textarea } from "./components/Input";
import { Select } from "./components/Select";
import { Separator } from "./components/Separator";
import { Skeleton } from "./components/Skeleton";
import { Switch } from "./components/Switch";
import { Table, TBody, TD, TH, THead, TR } from "./components/Table";
import { Tabs } from "./components/Tabs";
import { Tooltip } from "./components/Tooltip";

export type KitCategory = "actions" | "forms" | "display" | "feedback" | "navigation" | "overlay";

export type KitGalleryEntry = {
  id: string;
  category: KitCategory;
  description: string;
  demo: () => React.ReactNode;
};

/**
 * The kit manifest: one entry per kit component, rendered by every kit
 * gallery (global and per-client). A component is not "in the kit" until it
 * has an entry here — galleries iterate this list, so completeness is
 * structural, not remembered.
 */
export const kitManifest: KitGalleryEntry[] = [
  {
    id: "Button",
    category: "actions",
    description: "Primary action trigger. Variants: primary, secondary, destructive, ghost.",
    demo: () => (
      <div className="flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
      </div>
    ),
  },
  {
    id: "DropdownMenu",
    category: "actions",
    description: "Action menu behind a trigger.",
    demo: () => (
      <DropdownMenu
        trigger={<Button variant="secondary">Actions</Button>}
        items={[
          { label: "Duplicate" },
          { label: "Rename" },
          { label: "Delete", destructive: true },
        ]}
      />
    ),
  },
  {
    id: "Input",
    category: "forms",
    description: "Single-line text input.",
    demo: () => (
      <div className="max-w-xs">
        <Label htmlFor="kit-input">Email</Label>
        <Input id="kit-input" placeholder="sarah@example.com" />
      </div>
    ),
  },
  {
    id: "Textarea",
    category: "forms",
    description: "Multi-line text input.",
    demo: () => (
      <div className="max-w-xs">
        <Label htmlFor="kit-textarea">Notes</Label>
        <Textarea id="kit-textarea" placeholder="Anything we should know?" />
      </div>
    ),
  },
  {
    id: "Select",
    category: "forms",
    description: "Single choice from a list.",
    demo: () => (
      <div className="max-w-xs">
        <Select
          placeholder="Pick a state"
          options={[
            { value: "nsw", label: "New South Wales" },
            { value: "vic", label: "Victoria" },
            { value: "qld", label: "Queensland" },
          ]}
        />
      </div>
    ),
  },
  {
    id: "Checkbox",
    category: "forms",
    description: "Boolean choice with label.",
    demo: () => (
      <div className="space-y-2">
        <Checkbox label="Email me updates" defaultChecked />
        <Checkbox label="Subscribe to newsletter" />
      </div>
    ),
  },
  {
    id: "Switch",
    category: "forms",
    description: "On/off toggle with label.",
    demo: () => <Switch label="Enable notifications" defaultChecked />,
  },
  {
    id: "Badge",
    category: "display",
    description: "Status and metadata chips. Tones: neutral, brand, positive, attention, negative.",
    demo: () => (
      <div className="flex flex-wrap gap-2">
        <Badge>neutral</Badge>
        <Badge tone="brand">brand</Badge>
        <Badge tone="positive">positive</Badge>
        <Badge tone="attention">attention</Badge>
        <Badge tone="negative">negative</Badge>
      </div>
    ),
  },
  {
    id: "Card",
    category: "display",
    description: "Surface container with optional title.",
    demo: () => (
      <div className="max-w-sm">
        <Card title="Card title">
          <p className="mb-4 text-sm text-muted-foreground">
            Body copy on a surface, with a primary action.
          </p>
          <Button>Action</Button>
        </Card>
      </div>
    ),
  },
  {
    id: "Table",
    category: "display",
    description: "Data table: Table, THead, TBody, TR, TH, TD.",
    demo: () => (
      <Table>
        <THead>
          <TR>
            <TH>Invoice</TH>
            <TH>Status</TH>
            <TH className="text-right">Amount</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD className="font-mono text-xs">INV-0042</TD>
            <TD>
              <Badge tone="positive">paid</Badge>
            </TD>
            <TD className="text-right">$4,200.00</TD>
          </TR>
          <TR>
            <TD className="font-mono text-xs">INV-0041</TD>
            <TD>
              <Badge tone="negative">overdue</Badge>
            </TD>
            <TD className="text-right">$880.00</TD>
          </TR>
        </TBody>
      </Table>
    ),
  },
  {
    id: "Avatar",
    category: "display",
    description: "Person chip with image or initials fallback.",
    demo: () => (
      <div className="flex items-center gap-2">
        <Avatar name="Mary Quinn" />
        <Avatar name="Dean Walcott" />
      </div>
    ),
  },
  {
    id: "Separator",
    category: "display",
    description: "Horizontal or vertical rule.",
    demo: () => (
      <div className="max-w-xs space-y-2 text-sm">
        <p>Above</p>
        <Separator />
        <p>Below</p>
      </div>
    ),
  },
  {
    id: "Skeleton",
    category: "feedback",
    description: "Loading placeholder.",
    demo: () => (
      <div className="max-w-xs space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    ),
  },
  {
    id: "Alert",
    category: "feedback",
    description: "Inline callout. Tones: info, attention, negative.",
    demo: () => (
      <div className="max-w-md space-y-2">
        <Alert tone="info" title="Heads up">
          Quotes are valid for 14 days.
        </Alert>
        <Alert tone="negative" title="Payment failed">
          The card was declined.
        </Alert>
      </div>
    ),
  },
  {
    id: "Tabs",
    category: "navigation",
    description: "Tabbed panels.",
    demo: () => (
      <Tabs
        items={[
          { id: "one", label: "Overview", content: <p className="text-sm">Overview content.</p> },
          { id: "two", label: "Details", content: <p className="text-sm">Details content.</p> },
        ]}
      />
    ),
  },
  {
    id: "Dialog",
    category: "overlay",
    description: "Modal dialog with title, description, and close.",
    demo: () => (
      <Dialog
        trigger={<Button variant="secondary">Open dialog</Button>}
        title="Remove consignment?"
        description="This only removes it from the list — nothing is deleted."
      >
        <div className="flex justify-end gap-2">
          <DialogClose
            render={(props) => (
              <Button variant="ghost" {...props}>
                Cancel
              </Button>
            )}
          />
          <DialogClose
            render={(props) => (
              <Button variant="destructive" {...props}>
                Remove
              </Button>
            )}
          />
        </div>
      </Dialog>
    ),
  },
  {
    id: "Tooltip",
    category: "overlay",
    description: "Hover hint.",
    demo: () => (
      <Tooltip content="Estimated from carrier data">
        <Badge tone="attention">ETA 2026-06-14</Badge>
      </Tooltip>
    ),
  },
];
