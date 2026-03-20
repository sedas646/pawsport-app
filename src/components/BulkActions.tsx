import { useState } from "react";
import { useDogs } from "../context/DogsContext";
import { generateAllPosters, sendEmail } from "../api/client";
import type { Dog } from "../types/dog";

interface Props {
  selectedDogs?: Dog[];
  selectedCount?: number;
  onSelectAll?: () => void;
  onSelectNone?: () => void;
}

export default function BulkActions({ selectedDogs, selectedCount = 0, onSelectAll, onSelectNone }: Props) {
  const { dogs, activeThemeName } = useDogs();
  const [generating, setGenerating] = useState(false);
  const [generatingSelected, setGeneratingSelected] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ zip_url?: string; message?: string } | null>(null);

  const handleGenerateAll = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await generateAllPosters(dogs, activeThemeName);
      setResult({ zip_url: res.zip_url, message: `Generated ${res.count} posters` });
    } catch (e: any) {
      setResult({ message: `Error: ${e.message}` });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSelected = async () => {
    if (!selectedDogs || selectedDogs.length === 0) return;
    setGeneratingSelected(true);
    setResult(null);
    try {
      const res = await generateAllPosters(selectedDogs, activeThemeName);
      setResult({ zip_url: res.zip_url, message: `Generated ${res.count} of ${selectedDogs.length} selected posters` });
    } catch (e: any) {
      setResult({ message: `Error: ${e.message}` });
    } finally {
      setGeneratingSelected(false);
    }
  };

  const handleEmail = async () => {
    setSending(true);
    try {
      const res = await sendEmail(result?.zip_url?.split("/").pop());
      setResult((r) => ({ ...r, message: `${r?.message} | Email sent to ${res.recipient}` }));
    } catch (e: any) {
      setResult((r) => ({ ...r, message: `${r?.message} | Email error: ${e.message}` }));
    } finally {
      setSending(false);
    }
  };

  const busy = generating || generatingSelected;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Selection controls */}
      {onSelectAll && onSelectNone && (
        <div className="flex items-center gap-2 mr-2">
          <button
            onClick={onSelectAll}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition"
          >
            Select All
          </button>
          <button
            onClick={onSelectNone}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition"
          >
            Clear
          </button>
          {selectedCount > 0 && (
            <span className="text-xs text-amber-400">{selectedCount} selected</span>
          )}
        </div>
      )}

      {/* Generate Selected */}
      {selectedCount > 0 && (
        <button
          onClick={handleGenerateSelected}
          disabled={busy}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition"
        >
          {generatingSelected ? "Generating..." : `Generate Selected (${selectedCount})`}
        </button>
      )}

      {/* Generate All */}
      <button
        onClick={handleGenerateAll}
        disabled={busy || dogs.length === 0}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition"
      >
        {generating ? "Generating..." : `Generate All (${dogs.length})`}
      </button>

      {result?.zip_url && (
        <>
          <a
            href={result.zip_url}
            download
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-white transition"
          >
            Download ZIP
          </a>
          <button
            onClick={handleEmail}
            disabled={sending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition"
          >
            {sending ? "Sending..." : "Email ZIP"}
          </button>
        </>
      )}

      {result?.message && (
        <span className="text-xs text-slate-400">{result.message}</span>
      )}
    </div>
  );
}
