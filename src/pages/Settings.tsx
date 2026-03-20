import { useState, useRef } from "react";

export default function Settings() {
  const [uploadMsg, setUploadMsg] = useState("");
  const fontInput = useRef<HTMLInputElement>(null);
  const texInput = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, endpoint: string) => {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(endpoint, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUploadMsg(`Uploaded: ${data.uploaded}`);
    } catch (e: any) {
      setUploadMsg(`Error: ${e.message}`);
    }
  };

  return (
    <div className="max-w-lg space-y-8">
      <h2 className="text-xl font-bold text-white">Settings</h2>

      {/* Font Upload */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Upload Custom Font
        </h3>
        <p className="text-xs text-slate-500">
          Upload .ttf or .otf files. They'll be available in the Theme Designer font dropdowns
          and used by the poster generator.
        </p>
        <div className="flex gap-2">
          <input
            ref={fontInput}
            type="file"
            accept=".ttf,.otf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f, "/api/fonts/upload");
            }}
          />
          <button
            onClick={() => fontInput.current?.click()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white"
          >
            Choose Font File
          </button>
        </div>
      </section>

      {/* Texture Upload */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Upload Background Texture
        </h3>
        <p className="text-xs text-slate-500">
          Upload PNG, JPG, or WebP images to use as poster backgrounds in the Theme Designer.
        </p>
        <div className="flex gap-2">
          <input
            ref={texInput}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f, "/api/textures/upload");
            }}
          />
          <button
            onClick={() => texInput.current?.click()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white"
          >
            Choose Texture Image
          </button>
        </div>
      </section>

      {uploadMsg && (
        <p className="text-sm text-amber-400">{uploadMsg}</p>
      )}

      {/* Info */}
      <section className="space-y-2 text-xs text-slate-500">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Configuration
        </h3>
        <p>
          API keys and email settings are in <code className="text-slate-400">config.json</code> in the project root.
          Edit that file directly to change PetStablished API key or Gmail credentials.
        </p>
      </section>
    </div>
  );
}
