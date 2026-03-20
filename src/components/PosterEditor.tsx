import type { Dog } from "../types/dog";

interface Props {
  dog: Dog;
  onChange: (updated: Dog) => void;
}

const EDITABLE_FIELDS: { key: keyof Dog; label: string }[] = [
  { key: "Pet Name", label: "Name" },
  { key: "Pet Breed", label: "Breed" },
  { key: "Age in Years", label: "Age" },
  { key: "Weight", label: "Weight" },
  { key: "Gender", label: "Sex" },
  { key: "Current Foster/Adopter", label: "Foster" },
  { key: "Housebroken?", label: "House Trained" },
  { key: "Crate", label: "Crate Trained" },
  { key: "Gets along with Kids?", label: "Kids" },
  { key: "Gets along with Cats?", label: "Cats" },
  { key: "Gets along with Dogs?", label: "Dogs" },
  { key: "Known Medical", label: "Medical" },
  { key: "Fenced Yard", label: "Fenced Yard" },
  { key: "Another dog", label: "Another Dog" },
  { key: "Photo URL", label: "Photo URL" },
];

export default function PosterEditor({ dog, onChange }: Props) {
  const update = (key: keyof Dog, value: string) => {
    onChange({ ...dog, [key]: value });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Edit Fields
      </h3>
      {EDITABLE_FIELDS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2">
          <label className="text-xs text-slate-400 w-24 text-right flex-shrink-0">
            {label}
          </label>
          <input
            type="text"
            value={String(dog[key] ?? "")}
            onChange={(e) => update(key, e.target.value)}
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </div>
      ))}
    </div>
  );
}
