import type { HTMLAttributes } from "react";
import { cx } from "../cx";

export type BadgeTone = "neutral" | "brand" | "positive" | "attention" | "negative";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-primary text-primary-foreground",
  positive: "bg-accent text-accent-foreground",
  attention: "border border-border bg-surface text-foreground",
  negative: "bg-destructive text-destructive-foreground",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
