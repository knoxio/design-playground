import { parse as parseYaml } from "yaml";
import type { ZodType } from "zod";

/** Strip the import.meta.glob prefix down to the client-relative path. */
export function relativeToClients(globPath: string): string {
  return globPath.replace(/^.*?\/clients\//, "");
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Parse YAML and validate it against a schema, collecting a contract error on failure. */
export function parseYamlFile<T>(
  raw: string,
  schema: ZodType<T>,
  path: string,
  errors: string[],
): T | null {
  let data: unknown;
  try {
    data = parseYaml(raw);
  } catch (e) {
    errors.push(`${path}: invalid YAML — ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    errors.push(`${path}: ${issues}`);
    return null;
  }
  return result.data;
}
