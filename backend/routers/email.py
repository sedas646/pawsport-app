"""Email router — send poster ZIP via Gmail."""

import os
import datetime
from fastapi import APIRouter, HTTPException
from ..config import get_config
from ..services.email_service import send_email

router = APIRouter(prefix="/api/email", tags=["email"])

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BACKEND_DIR, "output")


@router.post("/send")
def send_posters_email(body: dict = {}):
    """Send the latest poster ZIP via email."""
    cfg = get_config()

    # Find the most recent zip
    zip_file = body.get("zip_filename")
    if zip_file:
        zip_path = os.path.join(OUTPUT_DIR, zip_file)
    else:
        zips = [f for f in os.listdir(OUTPUT_DIR) if f.endswith(".zip")]
        if not zips:
            raise HTTPException(404, "No poster ZIP files found. Generate posters first.")
        zips.sort(reverse=True)
        zip_path = os.path.join(OUTPUT_DIR, zips[0])

    if not os.path.exists(zip_path):
        raise HTTPException(404, f"ZIP not found: {zip_path}")

    date_str = datetime.date.today().strftime("%Y-%m-%d")
    # Count JPEGs in the zip to get pet count
    import zipfile
    with zipfile.ZipFile(zip_path) as zf:
        pet_count = len([n for n in zf.namelist() if n.endswith(".jpg")])

    actual_recipient = body.get("recipient") or cfg["email_recipient"]

    result = send_email(
        zip_path=zip_path,
        gmail_user=cfg["gmail_user"],
        app_password=cfg["gmail_app_password"],
        recipient=actual_recipient,
        date_str=date_str,
        pet_count=pet_count,
    )

    if result["success"]:
        return {"message": "Email sent successfully", "recipient": actual_recipient}
    else:
        raise HTTPException(500, f"Email failed: {result['error']}")
