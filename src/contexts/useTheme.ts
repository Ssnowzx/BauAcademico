import { useContext } from "react";
import { ThemeContext } from "./theme-shared";
import type { ThemeContextProps } from "./theme-shared";

export function useTheme(): ThemeContextProps {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
