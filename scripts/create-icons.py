from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
PUBLIC.mkdir(exist_ok=True)

FONT_PATH = r"C:\Windows\Fonts\arialbd.ttf"

for size, filename in [(192, "icon-192.png"), (512, "icon-512.png")]:
    image = Image.new("RGB", (size, size), "#f5f3ff")
    draw = ImageDraw.Draw(image)

    margin = int(size * 0.08)
    radius = int(size * 0.22)

    draw.rounded_rectangle(
        (margin, margin, size - margin, size - margin),
        radius=radius,
        fill="#7c3aed",
    )

    center = size // 2
    circle_radius = int(size * 0.31)

    draw.ellipse(
        (
            center - circle_radius,
            center - circle_radius,
            center + circle_radius,
            center + circle_radius,
        ),
        fill="#8b5cf6",
    )

    font_size = int(size * 0.57)
    font = ImageFont.truetype(FONT_PATH, font_size)

    bbox = draw.textbbox((0, 0), "B", font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (size - text_width) / 2 - bbox[0]
    y = (size - text_height) / 2 - bbox[1] - int(size * 0.015)

    draw.text(
        (x, y),
        "B",
        font=font,
        fill="#ffffff",
    )

    image.save(
        PUBLIC / filename,
        "PNG",
        optimize=True,
    )

    print("Created:", PUBLIC / filename)