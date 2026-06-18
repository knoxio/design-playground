import type { HTMLAttributes, ReactNode } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
};

export function Card({ title, children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-6 shadow-sm ${className}`}
      {...props}
    >
      {title ? <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3> : null}
      {children}
    </div>
  );
}
