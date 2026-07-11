"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

const ThemeContext = createContext<{ theme: ThemeMode; setTheme: (theme: ThemeMode) => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("shoplinkk-theme") as ThemeMode | null;
    const next = saved === "dark" ? "dark" : "light";
    setThemeState(next);
    document.documentElement.dataset.theme = next;
  }, []);

  function setTheme(next: ThemeMode) {
    setThemeState(next);
    window.localStorage.setItem("shoplinkk-theme", next);
    document.documentElement.dataset.theme = next;
  }

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
