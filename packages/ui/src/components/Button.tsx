import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-muted text-foreground border border-border hover:bg-accent",
  destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
  ghost: "bg-transparent text-foreground hover:bg-muted",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
