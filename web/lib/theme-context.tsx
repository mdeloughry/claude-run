import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { themes, getThemeById } from "./themes";
import type { Theme } from "./themes";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (id: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "claude-run-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme.id);
  root.style.colorScheme = theme.colorScheme;

  const c = theme.colors;
  root.style.setProperty("--color-bg", c.bg);
  root.style.setProperty("--color-bg-secondary", c.bgSecondary);
  root.style.setProperty("--color-bg-surface", c.bgSurface);
  root.style.setProperty("--color-bg-hover", c.bgHover);
  root.style.setProperty("--color-bg-selected", c.bgSelected);
  root.style.setProperty("--color-bg-code", c.bgCode);
  root.style.setProperty("--color-bg-input", c.bgInput);
  root.style.setProperty("--color-text", c.text);
  root.style.setProperty("--color-text-secondary", c.textSecondary);
  root.style.setProperty("--color-text-muted", c.textMuted);
  root.style.setProperty("--color-text-faint", c.textFaint);
  root.style.setProperty("--color-border", c.border);
  root.style.setProperty("--color-border-subtle", c.borderSubtle);
  root.style.setProperty("--color-accent", c.accent);
  root.style.setProperty("--color-accent-hover", c.accentHover);
  root.style.setProperty("--color-accent-text", c.accentText);
  root.style.setProperty("--color-user-bubble", c.userBubble);
  root.style.setProperty("--color-user-text", c.userText);
  root.style.setProperty("--color-assistant-bubble", c.assistantBubble);
  root.style.setProperty("--color-assistant-text", c.assistantText);
  root.style.setProperty("--color-scrollbar", c.scrollbar);
  root.style.setProperty("--color-scrollbar-hover", c.scrollbarHover);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return getThemeById(stored || "claude");
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id: string) => {
    const next = getThemeById(id);
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
