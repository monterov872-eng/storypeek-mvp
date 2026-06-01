"""Generate SilentView Android launcher and adaptive icons from assets/app_icon.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "app_icon.png"
RES = ROOT / "android" / "app" / "src" / "main" / "res"

LEGACY_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

ADAPTIVE_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

BG_RGB = (6, 6, 10)
# Fill the adaptive canvas; launcher masks add their own outer inset.
FILL_RATIO = 1.0
# Shrink content square toward center to drop outer black padding.
CROP_SHRINK = 0.84
CONTENT_THRESHOLD = 12
BLACK_ALPHA_THRESHOLD = 20


def is_content_pixel(r: int, g: int, b: int) -> bool:
    if max(r, g, b) >= CONTENT_THRESHOLD:
        return True
    # Keep faint purple glow when trimming bbox.
    return b >= 20 and b >= r


def is_foreground_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return False
    if max(r, g, b) >= BLACK_ALPHA_THRESHOLD:
        return True
    return b >= 18 and b >= r


def content_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    px = img.convert("RGBA").load()
    w, h = img.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_content_pixel(r, g, b):
                found = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if not found:
        return (0, 0, w, h)
    return (min_x, min_y, max_x + 1, max_y + 1)


def crop_square(img: Image.Image, shrink: float = CROP_SHRINK) -> Image.Image:
    left, top, right, bottom = content_bbox(img)
    side = max(right - left, bottom - top)
    cx = (left + right) // 2
    cy = (top + bottom) // 2
    side = max(1, int(side * shrink))
    half = side // 2
    left = max(0, cx - half)
    top = max(0, cy - half)
    right = min(img.width, left + side)
    bottom = min(img.height, top + side)
    side = min(right - left, bottom - top)
    cropped = img.crop((left, top, left + side, top + side))
    # Second pass removes corner black left inside the first square crop.
    return crop_square_once(cropped, shrink=1.0)


def crop_square_once(img: Image.Image, shrink: float = 1.0) -> Image.Image:
    left, top, right, bottom = content_bbox(img)
    side = max(right - left, bottom - top)
    cx = (left + right) // 2
    cy = (top + bottom) // 2
    side = max(1, int(side * shrink))
    half = side // 2
    left = max(0, cx - half)
    top = max(0, cy - half)
    side = min(side, img.width - left, img.height - top)
    return img.crop((left, top, left + side, top + side))


def make_transparent_foreground(content: Image.Image) -> Image.Image:
    rgba = content.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_foreground_pixel(r, g, b, a):
                continue
            px[x, y] = (r, g, b, 0)
    return rgba


def render_foreground(content: Image.Image, size: int) -> Image.Image:
    target = max(1, int(size * FILL_RATIO))
    scaled = content.resize((target, target), Image.Resampling.LANCZOS)
    scaled = make_transparent_foreground(scaled)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = (size - target) // 2
    canvas.paste(scaled, (offset, offset), scaled)
    return canvas


def render_legacy(content: Image.Image, size: int) -> Image.Image:
    fg = render_foreground(content, size)
    base = Image.new("RGBA", (size, size), (*BG_RGB, 255))
    base.alpha_composite(fg)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    radius = int(size * 0.24)
    draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rounded.paste(base, (0, 0), mask)
    return rounded


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source icon: {SRC}")

    source = Image.open(SRC).convert("RGBA")
    content = crop_square(source)

    for folder, size in ADAPTIVE_SIZES.items():
        fg = render_foreground(content, size)
        save_png(fg, RES / folder / "ic_launcher_foreground.png")

    for folder, size in LEGACY_SIZES.items():
        legacy = render_legacy(content, size)
        save_png(legacy, RES / folder / "ic_launcher.png")

    print("Generated adaptive foreground + legacy launcher icons.")


if __name__ == "__main__":
    main()
