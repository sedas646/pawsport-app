const BASE = "";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err}`);
  }
  return res.json();
}

// Dogs
export const fetchDogs = (refresh = false) =>
  request<{ dogs: import("../types/dog").Dog[]; count: number; cached: boolean }>(
    `/api/dogs?refresh=${refresh}`
  );

export const saveDogSettings = (
  dogId: string | number,
  settings: { photo_mode?: string; photo_crop_y?: number }
) =>
  request<{ saved: string }>(`/api/dogs/${dogId}/settings`, {
    method: "PUT",
    body: JSON.stringify(settings),
  });

// Themes
export const fetchThemes = () =>
  request<{
    themes: import("../types/theme").ThemeSummary[];
    active: string;
  }>("/api/themes");

export const fetchActiveTheme = () =>
  request<{ name: string; theme: import("../types/theme").Theme }>("/api/themes/active");

export const fetchTheme = (name: string) =>
  request<import("../types/theme").Theme>(`/api/themes/${name}`);

export const setActiveTheme = (name: string) =>
  request<{ active: string }>("/api/themes/active", {
    method: "PUT",
    body: JSON.stringify({ name }),
  });

export const saveTheme = (name: string, theme: import("../types/theme").Theme) =>
  request<{ saved: string }>(`/api/themes/${name}`, {
    method: "PUT",
    body: JSON.stringify(theme),
  });

export const createTheme = (theme: import("../types/theme").Theme) =>
  request<{ saved: string }>("/api/themes", {
    method: "POST",
    body: JSON.stringify(theme),
  });

export const deleteTheme = (name: string) =>
  request<{ deleted: string }>(`/api/themes/${name}`, { method: "DELETE" });

// Fonts
export const fetchFonts = () =>
  request<{ fonts: import("../types/theme").FontInfo[] }>("/api/fonts");

// Textures
export const fetchTextures = () =>
  request<{ textures: string[] }>("/api/textures");

// Posters
export const generatePoster = (
  dog: import("../types/dog").Dog,
  themeName?: string,
  themeOverride?: import("../types/theme").Theme
) =>
  request<import("../types/dog").GenerateResult>("/api/posters/generate", {
    method: "POST",
    body: JSON.stringify({ dog, theme_name: themeName, theme_override: themeOverride }),
  });

export const generateAllPosters = (
  dogs: import("../types/dog").Dog[],
  themeName?: string,
  themeOverride?: import("../types/theme").Theme
) =>
  request<import("../types/dog").BulkGenerateResult>("/api/posters/generate-all", {
    method: "POST",
    body: JSON.stringify({ dogs, theme_name: themeName, theme_override: themeOverride }),
  });

// Email
export const sendEmail = (zipFilename?: string) =>
  request<{ message: string; recipient: string }>("/api/email/send", {
    method: "POST",
    body: JSON.stringify({ zip_filename: zipFilename }),
  });
