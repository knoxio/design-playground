import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import { cx } from "../cx";

export type CheckboxProps = {
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Checkbox({ label, className, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <label className={cx("flex items-center gap-2 text-sm", className)}>
      <BaseCheckbox.Root
        onCheckedChange={onCheckedChange ? (checked) => onCheckedChange(checked) : undefined}
        className="flex h-4 w-4 items-center justify-center rounded-sm border border-border bg-surface transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[checked]:border-primary data-[checked]:bg-primary"
        {...props}
      >
        <BaseCheckbox.Indicator className="text-primary-foreground transition-[opacity,transform] duration-100 data-[ending-style]:scale-50 data-[ending-style]:opacity-0 data-[starting-style]:scale-50 data-[starting-style]:opacity-0">
          <Check className="h-3 w-3" strokeWidth={3} />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {label}
    </label>
  );
}
