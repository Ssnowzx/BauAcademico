import React, { useEffect, useState } from "react";
import { ThemeContext } from "./theme-shared";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState("light" as const);

  useEffect(() => {
    // Sempre garante que está no tema light
    document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("theme", "light");
    } catch (e) {
      // ignore - SSR or restricted storage
    }
  }, []);

  const toggleTheme = () => {
    // Não faz nada - sempre mantém light
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Note: useTheme moved to a dedicated module `useTheme.ts` to keep this file
// exporting only a component (ThemeProvider) which is compatible with Fast Refresh.
