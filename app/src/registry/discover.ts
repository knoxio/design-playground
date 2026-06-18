import type { ComponentType } from "react";
import { linkExperimentsToPages } from "./lineage";
import { collectPages } from "./pages";
import { clientYamlSchema, experimentYamlSchema } from "./schemas";
import { collectThemes } from "./themes";
import type { ClientComponentEntry, ClientEntry, ExperimentEntry, VariantEntry } from "./types";
import { escapeRegExp, parseYamlFile, relativeToClients } from "./yaml";

const clientYamls = import.meta.glob<string>("../../../clients/*/client.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
});
const clientThemeYamls = import.meta.glob<string>("../../../clients/*/themes/*.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
});
const experimentThemeYamls = import.meta.glob<string>(
  "../../../clients/*/experiments/*/themes/*.yaml",
  { query: "?raw", import: "default", eager: true },
);
const variantThemeYamls = import.meta.glob<string>(
  "../../../clients/*/experiments/*/variants/*/themes/*.yaml",
  { query: "?raw", import: "default", eager: true },
);
const experimentYamls = import.meta.glob<string>(
  "../../../clients/*/experiments/*/experiment.yaml",
  { query: "?raw", import: "default", eager: true },
);
const pageModules = import.meta.glob<Record<string, unknown>>("../../../clients/*/pages/*.tsx", {
  eager: true,
});
const flowStepModules = import.meta.glob<Record<string, unknown>>(
  "../../../clients/*/pages/*/*.tsx",
  { eager: true },
);
const deepFlowModules = import.meta.glob<Record<string, unknown>>(
  "../../../clients/*/pages/*/*/*.tsx",
  { eager: true },
);
const variantPageModules = import.meta.glob<Record<string, unknown>>(
  "../../../clients/*/experiments/*/variants/*/pages/*.tsx",
  { eager: true },
);
const variantFlowStepModules = import.meta.glob<Record<string, unknown>>(
  "../../../clients/*/experiments/*/variants/*/pages/*/*.tsx",
  { eager: true },
);
const variantDeepFlowModules = import.meta.glob<Record<string, unknown>>(
  "../../../clients/*/experiments/*/variants/*/pages/*/*/*.tsx",
  { eager: true },
);
const componentModules = import.meta.glob<Record<string, unknown>>(
  "../../../clients/*/components/*.tsx",
  { eager: true },
);
const experimentSharedModules = import.meta.glob<Record<string, unknown>>(
  "../../../clients/*/experiments/*/shared/*.tsx",
  { eager: true },
);

function discoverExperiments(
  clientId: string,
  reachableThemeIds: Set<string>,
  errors: string[],
): ExperimentEntry[] {
  const experiments: ExperimentEntry[] = [];
  for (const [globPath, raw] of Object.entries(experimentYamls)) {
    const path = relativeToClients(globPath);
    const match = path.match(/^([^/]+)\/experiments\/([^/]+)\/experiment\.yaml$/);
    if (!match || match[1] !== clientId) continue;
    const expId = match[2];
    if (expId === undefined) continue;
    const parsed = parseYamlFile(raw, experimentYamlSchema, `clients/${path}`, errors);
    if (!parsed) continue;

    const variantIds = new Set<string>();
    const variantPrefix = `${clientId}/experiments/${expId}/variants/`;
    for (const variantGlobPath of [
      ...Object.keys(variantPageModules),
      ...Object.keys(variantFlowStepModules),
      ...Object.keys(variantThemeYamls),
    ]) {
      const variantPath = relativeToClients(variantGlobPath);
      if (!variantPath.startsWith(variantPrefix)) continue;
      const variantId = variantPath.slice(variantPrefix.length).split("/")[0];
      if (variantId) variantIds.add(variantId);
    }

    const expThemes = collectThemes({
      source: experimentThemeYamls,
      pattern: new RegExp(
        `^${escapeRegExp(clientId)}/experiments/${escapeRegExp(expId)}/themes/([^/]+)\\.yaml$`,
      ),
      scope: "experiment",
      makeKey: (id) => `e:${expId}:${id}`,
      errors,
      ownerLabel: parsed.name,
    });
    if (
      parsed.theme &&
      !expThemes.some((t) => t.id === parsed.theme) &&
      !reachableThemeIds.has(parsed.theme)
    ) {
      errors.push(
        `clients/${clientId}/experiments/${expId}: theme "${parsed.theme}" not found in the experiment's, client's, or global themes/`,
      );
    }

    const variants: VariantEntry[] = [...variantIds].toSorted().map((variantId) => {
      const variantName = parsed.variants?.[variantId] ?? variantId;
      return {
        id: variantId,
        name: variantName,
        pages: collectPages({
          leafModules: variantPageModules,
          flowModules: variantFlowStepModules,
          deepModules: variantDeepFlowModules,
          prefix: `${variantPrefix}${variantId}/pages/`,
          errors,
        }),
        themes: collectThemes({
          source: variantThemeYamls,
          pattern: new RegExp(
            `^${escapeRegExp(clientId)}/experiments/${escapeRegExp(expId)}/variants/${escapeRegExp(variantId)}/themes/([^/]+)\\.yaml$`,
          ),
          scope: "variant",
          makeKey: (id) => `v:${expId}:${variantId}:${id}`,
          errors,
          ownerLabel: `${parsed.name} · ${variantName}`,
        }),
      };
    });

    if (variants.length === 0) {
      errors.push(
        `clients/${clientId}/experiments/${expId}: no variants — experiments always have variants/`,
      );
      continue;
    }
    if (parsed.chosen && !variantIds.has(parsed.chosen)) {
      errors.push(
        `clients/${clientId}/experiments/${expId}: chosen variant "${parsed.chosen}" does not exist`,
      );
    }

    experiments.push({
      id: expId,
      name: parsed.name,
      question: parsed.question,
      status: parsed.status,
      page: parsed.page,
      chosen: parsed.chosen,
      theme: parsed.theme,
      themes: expThemes,
      components: collectComponents(
        experimentSharedModules,
        new RegExp(
          `^${escapeRegExp(clientId)}/experiments/${escapeRegExp(expId)}/shared/([^/]+)\\.tsx$`,
        ),
      ),
      variants,
    });
  }
  return experiments.toSorted((a, b) => a.id.localeCompare(b.id));
}

