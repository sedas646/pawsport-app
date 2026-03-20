"""
PAWSPORT Poster Generator — enhanced from generate_pawsport.py
Theme-driven: reads theme JSON dict instead of hardcoded THEMES.
Supports two layouts: "classic" (centered photo) and "canva_style" (photo left, info right).
"""

import json
import math
import os
import urllib.request
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageFilter

try:
    import qrcode
except ImportError:
    qrcode = None

# Poster size — 4x6 inches at 300 DPI
W, H = 1200, 1800
MARGIN = 50

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS_DIR = os.path.join(BACKEND_DIR, "fonts")
TEXTURES_DIR = os.path.join(BACKEND_DIR, "textures")

# Map short font names to filenames in fonts/
FONT_FILES = {
    "Poppins-Bold": "Poppins-Bold.ttf",
    "Poppins-Regular": "Poppins-Regular.ttf",
    "Lora-Italic": "Lora-Italic.ttf",
    "Pacifico": "Pacifico-Regular.ttf",
    "DancingScript": "DancingScript-Bold.ttf",
    "Lato-Black": "Lato-Black.ttf",
}


def _font_path(font_name: str) -> str:
    """Resolve a font name to an absolute path in the fonts dir."""
    filename = FONT_FILES.get(font_name, font_name)
    if not filename.endswith((".ttf", ".otf")):
        filename += ".ttf"
    path = os.path.join(FONTS_DIR, filename)
    if os.path.exists(path):
        return path
    # Try direct match
    for f in os.listdir(FONTS_DIR) if os.path.isdir(FONTS_DIR) else []:
        if font_name.lower() in f.lower():
            return os.path.join(FONTS_DIR, f)
    return path  # return anyway, load_font will fall back to default


def load_font(font_name: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(_font_path(font_name), size)
    except Exception:
        try:
            return ImageFont.load_default(size)
        except TypeError:
            return ImageFont.load_default()


def text_width(draw, text, font):
    try:
        return draw.textlength(text, font=font)
    except Exception:
        return font.getbbox(text)[2]


def make_gradient(w, h, top_color, bottom_color):
    base = Image.new("RGBA", (w, h))
    draw = ImageDraw.Draw(base)
    for y in range(h):
        t = y / h
        r = int(top_color[0] + (bottom_color[0] - top_color[0]) * t)
        g = int(top_color[1] + (bottom_color[1] - top_color[1]) * t)
        b = int(top_color[2] + (bottom_color[2] - top_color[2]) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    return base


def rounded_rect_overlay(img, x, y, w, h, fill, radius=16):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=tuple(fill))
    img.alpha_composite(overlay)


def shadow_text(draw, pos, text, font, fill, offset=3,
                shadow=(0, 0, 0, 140), anchor="mm"):
    sx, sy = pos
    draw.text((sx + offset, sy + offset), text, font=font,
              fill=tuple(shadow), anchor=anchor)
    draw.text(pos, text, font=font, fill=tuple(fill), anchor=anchor)


def fetch_photo(url, size, crop_y_pct=30, mode="fill"):
    """Fetch a photo from URL and resize/crop to fit the given size.

    Args:
        url: Image URL to fetch.
        size: (width, height) of the target area.
        crop_y_pct: Vertical crop position 0–100 (only used in "fill" mode).
        mode: "fill" = zoom to fill the box, crop excess (default).
              "fit"  = show the entire photo inside the box, pad sides
                       with a blurred version of the photo as background.
    """
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        img = Image.open(BytesIO(data)).convert("RGBA")

        if mode == "fit":
            return _fit_photo(img, size)
        else:
            return _fill_photo(img, size, crop_y_pct)
    except Exception as e:
        print(f"    Could not load photo: {e}")
        return None


def _fill_photo(img, size, crop_y_pct=30):
    """Zoom image to fill the box, crop the excess using crop_y_pct."""
    img_ratio = img.width / img.height
    box_ratio = size[0] / size[1]
    if img_ratio > box_ratio:
        new_h = size[1]
        new_w = int(new_h * img_ratio)
    else:
        new_w = size[0]
        new_h = int(new_w / img_ratio)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - size[0]) // 2
    max_top = new_h - size[1]
    top = int(max_top * max(0, min(100, crop_y_pct)) / 100)
    return img.crop((left, top, left + size[0], top + size[1]))


