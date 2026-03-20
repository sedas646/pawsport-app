import { rgbToHex, hexToRgb } from "../utils/formatters";

interface Props {
  label: string;
  value: number[];
  onChange: (rgb: number[]) => void;
  showAlpha?: boolean;
}

export default function ColorPicker({ label, value, onChange, showAlpha }: Props) {
  const hex = rgbToHex(value);
  const alpha = value.length >= 4 ? value[3] : 255;

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-400 w-28 text-right flex-shrink-0">{label}</label>
      <input
        type="color"
        value={hex}
        onChange={(e) => {
          const rgb = hexToRgb(e.target.value);
          onChange(showAlpha ? [...rgb, alpha] : rgb);
        }}
        className="w-8 h-8 rounded border border-slate-600 cursor-pointer bg-transparent"
      />
      <span className="text-xs text-slate-500 font-mono">{hex}</span>
      {showAlpha && (
        <input
          type="range"
          min={0}
          max={255}
          value={alpha}
          onChange={(e) => onChange([...value.slice(0, 3), Number(e.target.value)])}
          className="w-16"
          title={`Alpha: ${alpha}`}
        />
      )}
    </div>
  );
}
