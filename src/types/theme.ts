export interface ThemeBackground {
  type: "gradient" | "solid" | "texture";
  top?: number[];
  bottom?: number[];
  color?: number[];
}

export interface Theme {
  name: string;
  layout: "classic";
  background: ThemeBackground;
  background_texture: string | null;
  title_font: string;
  title_size: number;
  title_color: number[];
  label_font: string;
  label_color: number[];
  value_font: string;
  value_color: number[];
  name_font: string;
  name_color: number[];
  accent_color: number[];
  border_color: number[];
  decorations: "none" | "snowflakes" | "paws" | "flowers" | "leaves";
  header_bg: number[];
  footer_bg: number[];
  footer_text_color: number[];
}

export interface ThemeSummary {
  name: string;
  display_name: string;
  layout: string;
  accent_color: number[];
}

export interface FontInfo {
  name: string;
  filename: string;
}

export const DEFAULT_THEME: Theme = {
  name: "Custom",
  layout: "classic",
  background: { type: "gradient", top: [50, 50, 80], bottom: [80, 80, 120] },
  background_texture: null,
  title_font: "Lato-Black",
  title_size: 118,
  title_color: [255, 255, 255],
  label_font: "Poppins-Bold",
  label_color: [180, 215, 255],
  value_font: "Poppins-Regular",
  value_color: [255, 255, 255],
  name_font: "Lora-Italic",
  name_color: [255, 255, 255],
  accent_color: [150, 200, 255],
  border_color: [180, 220, 255],
  decorations: "none",
  header_bg: [4, 12, 45, 215],
  footer_bg: [10, 25, 70, 220],
  footer_text_color: [255, 255, 255],
};
