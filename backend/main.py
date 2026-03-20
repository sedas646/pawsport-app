"""PAWSPORT Web App — FastAPI Backend"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .routers import dogs, posters, themes, email

app = FastAPI(title="PAWSPORT API", version="1.0.0")

# CORS for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dogs.router)
app.include_router(posters.router)
app.include_router(themes.router)
app.include_router(email.router)

# Static file serving for generated posters, fonts, and textures
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BACKEND_DIR, "output")
FONTS_DIR = os.path.join(BACKEND_DIR, "fonts")
TEXTURES_DIR = os.path.join(BACKEND_DIR, "textures")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(FONTS_DIR, exist_ok=True)
os.makedirs(TEXTURES_DIR, exist_ok=True)

app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")
app.mount("/fonts", StaticFiles(directory=FONTS_DIR), name="fonts")
app.mount("/textures", StaticFiles(directory=TEXTURES_DIR), name="textures")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "PAWSPORT"}


# Serve built React frontend (production only — dist/ exists after build)
APP_DIR = os.path.dirname(BACKEND_DIR)
DIST_DIR = os.path.join(APP_DIR, "dist")

if os.path.isdir(DIST_DIR):
    # Serve static assets (JS, CSS, images) from dist/assets/
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="frontend-assets")

    # SPA fallback: serve index.html for all unmatched routes
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for any route not handled by API or static mounts."""
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
