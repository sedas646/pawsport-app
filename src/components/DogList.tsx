import type { Dog } from "../types/dog";
import DogCard from "./DogCard";

interface Props {
  dogs: Dog[];
  selectedIndices?: Set<number>;
  onToggleSelect?: (index: number) => void;
  onSelect: (index: number) => void;
}

export default function DogList({ dogs, selectedIndices, onToggleSelect, onSelect }: Props) {
  if (dogs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        No fostered dogs found. Try refreshing from the API.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {dogs.map((dog, i) => (
        <DogCard
          key={dog.id || i}
          dog={dog}
          index={i}
          selected={selectedIndices?.has(i)}
          onToggleSelect={onToggleSelect}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
