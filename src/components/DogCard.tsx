import type { Dog } from "../types/dog";

interface Props {
  dog: Dog;
  index: number;
  selected?: boolean;
  onToggleSelect?: (index: number) => void;
  onClick: () => void;
}

export default function DogCard({ dog, index, selected, onToggleSelect, onClick }: Props) {
  return (
    <div className="relative">
      {onToggleSelect && (
        <label
          className="absolute top-2 left-2 z-10 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={() => onToggleSelect(index)}
            className="w-5 h-5 rounded border-slate-500 bg-slate-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
          />
        </label>
      )}
      <button
        onClick={onClick}
        className={`w-full bg-slate-800 rounded-xl overflow-hidden border transition-all text-left group ${
          selected
            ? "border-amber-500 shadow-lg shadow-amber-500/20"
            : "border-slate-700 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10"
        }`}
      >
        <div className="aspect-[4/3] bg-slate-700 overflow-hidden">
          {dog["Photo URL"] ? (
            <img
              src={dog["Photo URL"]}
              alt={dog["Pet Name"]}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
              No Photo
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-white text-lg truncate">{dog["Pet Name"]}</h3>
          <p className="text-sm text-slate-400 truncate">{dog["Pet Breed"]}</p>
          <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
            <span>{dog["Gender"]}</span>
            <span>{dog["Age in Years"]}</span>
            <span>{dog["Weight"]}</span>
          </div>
          <p className="text-xs text-amber-400/70 mt-1 truncate">
            Foster: {dog["Current Foster/Adopter"]}
          </p>
        </div>
      </button>
    </div>
  );
}