function isComponentType(value: unknown): value is ComponentType {
  return typeof value === "function" || (typeof value === "object" && value !== null);
}

function collectComponents(
  modules: Record<string, Record<string, unknown>>,
  pattern: RegExp,
): ClientComponentEntry[] {
  const components: ClientComponentEntry[] = [];
  for (const [globPath, mod] of Object.entries(modules)) {
    const match = relativeToClients(globPath).match(pattern);
    const id = match?.[match.length - 1];
    if (id === undefined) continue;
    components.push({
      id,
      demo: isComponentType(mod.demo) ? mod.demo : undefined,
      promoteCandidate: mod.promoteCandidate === true,
    });
  }
  return components.toSorted((a, b) => a.id.localeCompare(b.id));
}

export function discoverClients(globalThemeIds: Set<string>): ClientEntry[] {
  const clients: ClientEntry[] = [];

  for (const [globPath, raw] of Object.entries(clientYamls)) {
    const path = relativeToClients(globPath);
    const clientId = path.split("/")[0];
    if (!clientId) continue;
    const errors: string[] = [];
    const parsed = parseYamlFile(raw, clientYamlSchema, `clients/${path}`, errors);

    const themes = collectThemes({
      source: clientThemeYamls,
      pattern: new RegExp(`^${escapeRegExp(clientId)}/themes/([^/]+)\\.yaml$`),
      scope: "client",
      makeKey: (id) => `c:${id}`,
      errors,
    });

    const defaultTheme = parsed?.defaultTheme ?? "default";
    if (parsed && !themes.some((t) => t.id === defaultTheme) && !globalThemeIds.has(defaultTheme)) {
      errors.push(
        `clients/${clientId}/client.yaml: defaultTheme "${defaultTheme}" matches no client or global theme`,
      );
    }

    const pages = collectPages({
      leafModules: pageModules,
      flowModules: flowStepModules,
      deepModules: deepFlowModules,
      prefix: `${clientId}/pages/`,
      errors,
    });
    const experiments = discoverExperiments(
      clientId,
      new Set([...themes.map((t) => t.id), ...globalThemeIds]),
      errors,
    );
    linkExperimentsToPages(clientId, pages, experiments, errors);

    clients.push({
      id: clientId,
      name: parsed?.name ?? clientId,
      description: parsed?.description,
      themes,
      defaultTheme,
      pages,
      components: collectComponents(
        componentModules,
        new RegExp(`^${escapeRegExp(clientId)}/components/([^/]+)\\.tsx$`),
      ),
      experiments,
      errors,
    });
  }

  return clients.toSorted((a, b) => a.id.localeCompare(b.id));
}
