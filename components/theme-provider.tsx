"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";
export type BackgroundTheme = "classic" | "codelab" | "obsidian";

export interface BackgroundOption {
  id: BackgroundTheme;
  name: string;
  tagline: string;
  description: string;
  image: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: "classic",
    name: "Classic Study",
    tagline: "Warm Notebook",
    description: "Quiet notebook atmosphere with warm paper and coffee tones",
    image: "/backgrounds/dashboard-bg.jpg",
  },
  {
    id: "codelab",
    name: "Night Code Lab",
    tagline: "Developer Setup",
    description: "Moody dark workstation with glowing code monitor & mechanical keyboard",
    image: "/backgrounds/bg-code-lab.jpg",
  },
  {
    id: "obsidian",
    name: "Obsidian Zen",
    tagline: "Geometric Minimal",
    description: "Minimalist geometric dark glass with warm amber refraction",
    image: "/backgrounds/bg-obsidian.jpg",
  },
];

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  background: BackgroundTheme;
  setBackground: (bg: BackgroundTheme) => void;
  cycleBackground: () => void;
  currentBackgroundOption: BackgroundOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

function applyBackground(bg: BackgroundTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-bg", bg);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem("lc-theme") as Theme | null;
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // ignore
    }
    return "light";
  });

  const [background, setBackgroundState] = useState<BackgroundTheme>(() => {
    if (typeof window === "undefined") return "classic";
    try {
      const saved = localStorage.getItem("lc-bg") as BackgroundTheme | null;
      if (saved === "classic" || saved === "codelab" || saved === "obsidian") return saved;
    } catch {
      // ignore
    }
    return "classic";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyBackground(background);
  }, [background]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem("lc-theme", newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const setBackground = (newBg: BackgroundTheme) => {
    setBackgroundState(newBg);
    applyBackground(newBg);
    try {
      localStorage.setItem("lc-bg", newBg);
    } catch {
      // ignore
    }
  };

  const cycleBackground = () => {
    const list: BackgroundTheme[] = ["classic", "codelab", "obsidian"];
    const idx = list.indexOf(background);
    const next = list[(idx + 1) % list.length];
    setBackground(next);
  };

  const currentBackgroundOption =
    BACKGROUND_OPTIONS.find((opt) => opt.id === background) ?? BACKGROUND_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        background,
        setBackground,
        cycleBackground,
        currentBackgroundOption,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "dark" as Theme,
      toggleTheme: () => {},
      setTheme: () => {},
      background: "classic" as BackgroundTheme,
      setBackground: () => {},
      cycleBackground: () => {},
      currentBackgroundOption: BACKGROUND_OPTIONS[0],
    };
  }
  return context;
}

