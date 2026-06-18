import { transformSync, type PluginObj } from "@babel/core";
import type * as BabelTypes from "@babel/types";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function stamp({ types: t }: { types: typeof BabelTypes }): PluginObj {
  return {
    name: "hx-source-stamp",
    visitor: {
      JSXOpeningElement(nodePath, state) {
        const node = nodePath.node;
        if (node.name.type !== "JSXIdentifier" || !/^[a-z]/.test(node.name.name)) return;
        if (!node.loc || !state.filename) return;
        const already = node.attributes.some(
          (a) => a.type === "JSXAttribute" && a.name.name === "data-hx-source",
        );
        if (already) return;
        const rel = path.relative(repoRoot, state.filename);
        node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier("data-hx-source"),
            t.stringLiteral(`${rel}:${node.loc.start.line}`),
          ),
        );
      },
    },
  };
}

/**
 * Stamps host elements in client pages with `data-hx-source="<file>:<line>"`
 * so the inspect overlay can anchor feedback to source. Client files only —
 * kit internals stay unstamped, so the overlay's nearest-stamped-ancestor
 * walk lands on client frames. Excluded from VITE_CLIENT preview builds in
 * vite.config.
 */
export function hxSource(): Plugin {
  return {
    name: "hx-source",
    enforce: "pre",
    transform(code, id) {
      if (!/\/clients\/[^?]+\.tsx$/.test(id)) return null;
      const result = transformSync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ["jsx", "typescript"] },
        plugins: [stamp],
        sourceMaps: true,
      });
      if (!result?.code) return null;
      return { code: result.code, map: result.map };
    },
  };
}
