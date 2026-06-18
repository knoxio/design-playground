import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { cx } from "../cx";

export type DialogProps = {
  trigger: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function Dialog({ trigger, title, description, children, className }: DialogProps) {
  return (
    <BaseDialog.Root>
      <BaseDialog.Trigger render={(props) => <span {...props}>{trigger}</span>} />
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <BaseDialog.Popup
          className={cx(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-lg",
            "transition-[opacity,transform] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className,
          )}
        >
          <BaseDialog.Title className="mb-1 text-base font-semibold">{title}</BaseDialog.Title>
          {description ? (
            <BaseDialog.Description className="mb-4 text-sm text-muted-foreground">
              {description}
            </BaseDialog.Description>
          ) : null}
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export const DialogClose = BaseDialog.Close;
