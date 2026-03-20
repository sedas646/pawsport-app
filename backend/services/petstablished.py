"""
PetStablished API service — extracted from run_pipeline.py
Fetches fostered dogs and maps API fields to poster fields.
"""

import json
import datetime
import urllib.request


def get_season(date=None):
    if date is None:
        date = datetime.date.today()
    month, day = date.month, date.day
    if (month == 12 and day >= 21) or month <= 2 or (month == 3 and day <= 19):
        return "winter"
    elif (month == 3 and day >= 20) or month <= 5 or (month == 6 and day <= 20):
        return "spring"
    elif (month == 6 and day >= 21) or month <= 8 or (month == 9 and day <= 21):
        return "summer"
    else:
        return "fall"


def fetch_all_dogs(api_key: str) -> list[dict]:
    """Fetch ALL Fostered dogs from PetStablished API, handling pagination."""
    all_pets = []
    page = 1
    per_page = 50

    while True:
        url = (
            f"https://petstablished.com/api/v2/public/pets"
            f"?public_key={api_key}"
            f"&search[animal]=Dog"
            f"&search[status]=Fostered"
            f"&pagination[per_page]={per_page}"
            f"&pagination[page]={page}"
            f"&sort[order]=asc&sort[column]=name"
        )
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ReachRescue/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                raw_bytes = resp.read()
            data = json.loads(raw_bytes)
        except Exception as e:
            print(f"  API error on page {page}: {e}")
            break

        pets = data.get("collection") or data.get("data") or []
        if not pets:
            break

        all_pets.extend(pets)

        pagination = data.get("pagination", {})
        total = pagination.get("total_count", 0)
        if total and len(all_pets) >= total:
            break
        if len(pets) < per_page:
            break
        page += 1

    return all_pets


def get_primary_photo_url(raw: dict) -> str:
    """Extract the primary photo URL from the API response."""
    images = raw.get("images") or []
    if not images:
        return ""

    default_id = raw.get("default_image_id")

    if default_id:
        for img in images:
            if img.get("id") == default_id:
                url = img.get("image", {}).get("url", "")
                if url:
                    return url

    for img in sorted(images, key=lambda x: x.get("position") or 999):
        url = img.get("image", {}).get("url", "")
        if url:
            return url

    return images[0].get("image", {}).get("url", "")


def extract_foster_name(current_location: str) -> str:
    if not current_location:
        return "--"
    name = current_location.split(",")[0].strip()
    name = " ".join(name.split())
    return name if name else "--"


def yn(val) -> str:
    if val in (True, "Yes"):
        return "Yes"
    if val in (False, "No"):
        return "No"
    if val is None or val == "" or val == "Not Sure":
        return "--"
    return str(val)


def map_api_pet(raw: dict) -> dict:
    """Map a PetStablished API dog object to poster fields."""
    primary = (raw.get("primary_breed") or "").strip()
    secondary = (raw.get("secondary_breed") or "").strip()
    breed = primary
    if secondary and secondary.lower() not in ("", "none", primary.lower()):
        breed = f"{primary} / {secondary}"
    if not breed:
        breed = "--"

    weight_raw = str(raw.get("weight") or "").strip()
    weight = f"{weight_raw} lbs" if weight_raw else "--"

    return {
        "id": raw.get("id", ""),
        "Pet Name": (raw.get("name") or "Unknown").strip(),
        "Pet Breed": breed,
        "Weight": weight,
        "Current Foster/Adopter": extract_foster_name(raw.get("current_location", "")),
        "Gender": (raw.get("sex") or "--").strip(),
        "Age in Years": (raw.get("numerical_age") or raw.get("age") or "--").strip(),
        "Housebroken?": yn(raw.get("is_housebroken")),
        "Crate": "--",
        "Gets along with Kids?": yn(raw.get("is_ok_with_other_kids")),
        "Gets along with Cats?": yn(raw.get("is_ok_with_other_cats")),
        "Gets along with Dogs?": yn(raw.get("is_ok_with_other_dogs")),
        "Known Medical": yn(raw.get("has_special_need")),
        "Fenced Yard": "--",
        "Another dog": "--",
        "Photo URL": get_primary_photo_url(raw),
    }
