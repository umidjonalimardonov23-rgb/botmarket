import { create } from "zustand";
import { translations, Language } from "../lib/translations";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

export const useLanguage = create<LanguageState>((set, get) => ({
  language: (localStorage.getItem("botmarket_lang") as Language) || "uz",
  setLanguage: (lang: Language) => {
    localStorage.setItem("botmarket_lang", lang);
    set({ language: lang });
  },
  t: (key) => {
    const state = get();
    return translations[state.language][key] || key;
  },
}));
