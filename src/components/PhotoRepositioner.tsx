import { useRef, useState, useCallback } from "react";

interface Props {
  photoUrl: string;
  /** Vertical crop position 0–100 (0 = show top, 100 = show bottom). Default 30. */
  cropY: number;
  /** "fit" = show full photo (no crop), "fill" = crop to fill frame. */
  mode: "fit" | "fill";
  onCropYChange: (cropY: number) => void;
  onModeChange: (mode: "fit" | "fill") => void;
}

/**
 * Photo repositioner with Fit/Fill toggle.
 * - Fit: shows the entire photo with no cropping (blurred bg fills sides on poster).
 * - Fill: zooms to fill the frame; user drags to choose visible portion.
 */
export default function PhotoRepositioner({
  photoUrl,
  cropY,
  mode,
  onCropYChange,
  onModeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  const [imgDisplayH, setImgDisplayH] = useState(0);
  const startY = useRef(0);
  const startCropY = useRef(0);

  // Container dimensions — matches poster photo aspect ratio (1100:850)
  const CONTAINER_W = 320;
  const CONTAINER_H = Math.round(CONTAINER_W * (850 / 1100));

  const onImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const scale = CONTAINER_W / img.naturalWidth;
    setImgDisplayH(img.naturalHeight * scale);
  }, [CONTAINER_W]);

  const getTopOffset = useCallback(() => {
    if (imgDisplayH <= CONTAINER_H) return 0;
    const maxOffset = imgDisplayH - CONTAINER_H;
    return -(cropY / 100) * maxOffset;
  }, [cropY, imgDisplayH, CONTAINER_H]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mode !== "fill" || imgDisplayH <= CONTAINER_H) return;
      setDragging(true);
      startY.current = e.clientY;
      startCropY.current = cropY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [cropY, mode, imgDisplayH, CONTAINER_H]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const maxOffset = imgDisplayH - CONTAINER_H;
      if (maxOffset <= 0) return;
      const dy = e.clientY - startY.current;
      const deltaPct = (-dy / maxOffset) * 100;
      const newCropY = Math.max(0, Math.min(100, startCropY.current + deltaPct));
      onCropYChange(Math.round(newCropY));
    },
    [dragging, imgDisplayH, CONTAINER_H, onCropYChange]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  if (!photoUrl) {
    return (
      <div
        className="bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 text-sm"
        style={{ width: CONTAINER_W, height: CONTAINER_H }}
      >
        No Photo
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Fit / Fill toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => onModeChange("fit")}
          className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${
            mode === "fit"
              ? "bg-amber-600 text-white"
              : "bg-slate-700 text-slate-400 hover:bg-slate-600"
          }`}
        >
          Fit (full photo)
        </button>
        <button
          onClick={() => onModeChange("fill")}
          className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${
            mode === "fill"
              ? "bg-amber-600 text-white"
              : "bg-slate-700 text-slate-400 hover:bg-slate-600"
          }`}
        >
          Fill (crop to frame)
        </button>
      </div>

      {mode === "fit" ? (
        /* Fit mode — show entire image centered in the frame */
        <div
          className="relative overflow-hidden rounded-lg border-2 border-slate-600 bg-slate-800 flex items-center justify-center"
          style={{ width: CONTAINER_W, height: CONTAINER_H }}
        >
          <img
            src={photoUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      ) : (
        /* Fill mode — draggable crop */
        <>
          <p className="text-xs text-slate-400">
            Drag photo up/down to reposition
          </p>
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg border-2 border-slate-600 select-none"
            style={{
              width: CONTAINER_W,
              height: CONTAINER_H,
              cursor: dragging
                ? "grabbing"
                : imgDisplayH > CONTAINER_H
                ? "grab"
                : "default",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img
              ref={imgRef}
              src={photoUrl}
              alt="Reposition"
              draggable={false}
              onLoad={onImageLoad}
              className="absolute left-0 pointer-events-none"
              style={{
                width: CONTAINER_W,
                top: getTopOffset(),
                transition: dragging ? "none" : "top 0.15s ease-out",
              }}
            />
            <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          </div>

          {/* Slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Top</span>
            <input
              type="range"
              min={0}
              max={100}
              value={cropY}
              onChange={(e) => onCropYChange(Number(e.target.value))}
              className="flex-1 accent-amber-500"
              style={{ width: CONTAINER_W - 60 }}
            />
            <span className="text-xs text-slate-500">Bottom</span>
          </div>
          <p className="text-xs text-slate-500 text-center">
            Position: {cropY}%
          </p>
        </>
      )}

      <p className="text-xs text-slate-500">
        {mode === "fit"
          ? "Shows the entire photo with no cropping."
          : "Crops the photo to fill the poster frame. Drag to choose visible area."}
      </p>
    </div>
  );
}
