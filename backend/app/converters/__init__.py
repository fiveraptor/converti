"""Converter registry."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from .audio import SUPPORTED_FORMATS as AUDIO_FORMATS
from .audio import AudioConverter
from .base import ConversionError, Converter
from .image import SUPPORTED_FORMATS as IMAGE_FORMATS
from .image import ImageConverter
from .video import SUPPORTED_FORMATS as VIDEO_FORMATS
from .video import VideoConverter

_CONVERTERS: dict[str, Converter] = {
    "images": ImageConverter(),
    "audio": AudioConverter(),
    "video": VideoConverter(),
}

SUPPORTED_TARGETS: dict[str, list[str]] = {
    "images": sorted(IMAGE_FORMATS),
    "audio": sorted(AUDIO_FORMATS),
    "video": sorted(VIDEO_FORMATS),
}


def available_categories() -> Iterable[str]:
    return _CONVERTERS.keys()


def get_converter(category: str) -> Converter:
    try:
        return _CONVERTERS[category]
    except KeyError as exc:
        raise ConversionError(f"Unsupported category '{category}'") from exc


def list_targets(category: str) -> list[str]:
    if category not in SUPPORTED_TARGETS:
        raise ConversionError(f"Unsupported category '{category}'")
    return SUPPORTED_TARGETS[category]


def convert_file(category: str, source: Path, target: Path, target_format: str) -> Path:
    converter = get_converter(category)
    if not converter.can_handle(source, target_format):
        raise ConversionError(
            f"Conversion from {source.suffix} to {target_format} not supported",
        )
    return converter.convert(source, target, target_format)
