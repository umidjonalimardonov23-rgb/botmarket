import { create } from "zustand";

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  theme: localStorage.getItem("botmarket_theme") || "blue",
  setTheme: (theme: string) => {
    localStorage.setItem("botmarket_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
}));

// Initialize theme
if (typeof document !== "undefined") {
  const currentTheme = localStorage.getItem("botmarket_theme") || "blue";
  document.documentElement.setAttribute("data-theme", currentTheme);
}
