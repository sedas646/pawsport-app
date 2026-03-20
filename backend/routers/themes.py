"""Themes router — CRUD for theme definitions + font management."""

import json
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["themes"])

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THEMES_DIR = os.path.join(BACKEND_DIR, "themes")
FONTS_DIR = os.path.join(BACKEND_DIR, "fonts")
TEXTURES_DIR = os.path.join(BACKEND_DIR, "textures")

# Track active theme name
_active_theme = {"name": "spring"}


def _list_theme_files() -> list[str]:
    if not os.path.isdir(THEMES_DIR):
        return []
    return [f for f in os.listdir(THEMES_DIR) if f.endswith(".json")]


def _load_theme(name: str) -> dict:
    path = os.path.join(THEMES_DIR, f"{name}.json")
    if not os.path.exists(path):
        raise HTTPException(404, f"Theme '{name}' not found")
    with open(path) as f:
        return json.load(f)


def _save_theme(name: str, data: dict):
    path = os.path.join(THEMES_DIR, f"{name}.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


# ─── THEMES ──────────────────────────────────────────────────────────────────

@router.get("/themes")
def list_themes():
    themes = []
    for f in _list_theme_files():
        name = f.replace(".json", "")
        try:
            data = _load_theme(name)
            themes.append({
                "name": name,
                "display_name": data.get("name", name),
                "layout": data.get("layout", "classic"),
                "accent_color": data.get("accent_color", [150, 150, 150]),
            })
        except Exception:
            pass
    return {
        "themes": themes,
        "active": _active_theme["name"],
    }


@router.get("/themes/active")
def get_active_theme():
    try:
        data = _load_theme(_active_theme["name"])
        return {"name": _active_theme["name"], "theme": data}
    except HTTPException:
        data = _load_theme("spring")
        return {"name": "spring", "theme": data}


@router.put("/themes/active")
def set_active_theme(body: dict):
    name = body.get("name", "")
    _load_theme(name)  # validate exists
    _active_theme["name"] = name
    return {"active": name}


@router.get("/themes/{name}")
def get_theme(name: str):
    return _load_theme(name)


@router.post("/themes")
def create_theme(body: dict):
    name = body.get("name", "").strip().lower().replace(" ", "_")
    if not name:
        raise HTTPException(400, "Theme name required")
    _save_theme(name, body)
    return {"saved": name}


@router.put("/themes/{name}")
def update_theme(name: str, body: dict):
    _save_theme(name, body)
    return {"saved": name}


@router.delete("/themes/{name}")
def delete_theme(name: str):
    path = os.path.join(THEMES_DIR, f"{name}.json")
    if not os.path.exists(path):
        raise HTTPException(404, f"Theme '{name}' not found")
    os.remove(path)
    if _active_theme["name"] == name:
        _active_theme["name"] = "spring"
    return {"deleted": name}


# ─── FONTS ───────────────────────────────────────────────────────────────────

@router.get("/fonts")
def list_fonts():
    fonts = []
    if os.path.isdir(FONTS_DIR):
        for f in sorted(os.listdir(FONTS_DIR)):
            if f.lower().endswith((".ttf", ".otf")):
                name = os.path.splitext(f)[0]
                fonts.append({"name": name, "filename": f})
    return {"fonts": fonts}


@router.post("/fonts/upload")
async def upload_font(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".ttf", ".otf")):
        raise HTTPException(400, "Only .ttf and .otf files accepted")
    os.makedirs(FONTS_DIR, exist_ok=True)
    dest = os.path.join(FONTS_DIR, file.filename)
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    return {"uploaded": file.filename}


# ─── TEXTURES ────────────────────────────────────────────────────────────────

@router.get("/textures")
def list_textures():
    textures = []
    if os.path.isdir(TEXTURES_DIR):
        for f in sorted(os.listdir(TEXTURES_DIR)):
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                textures.append(f)
    return {"textures": textures}


@router.post("/textures/upload")
async def upload_texture(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        raise HTTPException(400, "Only image files accepted")
    os.makedirs(TEXTURES_DIR, exist_ok=True)
    dest = os.path.join(TEXTURES_DIR, file.filename)
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    return {"uploaded": file.filename}