def _fit_photo(img, size):
    """Fit entire image inside the box, fill empty space with a blurred
    version of the photo so there are no blank bars."""
    box_w, box_h = size

    # Create blurred background that fills the entire box
    bg = img.copy().resize((box_w, box_h), Image.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(radius=25))
    # Darken the blurred background slightly
    darken = Image.new("RGBA", (box_w, box_h), (0, 0, 0, 80))
    bg = Image.alpha_composite(bg, darken)

    # Scale the photo to fit inside the box (preserve aspect ratio)
    img_ratio = img.width / img.height
    box_ratio = box_w / box_h
    if img_ratio > box_ratio:
        # Image is wider — fit to width
        new_w = box_w
        new_h = int(box_w / img_ratio)
    else:
        # Image is taller — fit to height
        new_h = box_h
        new_w = int(box_h * img_ratio)
    scaled = img.resize((new_w, new_h), Image.LANCZOS)

    # Center the scaled photo on the blurred background
    paste_x = (box_w - new_w) // 2
    paste_y = (box_h - new_h) // 2
    bg.paste(scaled, (paste_x, paste_y), scaled)
    return bg


def make_placeholder(size):
    img = Image.new("RGBA", size, (70, 120, 190, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, size[1] * 2 // 3, size[0], size[1]], fill=(55, 105, 55, 255))
    font = load_font("Poppins-Regular", 30)
    draw.text((size[0] // 2, size[1] - 50), "No Photo Available",
              font=font, fill=(255, 255, 255, 150), anchor="mm")
    return img


def format_value(val):
    if not val or str(val).strip() in ("", "--", "N/A", "Not Sure"):
        return "--"
    v = str(val).strip()
    if v.upper() in ("YES", "Y", "TRUE", "1"):
        return "Yes"
    if v.upper() in ("NO", "N", "FALSE", "0"):
        return "No"
    return v


def draw_snowflake(draw, cx, cy, radius, color, spokes=6, width=2):
    for i in range(spokes):
        angle = math.pi * 2 * i / spokes
        ex = cx + radius * math.cos(angle)
        ey = cy + radius * math.sin(angle)
        draw.line([(cx, cy), (ex, ey)], fill=tuple(color), width=width)
        for branch in [0.4, 0.65]:
            bx = cx + radius * branch * math.cos(angle)
            by = cy + radius * branch * math.sin(angle)
            for side in [-1, 1]:
                ba = angle + side * math.pi / 4
                bl = radius * 0.22
                draw.line([(bx, by),
                           (bx + bl * math.cos(ba), by + bl * math.sin(ba))],
                          fill=tuple(color), width=width)
    cr = max(3, radius // 6)
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=tuple(color))


def draw_paw(draw, cx, cy, size, color):
    """Draw a simple paw print decoration."""
    r = size
    # Main pad
    draw.ellipse([cx - r, cy - r * 0.5, cx + r, cy + r * 1.2], fill=tuple(color))
    # Toes
    for dx, dy in [(-r * 0.7, -r * 0.9), (-r * 0.2, -r * 1.3),
                   (r * 0.2, -r * 1.3), (r * 0.7, -r * 0.9)]:
        tr = r * 0.4
        draw.ellipse([cx + dx - tr, cy + dy - tr, cx + dx + tr, cy + dy + tr],
                     fill=tuple(color))


def draw_flower(draw, cx, cy, radius, color):
    """Draw a simple flower decoration."""
    for i in range(5):
        angle = math.pi * 2 * i / 5
        px = cx + radius * 0.6 * math.cos(angle)
        py = cy + radius * 0.6 * math.sin(angle)
        pr = radius * 0.45
        draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=tuple(color))
    draw.ellipse([cx - radius * 0.3, cy - radius * 0.3,
                  cx + radius * 0.3, cy + radius * 0.3],
                 fill=(255, 255, 100, 200))


def draw_leaf(draw, cx, cy, size, color):
    """Draw a simple leaf decoration."""
    points = [
        (cx, cy - size),
        (cx + size * 0.5, cy),
        (cx, cy + size * 0.3),
        (cx - size * 0.5, cy),
    ]
    draw.polygon(points, fill=tuple(color))
    # Stem / center vein
    vein_w = max(2, size // 12)
    draw.line([(cx, cy - size), (cx, cy + size * 0.3)],
              fill=(0, 0, 0, 80), width=vein_w)
    # Side veins
    for frac in [0.3, 0.6]:
        vy = cy - size + size * 1.3 * frac
        half = size * 0.3 * (1 - frac * 0.5)
        draw.line([(cx, vy), (cx + half, vy + half * 0.4)],
                  fill=(0, 0, 0, 50), width=max(1, vein_w - 1))
        draw.line([(cx, vy), (cx - half, vy + half * 0.4)],
                  fill=(0, 0, 0, 50), width=max(1, vein_w - 1))


def draw_decorations(draw, theme, w, h):
    """Draw seasonal decorations based on theme.

    Places decorations around the edges of the poster (top strip, bottom strip,
    left/right margins) at visible sizes so they actually show up on the
    1200x1800 canvas.
    """
    deco_type = theme.get("decorations", "none")
    accent = tuple(theme.get("accent_color", [200, 200, 200]))

    if deco_type == "none":
        return

    import random
    random.seed(42)  # consistent positions

    # Top strip — scattered across the header area
    positions = [(random.randint(30, w - 30), random.randint(10, 155)) for _ in range(10)]
    # Bottom strip — above footer
    positions += [(random.randint(30, w - 30), random.randint(h - 200, h - 80)) for _ in range(8)]
    # Left edge
    positions += [(random.randint(10, 80), random.randint(200, h - 250)) for _ in range(5)]
    # Right edge
    positions += [(random.randint(w - 80, w - 10), random.randint(200, h - 250)) for _ in range(5)]

    for cx, cy in positions:
        alpha = random.randint(130, 220)
        c = (*accent[:3], alpha)
        s = random.randint(28, 55)

        if deco_type == "snowflakes":
            draw_snowflake(draw, cx, cy, s, c, width=2)
        elif deco_type == "paws":
            draw_paw(draw, cx, cy, s, c)
        elif deco_type == "flowers":
            draw_flower(draw, cx, cy, s, c)
        elif deco_type == "leaves":
            draw_leaf(draw, cx, cy, s, c)


def glowing_border(img, x, y, w, h, color, radius=22):
    draw = ImageDraw.Draw(img)
    c = tuple(color[:3])
    for offset, alpha in [(18, 25), (13, 55), (8, 95), (4, 150)]:
        draw.rounded_rectangle(
            [x - offset, y - offset, x + w + offset, y + h + offset],
            radius=radius + offset // 2,
            outline=(*c, alpha), width=2)
    draw.rounded_rectangle(
        [x - 4, y - 4, x + w + 4, y + h + 4],
        radius=radius, outline=(*c, 230), width=4)


def make_qr(text: str, size: int = 180) -> Image.Image | None:
    if qrcode is None:
        return None
    qr = qrcode.QRCode(version=1, box_size=10, border=1,
                        error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    return img.resize((size, size), Image.LANCZOS)


def _make_background(theme: dict) -> Image.Image:
    """Create background image from theme definition."""
    bg_def = theme.get("background", {})
    bg_type = bg_def.get("type", "gradient")

    if bg_type == "texture":
        tex_file = theme.get("background_texture")
        if tex_file:
            tex_path = os.path.join(TEXTURES_DIR, tex_file)
            if os.path.exists(tex_path):
                tex = Image.open(tex_path).convert("RGBA").resize((W, H), Image.LANCZOS)
                return tex

    if bg_type == "solid":
        color = tuple(bg_def.get("color", [128, 128, 128]))
        return Image.new("RGBA", (W, H), (*color, 255))

    # Default: gradient
    top = tuple(bg_def.get("top", [50, 50, 50]))
    bottom = tuple(bg_def.get("bottom", [100, 100, 100]))
    return make_gradient(W, H, top, bottom)


def _get_fields(pet: dict) -> tuple[list, list]:
    """Extract left and right info fields from pet data."""
    fields_left = [
        ("Foster", format_value(pet.get("Current Foster/Adopter", "--"))),
        ("Age", format_value(pet.get("Age in Years", "--"))),
        ("Weight", format_value(pet.get("Weight", "--"))),
        ("Sex", format_value(pet.get("Gender", "--"))),
        ("Breed", format_value(pet.get("Pet Breed", "--"))),
    ]
    fields_right = [
        ("House Trained", format_value(pet.get("Housebroken?", "--"))),
        ("Kids", format_value(pet.get("Gets along with Kids?", "--"))),
        ("Cats", format_value(pet.get("Gets along with Cats?", "--"))),
        ("Dogs", format_value(pet.get("Gets along with Dogs?", "--"))),
        ("Medical", format_value(pet.get("Known Medical", "--"))),
    ]
    return fields_left, fields_right


# ─── CLASSIC LAYOUT ─────────────────────────────────────────────────────────

def generate_classic(pet: dict, output_path: str, theme: dict):
    """Classic layout: large centered photo, info grid below."""
    accent = tuple(theme.get("accent_color", [150, 200, 255]))
    border_color = tuple(theme.get("border_color", [180, 220, 255]))
    title_color = tuple(theme.get("title_color", [255, 255, 255]))
    label_color = tuple(theme.get("label_color", [180, 215, 255]))
    value_color = tuple(theme.get("value_color", [255, 255, 255]))
    header_bg = tuple(theme.get("header_bg", [4, 12, 45, 215]))
    footer_bg = tuple(theme.get("footer_bg", [10, 25, 70, 220]))
    footer_text = tuple(theme.get("footer_text_color", [255, 255, 255]))

    title_font_name = theme.get("title_font", "Lato-Black")
    title_size = theme.get("title_size", 118)
    label_font_name = theme.get("label_font", "Poppins-Bold")
    value_font_name = theme.get("value_font", "Poppins-Regular")
    name_font_name = theme.get("name_font", "Lora-Italic")
    name_color = tuple(theme.get("name_color", [255, 255, 255]))

    # Background
    img = _make_background(theme)

    # Header band
    header_h = 165
    rounded_rect_overlay(img, 0, 0, W, header_h, header_bg, radius=0)
    draw = ImageDraw.Draw(img)

    # Decorations in header
    draw_decorations(draw, theme, W, H)
    draw.line([(0, header_h), (W, header_h)], fill=(*accent[:3], 80), width=3)

    # PAWSPORT title
    font_title = load_font(title_font_name, title_size)
    shadow_text(draw, (W // 2, header_h // 2 + 5), "PAWSPORT",
                font=font_title, fill=title_color,
                offset=5, shadow=(0, 0, 0, 160), anchor="mm")

    # Photo
    photo_x = MARGIN
    photo_y = header_h + 28
    photo_w = W - 2 * MARGIN
    photo_h = 850

    photo_url = pet.get("Photo URL", "").strip()
    crop_y = pet.get("photo_crop_y", 30)
    photo_mode = pet.get("photo_mode", "fill")
    photo_img = fetch_photo(photo_url, (photo_w, photo_h), crop_y, photo_mode) if photo_url else None
    if photo_img is None:
        photo_img = make_placeholder((photo_w, photo_h))

    mask = Image.new("L", (photo_w, photo_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, photo_w, photo_h], radius=22, fill=255)
    photo_rgba = photo_img.convert("RGBA")
    photo_rgba.putalpha(mask)
    img.paste(photo_rgba, (photo_x, photo_y), photo_rgba)
    glowing_border(img, photo_x, photo_y, photo_w, photo_h, border_color)
    draw = ImageDraw.Draw(img)

    # Dog name
    name = pet.get("Pet Name", "Unknown").strip().title()
    name_y = photo_y + photo_h + 55
    name_sz = 78
    font_name = load_font(name_font_name, name_sz)
    while name_sz > 28:
        nw = text_width(draw, name, font_name)
        if nw <= photo_w - 180:
            break
        name_sz -= 3
        font_name = load_font(name_font_name, name_sz)

    shadow_text(draw, (W // 2, name_y), name, font=font_name,
                fill=name_color, offset=3, shadow=(0, 0, 0, 130), anchor="mm")

    # Divider
    div_y = name_y + name_sz // 2 + 22
    draw.line([(MARGIN, div_y), (W - MARGIN, div_y)],
              fill=(*accent[:3], 55), width=1)

    # Info grid — sized for print readability on 4×6 photo (300 DPI)
    # 36px ≈ 8.6pt, 34px ≈ 8.2pt — comfortable minimum for print
    LBL_SIZE = 36
    VAL_SIZE = 34
    LINE_GAP = 6  # gap between wrapped lines
    font_lbl = load_font(label_font_name, LBL_SIZE)
    font_val = load_font(value_font_name, VAL_SIZE)

    col_gap = 40
    col_w = (W - 2 * MARGIN - col_gap) // 2
    col1_x = MARGIN
    col2_x = MARGIN + col_w + col_gap

    fields_left, fields_right = _get_fields(pet)

    def wrap_text(text, font, max_w):
        """Word-wrap text into lines that fit within max_w pixels."""
        words = text.split()
        if not words:
            return [text]
        lines = []
        current = words[0]
        for word in words[1:]:
            test = current + " " + word
            if text_width(draw, test, font) <= max_w:
                current = test
            else:
                lines.append(current)
                current = word
        lines.append(current)
        return lines

    def measure_field_height(label, value):
        """Return how many pixels tall this field needs (label line + wrapped value lines)."""
        lbl_str = f"{label}:"
        lw = int(text_width(draw, lbl_str, font_lbl))
        max_val = col_w - lw - 16
        lines = wrap_text(value, font_val, max_val)
        line_h = VAL_SIZE + LINE_GAP
        return max(LBL_SIZE + LINE_GAP, len(lines) * line_h) + 12  # 12px row padding

    # Calculate total height needed and available space
    footer_y = H - 108
    info_y_start = div_y + 28
    available_h = footer_y - info_y_start - 20  # 20px bottom breathing room

    # Measure each row's natural height
    row_heights_left = [measure_field_height(l, v) for l, v in fields_left]
    row_heights_right = [measure_field_height(l, v) for l, v in fields_right]
    # Each row is the max of left and right column
    row_heights = [max(row_heights_left[i], row_heights_right[i])
                   for i in range(len(fields_left))]
    total_h = sum(row_heights)

    # If it fits, use natural heights; otherwise scale row padding down
    if total_h > available_h:
        scale = available_h / total_h
        row_heights = [int(rh * scale) for rh in row_heights]

    def draw_field(x, y, label, value):
        lbl_str = f"{label}:"
        lw = int(text_width(draw, lbl_str, font_lbl))
        draw.text((x, y), lbl_str, font=font_lbl, fill=label_color, anchor="lt")
        val_x = x + lw + 12
        max_val = col_w - lw - 16
        lines = wrap_text(value, font_val, max_val)
        for li, line in enumerate(lines):
            ly = y + li * (VAL_SIZE + LINE_GAP)
            draw.text((val_x, ly), line, font=font_val, fill=value_color, anchor="lt")

    info_y = info_y_start
    for i, (lbl, val) in enumerate(fields_left):
        draw_field(col1_x, info_y, lbl, val)
        right_lbl, right_val = fields_right[i]
        draw_field(col2_x, info_y, right_lbl, right_val)
        info_y += row_heights[i]

    mid_x = MARGIN + col_w + col_gap // 2
    draw.line([(mid_x, info_y_start + 4), (mid_x, info_y - 4)],
              fill=(*accent[:3], 40), width=1)

    # Footer
    footer_h = 72
    footer_w = 490
    footer_x = (W - footer_w) // 2
    footer_y = H - 108
    rounded_rect_overlay(img, footer_x, footer_y, footer_w, footer_h, footer_bg, radius=15)
    draw = ImageDraw.Draw(img)
    font_footer = load_font(label_font_name, 42)
    draw.text((W // 2, footer_y + footer_h // 2), "ReachRescue.org",
              font=font_footer, fill=footer_text, anchor="mm")

    # Save
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    img.convert("RGB").save(output_path, "JPEG", quality=95)
    return output_path


# ─── CANVA-STYLE LAYOUT ─────────────────────────────────────────────────────

def _make_concrete_texture(w, h, base_color=(178, 172, 166)):
    """Generate a concrete/stucco texture background like the Canva original."""
    import random as _rng
    _rng.seed(12345)
    img = Image.new("RGBA", (w, h), (*base_color, 255))
    draw = ImageDraw.Draw(img)

    # Layer 1: broad noise patches
    for _ in range(8000):
        x = _rng.randint(0, w - 1)
        y = _rng.randint(0, h - 1)
        offset = _rng.randint(-18, 18)
        c = tuple(max(0, min(255, base_color[i] + offset)) for i in range(3))
        sz = _rng.randint(2, 6)
        draw.ellipse([x, y, x + sz, y + sz], fill=(*c, 255))

    # Layer 2: fine grain
    for _ in range(15000):
        x = _rng.randint(0, w - 1)
        y = _rng.randint(0, h - 1)
        offset = _rng.randint(-10, 10)
        c = tuple(max(0, min(255, base_color[i] + offset)) for i in range(3))
        img.putpixel((x, y), (*c, 255))

    # Subtle vignette — darken edges
    for y_pos in range(h):
        for edge_x in range(30):
            alpha = int(25 * (1 - edge_x / 30))
            draw.point((edge_x, y_pos), fill=(0, 0, 0, alpha))
            draw.point((w - 1 - edge_x, y_pos), fill=(0, 0, 0, alpha))

    return img


def _draw_outlined_text(draw, pos, text, font, fill_color, outline_color,
                        outline_width=3, anchor="mm"):
    """Draw text with an outline/stroke effect like the Canva title."""
    x, y = pos
    # Draw outline by offsetting in all directions
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx * dx + dy * dy <= outline_width * outline_width:
                draw.text((x + dx, y + dy), text, font=font,
                          fill=outline_color, anchor=anchor)
    # Draw main fill on top
    draw.text(pos, text, font=font, fill=fill_color, anchor=anchor)


def _draw_dog_silhouette(draw, cx, cy, size, color, flip=False):
    """Draw a simple sitting dog silhouette for the footer."""
    s = size
    # Body (oval)
    bx = cx - s * 0.3 if not flip else cx + s * 0.3
    draw.ellipse([bx - s * 0.5, cy - s * 0.6, bx + s * 0.5, cy + s * 0.4],
                 fill=color)
    # Head (circle)
    hx = cx + s * 0.15 if not flip else cx - s * 0.15
    draw.ellipse([hx - s * 0.35, cy - s * 1.1, hx + s * 0.35, cy - s * 0.4],
                 fill=color)
    # Ears
    ear_x = hx - s * 0.25 if not flip else hx + s * 0.25
    draw.ellipse([ear_x - s * 0.15, cy - s * 1.35, ear_x + s * 0.15, cy - s * 0.95],
                 fill=color)
    ear_x2 = hx + s * 0.25 if not flip else hx - s * 0.25
    draw.ellipse([ear_x2 - s * 0.15, cy - s * 1.35, ear_x2 + s * 0.15, cy - s * 0.95],
                 fill=color)
    # Snout
    sx = hx + s * 0.3 if not flip else hx - s * 0.3
    draw.ellipse([sx - s * 0.15, cy - s * 0.75, sx + s * 0.15, cy - s * 0.55],
                 fill=color)


def generate_canva_style(pet: dict, output_path: str, theme: dict):
    """Canva-style layout matching the original Canva poster design."""
    title_color = tuple(theme.get("title_color", [199, 131, 160]))
    label_color = tuple(theme.get("label_color", [60, 60, 60]))
    value_color = tuple(theme.get("value_color", [40, 40, 40]))
    footer_bg = tuple(theme.get("footer_bg", [140, 60, 90, 255]))
    footer_text = tuple(theme.get("footer_text_color", [255, 255, 255]))
    name_color = tuple(theme.get("name_color", [30, 30, 30]))

    title_font_name = theme.get("title_font", "Pacifico")
    title_size = theme.get("title_size", 120)
    label_font_name = theme.get("label_font", "Poppins-Bold")
    value_font_name = theme.get("value_font", "Poppins-Regular")
    name_font_name = theme.get("name_font", "Poppins-Bold")

    # Background — concrete texture or from theme
    bg_def = theme.get("background", {})
    if bg_def.get("type") == "texture" and theme.get("background_texture"):
        img = _make_background(theme)
    elif bg_def.get("type") == "solid" and bg_def.get("color"):
        img = _make_concrete_texture(W, H, tuple(bg_def["color"][:3]))
    else:
        img = _make_concrete_texture(W, H)
    draw = ImageDraw.Draw(img)

    # ── TITLE "Pawsport" with outline stroke ──
    font_title = load_font(title_font_name, title_size)
    title_y = 78
    title_outline = tuple(c // 3 for c in title_color[:3])  # dark version of title color
    _draw_outlined_text(draw, (W // 2, title_y), "Pawsport",
                        font=font_title,
                        fill_color=(*title_color[:3], 255),
                        outline_color=(*title_outline, 200),
                        outline_width=4, anchor="mm")

    # ── PHOTO — left side, taller to match Canva proportions ──
    photo_x = 40
    photo_y = 155
    photo_w = 500
    photo_h = 660

    photo_url = pet.get("Photo URL", "").strip()
    crop_y = pet.get("photo_crop_y", 30)
    photo_mode = pet.get("photo_mode", "fill")
    photo_img = fetch_photo(photo_url, (photo_w, photo_h), crop_y, photo_mode) if photo_url else None
    if photo_img is None:
        photo_img = make_placeholder((photo_w, photo_h))

    # Simple rectangular paste with thin border
    draw.rectangle([photo_x - 3, photo_y - 3, photo_x + photo_w + 3, photo_y + photo_h + 3],
                   outline=(255, 255, 255, 180), width=3)
    photo_rgba = photo_img.convert("RGBA")
    img.paste(photo_rgba, (photo_x, photo_y), photo_rgba)
    draw = ImageDraw.Draw(img)

    # ── DOG NAME below photo — bold, left-aligned ──
    name = pet.get("Pet Name", "Unknown").strip().title()
    name_y = photo_y + photo_h + 18
    name_sz = 56
    font_name = load_font(name_font_name, name_sz)
    while name_sz > 26:
        nw = text_width(draw, name, font_name)
        if nw <= photo_w + 10:
            break
        name_sz -= 2
        font_name = load_font(name_font_name, name_sz)

    draw.text((photo_x, name_y), name, font=font_name, fill=name_color)

    # ── QR CODE below name ──
    qr_y = name_y + name_sz + 18
    pet_name_slug = "".join(c if c.isalnum() else "-" for c in name.lower())
    qr_img = make_qr(f"https://reachrescue.org/dogs/{pet_name_slug}", size=160)
    if qr_img:
        img.paste(qr_img, (photo_x, qr_y), qr_img)
        draw = ImageDraw.Draw(img)
        # Name label under QR
        qr_label_font = load_font(value_font_name, 20)
        draw.text((photo_x + 80, qr_y + 168), name,
                  font=qr_label_font, fill=label_color, anchor="mm")

    # ── INFO FIELDS — right side with bullet points ──
    info_x = photo_x + photo_w + 20
    info_y = photo_y - 5
    info_w = W - info_x - 30

    FIELD_SIZE = 32
    font_lbl = load_font(label_font_name, FIELD_SIZE)
    font_val = load_font(value_font_name, FIELD_SIZE)
    font_val_sm = load_font(value_font_name, FIELD_SIZE - 5)

    all_fields = [
        ("Foster:", format_value(pet.get("Current Foster/Adopter", "--"))),
        ("Age:", format_value(pet.get("Age in Years", "--"))),
        ("Weight:", format_value(pet.get("Weight", "--"))),
        ("Sex:", format_value(pet.get("Gender", "--"))),
        ("Breed:", format_value(pet.get("Pet Breed", "--"))),
        ("House Trained-", format_value(pet.get("Housebroken?", "--"))),
        ("Crate Trained-", format_value(pet.get("Crate", "--"))),
        ("Kids -", format_value(pet.get("Gets along with Kids?", "--"))),
        ("Good w cats -", format_value(pet.get("Gets along with Cats?", "--"))),
        ("Good w dogs-", format_value(pet.get("Gets along with Dogs?", "--"))),
        ("Known Medical-", format_value(pet.get("Known Medical", "--"))),
        ("Fenced Yard-", format_value(pet.get("Fenced Yard", "--"))),
        ("Another dog -", format_value(pet.get("Another dog", "--"))),
    ]

    # Calculate row height to fill available space (from info_y to just above footer)
    footer_h = 90
    available_h = (H - footer_h - 20) - info_y
    row_h = available_h // len(all_fields)
    row_h = min(row_h, 56)  # cap so it doesn't get too spread out

    for i, (label, value) in enumerate(all_fields):
        y = info_y + i * row_h
        # Bullet — filled circle
        bullet_r = 6
        bullet_cy = y + FIELD_SIZE // 2
        draw.ellipse([info_x, bullet_cy - bullet_r,
                      info_x + bullet_r * 2, bullet_cy + bullet_r],
                     fill=label_color)
        # Label (bold)
        lbl_x = info_x + 20
        lw = int(text_width(draw, label, font_lbl))
        draw.text((lbl_x, y), label, font=font_lbl, fill=label_color)
        # Value — right after label with a space
        val_x = lbl_x + lw + 8
        val_str = value
        remaining_w = info_w - (val_x - info_x) - 5
        vw = text_width(draw, val_str, font_val)
        if vw > remaining_w:
            # Try smaller font, or wrap to next line
            fv = font_val_sm
            draw.text((val_x, y + 2), val_str, font=fv, fill=value_color)
        else:
            draw.text((val_x, y), val_str, font=font_val, fill=value_color)

    # ── FOOTER — dark pink bar with dog silhouettes ──
    footer_y = H - footer_h
    rounded_rect_overlay(img, 0, footer_y, W, footer_h, footer_bg, radius=0)
    draw = ImageDraw.Draw(img)

    font_footer = load_font(label_font_name, 50)
    draw.text((W // 2, footer_y + footer_h // 2), "ReachRescue.org",
              font=font_footer, fill=footer_text, anchor="mm")

    # Dog silhouettes flanking footer text (like Canva)
    fw = text_width(draw, "ReachRescue.org", font_footer)
    _draw_dog_silhouette(draw, int(W // 2 - fw // 2 - 65),
                         footer_y + footer_h // 2 + 8, 22, footer_text)
    _draw_dog_silhouette(draw, int(W // 2 + fw // 2 + 65),
                         footer_y + footer_h // 2 + 8, 22, footer_text, flip=True)

    # Paw prints as subtle accents
    draw_paw(draw, int(W // 2 - fw // 2 - 110), footer_y + footer_h // 2, 12,
             (*footer_text[:3], 140))
    draw_paw(draw, int(W // 2 + fw // 2 + 110), footer_y + footer_h // 2, 12,
             (*footer_text[:3], 140))

    # Save
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    img.convert("RGB").save(output_path, "JPEG", quality=95)
    return output_path


# ─── PUBLIC API ──────────────────────────────────────────────────────────────

def generate_poster(pet: dict, output_path: str, theme: dict) -> str:
    """Generate a poster using the layout specified in the theme."""
    layout = theme.get("layout", "classic")
    if layout == "canva_style":
        return generate_canva_style(pet, output_path, theme)
    else:
        return generate_classic(pet, output_path, theme)
