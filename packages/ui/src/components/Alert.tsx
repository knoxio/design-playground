import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";

export type AlertTone = "info" | "attention" | "negative";

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: AlertTone;
  title?: ReactNode;
};

const toneClasses: Record<AlertTone, string> = {
  info: "border-border bg-accent/40 text-foreground",
  attention: "border-border bg-muted text-foreground",
  negative: "border-destructive/40 bg-destructive/10 text-foreground",
};

export function Alert({ tone = "info", title, children, className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cx("rounded-md border px-4 py-3 text-sm", toneClasses[tone], className)}
      {...props}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}
