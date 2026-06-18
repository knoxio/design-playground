import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactNode } from "react";

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={(props) => <span {...props}>{children}</span>} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner sideOffset={6} className="z-50">
          <BaseTooltip.Popup className="rounded-md border border-border bg-foreground px-2 py-1 text-xs text-background shadow-md transition-[opacity,transform] duration-150 [transform-origin:var(--transform-origin)] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
