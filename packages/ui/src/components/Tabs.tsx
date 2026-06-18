import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";
import { cx } from "../cx";

export type TabItem = { id: string; label: string; content: ReactNode };

export function Tabs({
  items,
  defaultTab,
  className,
}: {
  items: TabItem[];
  defaultTab?: string;
  className?: string;
}) {
  return (
    <BaseTabs.Root defaultValue={defaultTab ?? items[0]?.id} className={className}>
      <BaseTabs.List className="flex gap-1 border-b border-border">
        {items.map((item) => (
          <BaseTabs.Tab
            key={item.id}
            value={item.id}
            className={cx(
              "-mb-px rounded-t-md border-b-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150",
              "hover:text-foreground data-[selected]:border-primary data-[selected]:font-medium data-[selected]:text-foreground",
            )}
          >
            {item.label}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {items.map((item) => (
        <BaseTabs.Panel key={item.id} value={item.id} className="pt-4">
          {item.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}
