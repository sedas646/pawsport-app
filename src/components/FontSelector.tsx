import { useEffect, useState } from "react";
import { fetchFonts } from "../api/client";
import type { FontInfo } from "../types/theme";

interface Props {
  label: string;
  value: string;
  onChange: (fontName: string) => void;
}

let _fontsCache: FontInfo[] | null = null;

export default function FontSelector({ label, value, onChange }: Props) {
  const [fonts, setFonts] = useState<FontInfo[]>(_fontsCache || []);

  useEffect(() => {
    if (!_fontsCache) {
      fetchFonts().then((res) => {
        _fontsCache = res.fonts;
        setFonts(res.fonts);
      });
    }
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-400 w-28 text-right flex-shrink-0">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
      >
        {fonts.map((f) => (
          <option key={f.name} value={f.name}>
            {f.name}
          </option>
        ))}
      </select>
    </div>
  );
}
