import { useDogs } from "../context/DogsContext";
import { rgbToHex } from "../utils/formatters";

export default function ThemeSelector() {
  const { themes, activeThemeName, setActiveTheme } = useDogs();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 mr-1">Theme:</span>
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => setActiveTheme(t.name)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
            t.name === activeThemeName
              ? "ring-2 ring-amber-400 text-white"
              : "text-slate-300 hover:text-white"
          }`}
          style={{
            backgroundColor: rgbToHex(t.accent_color) + "33",
            borderColor: rgbToHex(t.accent_color),
          }}
          title={t.display_name}
        >
          {t.display_name}
        </button>
      ))}
    </div>
  );
}
