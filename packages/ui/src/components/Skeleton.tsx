import type { HTMLAttributes } from "react";
import { cx } from "../cx";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div aria-hidden className={cx("animate-pulse rounded-md bg-muted", className)} {...props} />
  );
}
