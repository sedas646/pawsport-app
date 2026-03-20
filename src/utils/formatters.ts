export function formatValue(val: string | undefined | null): string {
  if (!val || val.trim() === "" || val === "--" || val === "N/A" || val === "Not Sure")
    return "--";
  const v = val.trim();
  if (["YES", "Y", "TRUE", "1"].includes(v.toUpperCase())) return "Yes";
  if (["NO", "N", "FALSE", "0"].includes(v.toUpperCase())) return "No";
  return v;
}

export function rgbToHex(rgb: number[]): string {
  return "#" + rgb.slice(0, 3).map(c => c.toString(16).padStart(2, "0")).join("");
}

export function hexToRgb(hex: string): number[] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function rgbaToString(rgba: number[]): string {
  if (rgba.length === 4) {
    return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${(rgba[3] / 255).toFixed(2)})`;
  }
  return `rgb(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`;
}
