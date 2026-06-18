import type { InputHTMLAttributes, TextareaHTMLAttributes, LabelHTMLAttributes } from "react";
import { cx } from "../cx";

const fieldClasses =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldClasses, "min-h-20", className)} {...props} />;
}

export function Label({ className, htmlFor, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx("mb-1 block text-sm font-medium", className)}
      {...props}
    />
  );
}
