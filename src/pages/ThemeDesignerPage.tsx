import { useState, useEffect } from "react";
import { useDogs } from "../context/DogsContext";
import PosterPreview from "../components/PosterPreview";
import ColorPicker from "../components/ColorPicker";
import FontSelector from "../components/FontSelector";
import { fetchTheme, saveTheme, createTheme, deleteTheme, setActiveTheme, fetchTextures } from "../api/client";
import type { Theme } from "../types/theme";
import { DEFAULT_THEME } from "../types/theme";
import type { Dog } from "../types/dog";

const SAMPLE_DOG: Dog = {
  id: "sample",
  "Pet Name": "Buddy",
  "Pet Breed": "Golden Retriever Mix",
  Weight: "45 lbs",
  "Current Foster/Adopter": "Jane Smith",
  Gender: "Male",
  "Age in Years": "3 years, 2 months",
  "Housebroken?": "Yes",
  Crate: "Yes",
  "Gets along with Kids?": "Yes",
  "Gets along with Cats?": "No",
  "Gets along with Dogs?": "Yes",
  "Known Medical": "--",
  "Fenced Yard": "--",
  "Another dog": "--",
  "Photo URL": "",
};

const DECORATION_OPTIONS = ["none", "snowflakes", "paws", "flowers", "leaves"] as const;

