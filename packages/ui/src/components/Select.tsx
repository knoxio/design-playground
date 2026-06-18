import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cx } from "../cx";

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  options: SelectOption[];
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function Select({
  options,
  placeholder = "Select…",
  className,
  onValueChange,
  ...props
}: SelectProps) {
  return (
    <BaseSelect.Root
      onValueChange={onValueChange ? (value) => onValueChange(String(value)) : undefined}
      {...props}
    >
      <BaseSelect.Trigger
        className={cx(
          "flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <BaseSelect.Value placeholder={placeholder} />
        <BaseSelect.Icon>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} className="z-50">
          <BaseSelect.Popup className="min-w-(--anchor-width) rounded-md border border-border bg-surface p-1 shadow-md transition-[opacity,transform] duration-150 [transform-origin:var(--transform-origin)] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                className="flex cursor-default items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm data-[highlighted]:bg-muted"
              >
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator>
                  <Check className="h-3.5 w-3.5" />
                </BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
