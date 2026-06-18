import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cx } from "../cx";

export type AvatarProps = {
  name: string;
  src?: string;
  className?: string;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, src, className }: AvatarProps) {
  return (
    <BaseAvatar.Root
      className={cx(
        "inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-semibold text-accent-foreground",
        className,
      )}
    >
      {src ? (
        <BaseAvatar.Image src={src} alt={name} className="h-full w-full object-cover" />
      ) : null}
      <BaseAvatar.Fallback>{initials(name)}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
