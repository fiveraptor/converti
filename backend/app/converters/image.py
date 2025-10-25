"""Image conversion using Pillow."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, UnidentifiedImageError

from .base import ConversionError

SUPPORTED_FORMATS = {
    "png": "PNG",
    "jpeg": "JPEG",
    "jpg": "JPEG",
    "webp": "WEBP",
    "bmp": "BMP",
    "tiff": "TIFF",
}


class ImageConverter:
    """Convert raster images via Pillow."""

    category = "images"

    def can_handle(self, source: Path, target_format: str) -> bool:
        return target_format.lower() in SUPPORTED_FORMATS

    def convert(self, source: Path, target: Path, target_format: str) -> Path:
        desired_format = SUPPORTED_FORMATS[target_format.lower()]
        try:
            with Image.open(source) as img:
                if desired_format == "JPEG" and img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(target, desired_format)
        except UnidentifiedImageError as exc:
            raise ConversionError(f"Unsupported image file: {source.name}") from exc
        except OSError as exc:
            raise ConversionError(f"Image conversion failed: {exc}") from exc
        return target

