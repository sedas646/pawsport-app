import type { Dog } from "../types/dog";
import type { Theme } from "../types/theme";
import { rgbaToString, rgbToHex } from "../utils/formatters";
import { formatValue } from "../utils/formatters";

interface Props {
  dog: Dog;
  theme: Theme;
  scale?: number;
}

const FONT_MAP: Record<string, string> = {
  "Lato-Black": "Lato",
  "Poppins-Bold": "Poppins",
  "Poppins-Regular": "Poppins",
  "Lora-Italic": "Lora",
  Pacifico: "Pacifico",
  DancingScript: "DancingScript",
};

function fontFamily(name: string) {
  return FONT_MAP[name] || name;
}

function bgStyle(theme: Theme): React.CSSProperties {
  const bg = theme.background;
  if (bg.type === "solid" && bg.color) {
    return { backgroundColor: rgbToHex(bg.color) };
  }
  if (bg.type === "texture" && theme.background_texture) {
    return {
      backgroundImage: `url(/textures/${theme.background_texture})`,
      backgroundSize: "cover",
    };
  }
  const top = bg.top || [50, 50, 50];
  const bottom = bg.bottom || [100, 100, 100];
  return {
    background: `linear-gradient(to bottom, ${rgbToHex(top)}, ${rgbToHex(bottom)})`,
  };
}

export default function PosterPreview({ dog, theme, scale = 0.35 }: Props) {
  return (
    <div
      className="origin-top-left"
      style={{ width: 1200 * scale, height: 1800 * scale }}
    >
      <div
        className="overflow-hidden relative"
        style={{
          width: 1200,
          height: 1800,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          ...bgStyle(theme),
        }}
      >
        <ClassicLayout dog={dog} theme={theme} />
      </div>
    </div>
  );
}

function ClassicLayout({ dog, theme }: { dog: Dog; theme: Theme }) {
  return (
    <>
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center"
        style={{
          height: 165,
          backgroundColor: rgbaToString(theme.header_bg),
          borderBottom: `3px solid ${rgbToHex(theme.accent_color)}33`,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily(theme.title_font),
            fontSize: theme.title_size,
            color: rgbToHex(theme.title_color),
            textShadow: "5px 5px 8px rgba(0,0,0,0.5)",
          }}
        >
          PAWSPORT
        </span>
      </div>

      {/* Photo */}
      <div
        className="absolute overflow-hidden rounded-2xl"
        style={{
          left: 50,
          top: 193,
          width: 1100,
          height: 850,
          boxShadow: `0 0 20px ${rgbToHex(theme.border_color)}66`,
          border: `4px solid ${rgbToHex(theme.border_color)}cc`,
        }}
      >
        {dog["Photo URL"] ? (
          (dog.photo_mode ?? "fill") === "fill" ? (
            <img
              src={dog["Photo URL"]}
              className="w-full h-full object-cover"
              style={{ objectPosition: `center ${dog.photo_crop_y ?? 30}%` }}
              alt=""
            />
          ) : (
            /* Fit mode: blurred bg + centered full image */
            <div className="relative w-full h-full">
              <img
                src={dog["Photo URL"]}
                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40"
                alt=""
              />
              <img
                src={dog["Photo URL"]}
                className="absolute inset-0 w-full h-full object-contain"
                alt=""
              />
            </div>
          )
        ) : (
          <div className="w-full h-full bg-slate-600 flex items-center justify-center text-white/50">
            No Photo
          </div>
        )}
      </div>

      {/* Name */}
      <div
        className="absolute left-0 right-0 text-center"
        style={{ top: 1098 }}
      >
        <span
          style={{
            fontFamily: fontFamily(theme.name_font),
            fontStyle: theme.name_font.includes("Italic") ? "italic" : "normal",
            fontSize: 78,
            color: rgbToHex(theme.name_color),
            textShadow: "3px 3px 6px rgba(0,0,0,0.4)",
          }}
        >
          {dog["Pet Name"]}
        </span>
      </div>

      {/* Divider */}
      <div
        className="absolute"
        style={{
          left: 50,
          right: 50,
          top: 1180,
          height: 1,
          backgroundColor: `${rgbToHex(theme.accent_color)}33`,
        }}
      />

      {/* Info grid */}
      <InfoGrid dog={dog} theme={theme} top={1208} />

      {/* Footer */}
      <div
        className="absolute bottom-[36px] left-1/2 -translate-x-1/2 flex items-center justify-center rounded-2xl"
        style={{
          width: 490,
          height: 72,
          backgroundColor: rgbaToString(theme.footer_bg),
        }}
      >
        <span
          style={{
            fontFamily: fontFamily(theme.label_font),
            fontWeight: 700,
            fontSize: 42,
            color: rgbToHex(theme.footer_text_color),
          }}
        >
          ReachRescue.org
        </span>
      </div>
    </>
  );
}

function InfoGrid({ dog, theme, top }: { dog: Dog; theme: Theme; top: number }) {
  const left = [
    ["Foster", dog["Current Foster/Adopter"]],
    ["Age", dog["Age in Years"]],
    ["Weight", dog["Weight"]],
    ["Sex", dog["Gender"]],
    ["Breed", dog["Pet Breed"]],
  ];
  const right = [
    ["House Trained", dog["Housebroken?"]],
    ["Kids", dog["Gets along with Kids?"]],
    ["Cats", dog["Gets along with Cats?"]],
    ["Dogs", dog["Gets along with Dogs?"]],
    ["Medical", dog["Known Medical"]],
  ];

  return (
    <div className="absolute flex" style={{ left: 50, right: 50, top }}>
      <div className="flex-1">
        {left.map(([l, v], i) => (
          <FieldRow key={l} label={l} value={v} theme={theme} y={i * 72} />
        ))}
      </div>
      <div
        className="mx-5"
        style={{ width: 1, backgroundColor: `${rgbToHex(theme.accent_color)}28` }}
      />
      <div className="flex-1">
        {right.map(([l, v], i) => (
          <FieldRow key={l} label={l} value={v} theme={theme} y={i * 72} />
        ))}
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: Theme;
  y: number;
}) {
  return (
    <div className="flex items-center h-[72px]">
      <span
        style={{
          fontFamily: fontFamily(theme.label_font),
          fontWeight: 700,
          fontSize: 33,
          color: rgbToHex(theme.label_color),
          whiteSpace: "nowrap",
        }}
      >
        {label}:
      </span>
      <span
        className="ml-3"
        style={{
          fontFamily: fontFamily(theme.value_font),
          fontSize: 33,
          color: rgbToHex(theme.value_color),
        }}
      >
        {formatValue(value)}
      </span>
    </div>
  );
}
