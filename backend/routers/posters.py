"""Posters router — generate single/bulk posters, download, zip."""

import json
import os
import datetime
import zipfile
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from ..services.poster_generator import generate_poster
from .themes import _load_theme, _active_theme

router = APIRouter(prefix="/api/posters", tags=["posters"])

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BACKEND_DIR, "output")
DOG_SETTINGS_PATH = os.path.join(BACKEND_DIR, "dog_settings.json")


def _merge_saved_settings(dog: dict) -> dict:
    """Always merge saved photo settings into dog data before generating.
    This ensures photo_mode/photo_crop_y are used even if the frontend
    state was reset."""
    dog_id = str(dog.get("id", ""))
    if not dog_id:
        return dog
    try:
        if os.path.exists(DOG_SETTINGS_PATH):
            with open(DOG_SETTINGS_PATH) as f:
                all_settings = json.load(f)
            saved = all_settings.get(dog_id, {})
            # Saved settings are the source of truth for photo settings
            # Always apply them (they were explicitly saved by user)
            dog.update(saved)
    except Exception:
        pass
    return dog


def _safe_filename(name: str) -> str:
    return "".join(c if c.isalnum() or c in " _-" else "_" for c in name)


@router.post("/generate")
def generate_single(body: dict):
    """Generate a single poster. Body: { dog: {...}, theme_name?: string }"""
    dog = body.get("dog")
    if not dog:
        raise HTTPException(400, "dog data required")

    theme_name = body.get("theme_name", _active_theme["name"])
    try:
        theme = body.get("theme_override") or _load_theme(theme_name)
    except HTTPException:
        theme = _load_theme("spring")

    dog = _merge_saved_settings(dog)
    print(f"[GENERATE] {dog.get('Pet Name')}: photo_mode={dog.get('photo_mode')}, crop_y={dog.get('photo_crop_y')}")
    name = dog.get("Pet Name", "unknown").strip()
    safe_name = _safe_filename(name)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, f"{safe_name}.jpg")

    generate_poster(dog, out_path, theme)

    return {
        "filename": f"{safe_name}.jpg",
        "url": f"/output/{safe_name}.jpg",
        "name": name,
    }


@router.post("/generate-all")
def generate_all(body: dict):
    """Generate posters for all dogs. Body: { dogs: [...], theme_name?: string }"""
    dogs = body.get("dogs", [])
    if not dogs:
        raise HTTPException(400, "dogs array required")

    theme_name = body.get("theme_name", _active_theme["name"])
    try:
        theme = body.get("theme_override") or _load_theme(theme_name)
    except HTTPException:
        theme = _load_theme("spring")

    date_str = datetime.date.today().strftime("%Y-%m-%d")
    batch_dir = os.path.join(OUTPUT_DIR, date_str)
    os.makedirs(batch_dir, exist_ok=True)

    results = []
    for dog in dogs:
        name = dog.get("Pet Name", "unknown").strip()
        safe_name = _safe_filename(name)
        dog = _merge_saved_settings(dog)
        out_path = os.path.join(batch_dir, f"{safe_name}.jpg")
        try:
            generate_poster(dog, out_path, theme)
            results.append({"name": name, "filename": f"{safe_name}.jpg", "success": True})
        except Exception as e:
            results.append({"name": name, "error": str(e), "success": False})

    # Create zip
    zip_name = f"pawsport-posters-{date_str}.zip"
    zip_path = os.path.join(OUTPUT_DIR, zip_name)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname in sorted(os.listdir(batch_dir)):
            if fname.lower().endswith(".jpg"):
                zf.write(os.path.join(batch_dir, fname), fname)

    return {
        "results": results,
        "count": len([r for r in results if r["success"]]),
        "zip_url": f"/output/{zip_name}",
        "zip_filename": zip_name,
    }


@router.get("/download/{filename}")
def download_file(filename: str):
    # Check output root first, then dated subdirs
    path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(path):
        return FileResponse(path, filename=filename)

    # Search in subdirectories
    for subdir in os.listdir(OUTPUT_DIR):
        sub_path = os.path.join(OUTPUT_DIR, subdir, filename)
        if os.path.exists(sub_path):
            return FileResponse(sub_path, filename=filename)

    raise HTTPException(404, f"File not found: {filename}")
