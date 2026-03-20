"""Load app config from config.json (local dev) or environment variables (production)."""

import json
import os

_config = None
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(APP_DIR, "config.json")


def _load_config() -> dict:
    """Try config.json first, fall back to environment variables."""
    # Local dev: load from config.json
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH) as f:
            return json.load(f)

    # Production: load from environment variables
    return {
        "petstablished_api_key": os.environ.get("PETSTABLISHED_API_KEY", ""),
        "gmail_user": os.environ.get("GMAIL_USER", ""),
        "gmail_app_password": os.environ.get("GMAIL_PASS", ""),
        "email_recipient": os.environ.get("GMAIL_RECIPIENT", ""),
        "output_base_dir": "./backend/output",
    }


def get_config() -> dict:
    global _config
    if _config is None:
        _config = _load_config()
    return _config


def reload_config() -> dict:
    global _config
    _config = None
    return get_config()
