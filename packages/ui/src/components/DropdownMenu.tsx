import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ReactNode } from "react";

export type DropdownMenuItem = {
  label: string;
  onSelect?: () => void;
  destructive?: boolean;
};

export function DropdownMenu({
  trigger,
  items,
}: {
  trigger: ReactNode;
  items: DropdownMenuItem[];
}) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger render={(props) => <span {...props}>{trigger}</span>} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={4} className="z-50">
          <BaseMenu.Popup className="min-w-40 rounded-md border border-border bg-surface p-1 shadow-md transition-[opacity,transform] duration-150 [transform-origin:var(--transform-origin)] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {items.map((item) => (
              <BaseMenu.Item
                key={item.label}
                onClick={item.onSelect}
                className={`cursor-default rounded-sm px-2 py-1.5 text-sm data-[highlighted]:bg-muted ${
                  item.destructive ? "text-destructive" : "text-foreground"
                }`}
              >
                {item.label}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
