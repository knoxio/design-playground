import { designTokens, tokensToStyle, type TokenSet } from "@design/ui";
import { createContext, useContext, type ReactNode } from "react";

const ThemeTokensContext = createContext<TokenSet | null>(null);

/** The active canvas theme — for chrome content rendered inside the canvas
 * (galleries) that wants token *values*, not just CSS variables. */
export function useThemeTokens(): TokenSet {
  return useContext(ThemeTokensContext) ?? designTokens;
}

/**
 * The prototype canvas: scopes the client's theme to its subtree via CSS
 * variables. The chrome around it keeps the static :root defaults — a client
 * theme must never restyle the playground itself.
 */
export function ClientTheme({ tokens, children }: { tokens: TokenSet; children: ReactNode }) {
  return (
    <ThemeTokensContext.Provider value={tokens}>
      <div
        style={{
          ...tokensToStyle(tokens),
          fontFamily: "var(--font-sans)",
          fontVariantNumeric: tokens.type.numbers === "tabular" ? "tabular-nums" : "normal",
        }}
        className="min-h-full bg-background text-foreground transition-colors duration-300"
      >
        {children}
      </div>
    </ThemeTokensContext.Provider>
  );
}
