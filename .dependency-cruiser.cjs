/** Boundary rules — see docs/adr/0003-module-boundary-rules.md. CI fails on any violation. */
module.exports = {
  forbidden: [
    {
      name: "kit-must-stay-client-agnostic",
      comment: "The shared kit may never import from clients or the app.",
      severity: "error",
      from: { path: "^packages/ui" },
      to: { path: "^(clients|app)/" },
    },
    {
      name: "no-cross-client-imports",
      comment: "Clients may never import from other clients.",
      severity: "error",
      from: { path: "^clients/([^/]+)/" },
      to: { path: "^clients/", pathNot: "^clients/$1/" },
    },
    {
      name: "clients-must-not-import-app",
      comment: "Client folders depend only on @design/ui, never on app internals.",
      severity: "error",
      from: { path: "^clients/" },
      to: { path: "^app/" },
    },
    {
      name: "app-imports-clients-only-via-registry",
      comment: "Only the registry may import client code.",
      severity: "error",
      from: { path: "^app/", pathNot: "^app/src/registry/" },
      to: { path: "^clients/" },
    },
    {
      name: "no-circular",
      comment: "Circular dependencies are always a design smell here.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      mainFields: ["module", "main"],
      conditionNames: ["import", "require", "default"],
    },
  },
};
