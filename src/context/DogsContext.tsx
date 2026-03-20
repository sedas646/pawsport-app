import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Dog } from "../types/dog";
import type { Theme, ThemeSummary } from "../types/theme";
import { fetchDogs, fetchThemes, fetchActiveTheme, setActiveTheme as apiSetActive } from "../api/client";

interface DogsState {
  dogs: Dog[];
  loading: boolean;
  error: string | null;
  themes: ThemeSummary[];
  activeThemeName: string;
  activeTheme: Theme | null;
  refreshDogs: (force?: boolean) => Promise<void>;
  refreshThemes: () => Promise<void>;
  setActiveTheme: (name: string) => Promise<void>;
}

const Ctx = createContext<DogsState | null>(null);

export function DogsProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [activeThemeName, setActiveThemeName] = useState("spring");
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);

  const refreshDogs = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDogs(force);
      setDogs(res.dogs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshThemes = useCallback(async () => {
    try {
      const res = await fetchThemes();
      setThemes(res.themes);
      setActiveThemeName(res.active);
      const active = await fetchActiveTheme();
      setActiveTheme(active.theme);
    } catch (e: any) {
      console.error("Failed to load themes:", e);
    }
  }, []);

  const setActive = useCallback(async (name: string) => {
    await apiSetActive(name);
    setActiveThemeName(name);
    const active = await fetchActiveTheme();
    setActiveTheme(active.theme);
  }, []);

  useEffect(() => {
    refreshDogs();
    refreshThemes();
  }, [refreshDogs, refreshThemes]);

  return (
    <Ctx.Provider
      value={{
        dogs, loading, error, themes,
        activeThemeName, activeTheme,
        refreshDogs, refreshThemes,
        setActiveTheme: setActive,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useDogs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDogs must be inside DogsProvider");
  return ctx;
}
