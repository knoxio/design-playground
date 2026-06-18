import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Overview } from "./pages/Overview";
import { ClientPage } from "./pages/ClientPage";
import { ComponentsGallery } from "./pages/ComponentsGallery";
import { GlobalComponents, GlobalTokens } from "./pages/Standalone";
import { TokensGallery } from "./pages/TokensGallery";
import { clients } from "./registry/clients";
import { AppShell } from "./shell/AppShell";
import { FrameShell } from "./shell/FrameShell";
import "@fontsource-variable/dm-sans/index.css";
import "@fontsource-variable/space-grotesk/index.css";
import "./styles/index.css";

const IconLibrary = lazy(() =>
  import("./pages/IconLibrary").then((m) => ({ default: m.IconLibrary })),
);
const GlobalIcons = lazy(() =>
  import("./pages/IconLibrary").then((m) => ({ default: m.GlobalIcons })),
);

const scoped = Boolean(import.meta.env.VITE_CLIENT);

if (!scoped) void import("./play/registry").then((m) => m.installPlayRegistry());

/** Scoped previews boot straight into the client's first page — no overview. */
function ScopedHome() {
  const client = clients[0];
  const first = client?.pages[0];
  if (!client || !first) return <p className="p-8">No pages yet.</p>;
  return <Navigate to={`/c/${client.id}/p/${first.id}`} replace />;
}

function clientRoutes(prefix: string, shell: React.ReactElement) {
  return (
    <Route path={`${prefix}/c/:clientId`} element={shell}>
      <Route path="tokens" element={<TokensGallery />} />
      <Route
        path="icons"
        element={
          <Suspense fallback={null}>
            <IconLibrary />
          </Suspense>
        }
      />
      <Route path="components" element={<ComponentsGallery />} />
      <Route path="p/:pageId" element={<ClientPage />} />
      <Route path="p/:pageId/:stepId" element={<ClientPage />} />
      <Route path="x/:experimentId/:variantId/:pageId" element={<ClientPage />} />
      <Route path="x/:experimentId/:variantId/:pageId/:stepId" element={<ClientPage />} />
    </Route>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      {scoped ? (
        <Routes>
          {clientRoutes("", <AppShell />)}
          <Route path="*" element={<ScopedHome />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/tokens" element={<GlobalTokens />} />
          <Route path="/components" element={<GlobalComponents />} />
          <Route
            path="/icons"
            element={
              <Suspense fallback={null}>
                <GlobalIcons />
              </Suspense>
            }
          />
          {clientRoutes("", <AppShell />)}
          {clientRoutes("/frame", <FrameShell />)}
        </Routes>
      )}
    </BrowserRouter>
  </StrictMode>,
);
