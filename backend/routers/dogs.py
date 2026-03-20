"""Dogs router — fetch fostered dogs from PetStablished API."""

import json
import os
import time
from fastapi import APIRouter, Body
from ..config import get_config
from ..services.petstablished import fetch_all_dogs, map_api_pet

router = APIRouter(prefix="/api/dogs", tags=["dogs"])

# Simple in-memory cache
_cache = {"data": None, "raw": None, "timestamp": 0}
CACHE_TTL = 300  # 5 minutes

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOG_SETTINGS_PATH = os.path.join(BACKEND_DIR, "dog_settings.json")


def _load_settings() -> dict:
    if os.path.exists(DOG_SETTINGS_PATH):
        with open(DOG_SETTINGS_PATH) as f:
            return json.load(f)
    return {}


def _save_settings(settings: dict):
    with open(DOG_SETTINGS_PATH, "w") as f:
        json.dump(settings, f, indent=2)


def _apply_settings(dogs: list) -> list:
    """Merge saved per-dog settings (photo_mode, photo_crop_y) into dog data."""
    settings = _load_settings()
    for dog in dogs:
        dog_id = str(dog.get("id", ""))
        if dog_id in settings:
            dog.update(settings[dog_id])
    return dogs


@router.get("")
def get_dogs(refresh: bool = False):
    """Fetch all fostered dogs. Cached for 5 minutes unless refresh=true."""
    now = time.time()
    if not refresh and _cache["data"] and (now - _cache["timestamp"]) < CACHE_TTL:
        dogs = [dict(d) for d in _cache["data"]]
        return {"dogs": _apply_settings(dogs), "count": len(dogs), "cached": True}

    cfg = get_config()
    raw_pets = fetch_all_dogs(cfg["petstablished_api_key"])
    mapped = [map_api_pet(p) for p in raw_pets]

    _cache["data"] = mapped
    _cache["raw"] = raw_pets
    _cache["timestamp"] = now

    dogs = [dict(d) for d in mapped]
    return {"dogs": _apply_settings(dogs), "count": len(dogs), "cached": False}


@router.put("/{dog_id}/settings")
def save_dog_settings(dog_id: str, body: dict = Body(...)):
    """Save per-dog photo settings (photo_mode, photo_crop_y)."""
    settings = _load_settings()
    # Only store photo-related keys
    allowed = {"photo_mode", "photo_crop_y"}
    dog_settings = {k: v for k, v in body.items() if k in allowed}
    settings[dog_id] = dog_settings
    _save_settings(settings)
    return {"saved": dog_id, "settings": dog_settings}
