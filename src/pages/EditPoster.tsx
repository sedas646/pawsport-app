import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDogs } from "../context/DogsContext";
import PosterPreview from "../components/PosterPreview";
import PosterEditor from "../components/PosterEditor";
import PhotoRepositioner from "../components/PhotoRepositioner";
import { generatePoster, saveDogSettings } from "../api/client";
import type { Dog } from "../types/dog";

export default function EditPoster() {
  const { dogIndex } = useParams<{ dogIndex: string }>();
  const navigate = useNavigate();
  const { dogs, activeTheme, activeThemeName } = useDogs();
  const idx = Number(dogIndex);

  const [editedDog, setEditedDog] = useState<Dog | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const initializedForId = useRef<string | number | null>(null);

  useEffect(() => {
    const dog = dogs[idx];
    if (dog && initializedForId.current !== dog.id) {
      // Only reset editedDog when we navigate to a genuinely different dog
      initializedForId.current = dog.id;
      setEditedDog({ ...dog });
      setGeneratedUrl(null);
    }
  }, [dogs, idx]);

  // Persist photo settings to backend whenever they change
  const savePhotoSettings = useCallback(
    (dog: Dog) => {
      saveDogSettings(dog.id, {
        photo_mode: dog.photo_mode ?? "fill",
        photo_crop_y: dog.photo_crop_y ?? 30,
      }).catch(() => {}); // fire-and-forget
    },
    []
  );

  if (!editedDog || !activeTheme) {
    return (
      <div className="text-center py-16 text-slate-400">
        {!editedDog ? "Dog not found." : "Loading theme..."}
        <button onClick={() => navigate("/")} className="block mx-auto mt-4 text-amber-400 underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      console.log("[GENERATE] Sending dog data:", { photo_mode: editedDog.photo_mode, photo_crop_y: editedDog.photo_crop_y, name: editedDog["Pet Name"] });
      const res = await generatePoster(editedDog, activeThemeName);
      setGeneratedUrl(res.url + "?t=" + Date.now());
    } catch (e: any) {
      alert("Generation failed: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCropYChange = (cropY: number) => {
    const updated = { ...editedDog, photo_crop_y: cropY };
    setEditedDog(updated);
    setGeneratedUrl(null);
    savePhotoSettings(updated);
  };

  const handleModeChange = (mode: "fit" | "fill") => {
    const updated = { ...editedDog, photo_mode: mode };
    setEditedDog(updated);
    setGeneratedUrl(null);
    savePhotoSettings(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white text-sm"
        >
          &larr; Back
        </button>
        <h2 className="text-xl font-bold text-white">{editedDog["Pet Name"]}</h2>
        <div className="flex-1" />
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition"
        >
          {generating ? "Generating..." : "Generate Final Poster"}
        </button>
        {generatedUrl && (
          <a
            href={generatedUrl}
            download={`${editedDog["Pet Name"]}.jpg`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-white transition"
          >
            Download
          </a>
        )}
      </div>

      <div className="flex gap-6 items-start">
        {/* Preview */}
        <div className="flex-shrink-0">
          {generatedUrl ? (
            <div>
              <p className="text-xs text-emerald-400 mb-2">Generated (300 DPI)</p>
              <img
                src={generatedUrl}
                alt="Generated poster"
                className="rounded-lg shadow-lg"
                style={{ width: 420, height: 630 }}
              />
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500 mb-2">Live Preview</p>
              <PosterPreview dog={editedDog} theme={activeTheme} scale={0.35} />
            </div>
          )}
        </div>

        {/* Photo Repositioner + Editor */}
        <div className="flex-1 max-w-md space-y-4">
          {/* Photo position */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Photo Position
            </h3>
            <PhotoRepositioner
              photoUrl={editedDog["Photo URL"] || ""}
              cropY={editedDog.photo_crop_y ?? 30}
              mode={editedDog.photo_mode ?? "fill"}
              onCropYChange={handleCropYChange}
              onModeChange={handleModeChange}
            />
          </div>

          {/* Field editor */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <PosterEditor dog={editedDog} onChange={setEditedDog} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {idx > 0 && (
          <button
            onClick={() => navigate(`/poster/${idx - 1}`)}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300"
          >
            &larr; Previous
          </button>
        )}
        {idx < dogs.length - 1 && (
          <button
            onClick={() => navigate(`/poster/${idx + 1}`)}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300"
          >
            Next &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
