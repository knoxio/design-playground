import type { PageMeta } from "@helix/ui";
import type { ComponentType } from "react";
import { z } from "zod";

export { themeSchema } from "@helix/ui";

export const clientYamlSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  defaultTheme: z.string().min(1),
  preview: z
    .object({
      emails: z.array(z.email()).optional(),
      domains: z.array(z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i)).optional(),
      public: z.boolean().optional(),
    })
    .optional(),
});

export const experimentYamlSchema = z.object({
  name: z.string().min(1),
  question: z.string().optional(),
  status: z.enum(["active", "decided", "archived"]),
  /** The page-tree node this experiment explores (a page id). Required: every
   *  experiment belongs to a page, even one that exists only in its variants. */
  page: z.string().min(1),
  variants: z.record(z.string(), z.string()).optional(),
  theme: z.string().optional(),
  chosen: z.string().optional(),
  decided: z.string().optional(),
  rationale: z.string().optional(),
});

export const pageMetaSchema: z.ZodType<PageMeta> = z.object({
  title: z.string().min(1),
  order: z.number().optional(),
});

/**
 * The optional colocated `states` export (ADR-0011): a map of state id → render
 * thunk. Each value must be a function; the default render is the implicit
 * `default` state and is never listed here.
 */
export const statesSchema = z.record(
  z.string().min(1),
  z.custom<ComponentType>((value) => typeof value === "function", "must be a render function"),
);
