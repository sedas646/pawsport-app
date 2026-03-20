import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDogs } from "../context/DogsContext";
import DogList from "../components/DogList";
import ThemeSelector from "../components/ThemeSelector";
import BulkActions from "../components/BulkActions";

export default function Dashboard() {
  const { dogs, loading, error, refreshDogs } = useDogs();
  const navigate = useNavigate();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleToggleSelect = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIndices(new Set(dogs.map((_, i) => i)));
  }, [dogs]);

  const handleSelectNone = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const selectedDogs = dogs.filter((_, i) => selectedIndices.has(i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Fostered Dogs
            {dogs.length > 0 && (
              <span className="text-base font-normal text-slate-400 ml-2">
                ({dogs.length})
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector />
          <button
            onClick={() => refreshDogs(true)}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm text-slate-200 transition"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <BulkActions
        selectedDogs={selectedDogs}
        selectedCount={selectedIndices.size}
        onSelectAll={handleSelectAll}
        onSelectNone={handleSelectNone}
      />

      {loading && dogs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          Fetching dogs from PetStablished...
        </div>
      ) : (
        <DogList
          dogs={dogs}
          selectedIndices={selectedIndices}
          onToggleSelect={handleToggleSelect}
          onSelect={(i) => navigate(`/poster/${i}`)}
        />
      )}
    </div>
  );
}
