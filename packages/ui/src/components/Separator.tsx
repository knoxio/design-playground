import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { cx } from "../cx";

export function Separator({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <BaseSeparator
      orientation={orientation}
      className={cx(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  );
}
