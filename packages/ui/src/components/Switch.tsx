import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cx } from "../cx";

export type SwitchProps = {
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Switch({ label, className, ...props }: SwitchProps) {
  return (
    <label className={cx("flex items-center gap-2 text-sm", className)}>
      <BaseSwitch.Root
        className="h-5 w-9 rounded-full bg-muted p-0.5 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[checked]:bg-primary"
        {...props}
      >
        <BaseSwitch.Thumb className="block h-4 w-4 rounded-full bg-surface shadow-sm transition-transform duration-150 data-[checked]:translate-x-4" />
      </BaseSwitch.Root>
      {label}
    </label>
  );
}
