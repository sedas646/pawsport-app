"""
Email service — extracted from run_pipeline.py
Sends poster ZIP via Gmail SMTP.
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders


def send_email(zip_path: str, gmail_user: str, app_password: str,
               recipient: str, date_str: str, pet_count: int) -> dict:
    """Send poster ZIP via Gmail. Returns status dict."""
    if not app_password or app_password == "REPLACE_WITH_APP_PASSWORD":
        return {"success": False, "error": "Gmail app password not configured"}

    subject = f"PAWSPORT Posters — {date_str} ({pet_count} dogs)"
    body = (
        f"Hi Seda,\n\n"
        f"This week's PAWSPORT posters are ready — {pet_count} fostered dogs.\n"
        f"Generated: {date_str}\n\n"
        f"Posters are 4x6 @ 300 DPI, print-ready!\n\n"
        f"ReachRescue.org\n"
    )

    msg = MIMEMultipart()
    msg["From"] = gmail_user
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    with open(zip_path, "rb") as f:
        part = MIMEBase("application", "zip")
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header("Content-Disposition",
                    f'attachment; filename="{os.path.basename(zip_path)}"')
    msg.attach(part)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_user, app_password)
            server.sendmail(gmail_user, recipient, msg.as_string())
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