export default function ThemeDesignerPage() {
  const { themes, activeThemeName, dogs, refreshThemes } = useDogs();
  const [theme, setTheme] = useState<Theme>({ ...DEFAULT_THEME });
  const [editName, setEditName] = useState("");
  const [textures, setTextures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const sampleDog = dogs[0] || SAMPLE_DOG;

  useEffect(() => {
    fetchTextures().then((r) => setTextures(r.textures)).catch(() => {});
  }, []);

  const loadTheme = async (name: string) => {
    try {
      const t = await fetchTheme(name);
      setTheme(t);
      setEditName(name);
      setMessage("");
    } catch (e: any) {
      setMessage(`Error loading: ${e.message}`);
    }
  };

  const update = <K extends keyof Theme>(key: K, value: Theme[K]) => {
    setTheme((t) => ({ ...t, [key]: value }));
  };

  const updateBg = (field: string, value: any) => {
    setTheme((t) => ({
      ...t,
      background: { ...t.background, [field]: value },
    }));
  };

  const handleSave = async () => {
    const name = editName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!name) {
      setMessage("Enter a theme name");
      return;
    }
    setSaving(true);
    try {
      const existing = themes.find((t) => t.name === name);
      if (existing) {
        await saveTheme(name, { ...theme, name: theme.name || name });
      } else {
        await createTheme({ ...theme, name: theme.name || name });
      }
      await refreshThemes();
      setMessage(`Saved "${name}"`);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async () => {
    const name = editName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!name) return;
    try {
      await handleSave();
      await setActiveTheme(name);
      await refreshThemes();
      setMessage(`"${name}" is now the active theme`);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    const name = editName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!name || !confirm(`Delete theme "${name}"?`)) return;
    try {
      await deleteTheme(name);
      await refreshThemes();
      setTheme({ ...DEFAULT_THEME });
      setEditName("");
      setMessage(`Deleted "${name}"`);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Controls */}
      <div className="flex-1 max-w-lg space-y-5 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
        <h2 className="text-xl font-bold text-white">Theme Designer</h2>

        {/* Load preset */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Load existing theme:</p>
          <div className="flex gap-2 flex-wrap">
            {themes.map((t) => (
              <button
                key={t.name}
                onClick={() => loadTheme(t.name)}
                className={`px-3 py-1 rounded text-xs ${
                  editName === t.name
                    ? "bg-amber-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {t.display_name}
                {t.name === activeThemeName && " *"}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 w-28 text-right">Save as</label>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="theme_name"
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 w-28 text-right">Display Name</label>
          <input
            value={theme.name}
            onChange={(e) => update("name", e.target.value)}
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
          />
        </div>

        {/* Layout */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 w-28 text-right">Layout</label>
          <select
            value={theme.layout}
            onChange={(e) => update("layout", e.target.value as Theme["layout"])}
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
          >
            <option value="classic">Classic (centered photo)</option>
          </select>
        </div>

        {/* Background */}
        <fieldset className="border border-slate-700 rounded p-3">
          <legend className="text-xs text-slate-400 px-2">Background</legend>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-slate-400 w-28 text-right">Type</label>
            <select
              value={theme.background.type}
              onChange={(e) => updateBg("type", e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
            >
              <option value="gradient">Gradient</option>
              <option value="solid">Solid Color</option>
              <option value="texture">Texture Image</option>
            </select>
          </div>
          {theme.background.type === "gradient" && (
            <>
              <ColorPicker
                label="Top Color"
                value={theme.background.top || [50, 50, 50]}
                onChange={(v) => updateBg("top", v)}
              />
              <ColorPicker
                label="Bottom Color"
                value={theme.background.bottom || [100, 100, 100]}
                onChange={(v) => updateBg("bottom", v)}
              />
            </>
          )}
          {theme.background.type === "solid" && (
            <ColorPicker
              label="Color"
              value={theme.background.color || [128, 128, 128]}
              onChange={(v) => updateBg("color", v)}
            />
          )}
          {theme.background.type === "texture" && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 w-28 text-right">Texture</label>
              <select
                value={theme.background_texture || ""}
                onChange={(e) => update("background_texture", e.target.value || null)}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="">None</option>
                {textures.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </fieldset>

        {/* Title */}
        <fieldset className="border border-slate-700 rounded p-3">
          <legend className="text-xs text-slate-400 px-2">Title ("Pawsport")</legend>
          <FontSelector label="Font" value={theme.title_font} onChange={(v) => update("title_font", v)} />
          <div className="flex items-center gap-2 mt-1">
            <label className="text-xs text-slate-400 w-28 text-right">Size</label>
            <input
              type="range"
              min={40}
              max={200}
              value={theme.title_size}
              onChange={(e) => update("title_size", Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-slate-500 w-8">{theme.title_size}</span>
          </div>
          <ColorPicker label="Color" value={theme.title_color} onChange={(v) => update("title_color", v)} />
        </fieldset>

        {/* Body Text */}
        <fieldset className="border border-slate-700 rounded p-3">
          <legend className="text-xs text-slate-400 px-2">Body Text</legend>
          <FontSelector label="Label Font" value={theme.label_font} onChange={(v) => update("label_font", v)} />
          <ColorPicker label="Label Color" value={theme.label_color} onChange={(v) => update("label_color", v)} />
          <FontSelector label="Value Font" value={theme.value_font} onChange={(v) => update("value_font", v)} />
          <ColorPicker label="Value Color" value={theme.value_color} onChange={(v) => update("value_color", v)} />
        </fieldset>

        {/* Dog Name */}
        <fieldset className="border border-slate-700 rounded p-3">
          <legend className="text-xs text-slate-400 px-2">Dog Name</legend>
          <FontSelector label="Font" value={theme.name_font} onChange={(v) => update("name_font", v)} />
          <ColorPicker label="Color" value={theme.name_color} onChange={(v) => update("name_color", v)} />
        </fieldset>

        {/* Accent & Decorations */}
        <fieldset className="border border-slate-700 rounded p-3">
          <legend className="text-xs text-slate-400 px-2">Accent & Decorations</legend>
          <ColorPicker label="Accent" value={theme.accent_color} onChange={(v) => update("accent_color", v)} />
          <ColorPicker label="Border Glow" value={theme.border_color} onChange={(v) => update("border_color", v)} />
          <div className="flex items-center gap-2 mt-1">
            <label className="text-xs text-slate-400 w-28 text-right">Decorations</label>
            <div className="flex gap-1">
              {DECORATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => update("decorations", d)}
                  className={`px-2 py-1 rounded text-xs ${
                    theme.decorations === d
                      ? "bg-amber-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        {/* Footer */}
        <fieldset className="border border-slate-700 rounded p-3">
          <legend className="text-xs text-slate-400 px-2">Footer</legend>
          <ColorPicker label="Background" value={theme.footer_bg} onChange={(v) => update("footer_bg", v)} showAlpha />
          <ColorPicker label="Text" value={theme.footer_text_color} onChange={(v) => update("footer_text_color", v)} />
        </fieldset>

        {/* Header BG (classic only) */}
        {theme.layout === "classic" && (
          <fieldset className="border border-slate-700 rounded p-3">
            <legend className="text-xs text-slate-400 px-2">Header</legend>
            <ColorPicker label="Header BG" value={theme.header_bg} onChange={(v) => update("header_bg", v)} showAlpha />
          </fieldset>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white"
          >
            {saving ? "Saving..." : "Save Theme"}
          </button>
          <button
            onClick={handleSetActive}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-white"
          >
            Save & Set Active
          </button>
          {editName && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium text-white"
            >
              Delete
            </button>
          )}
        </div>
        {message && <p className="text-xs text-amber-400">{message}</p>}
      </div>

      {/* Live Preview */}
      <div className="flex-shrink-0 sticky top-6">
        <p className="text-xs text-slate-500 mb-2">Live Preview</p>
        <PosterPreview dog={sampleDog} theme={theme} scale={0.38} />
      </div>
    </div>
  );
}
