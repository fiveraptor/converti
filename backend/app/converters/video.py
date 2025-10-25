"""Video conversion powered by ffmpeg."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from .base import ConversionError

SUPPORTED_FORMATS = {"mp4", "mkv", "webm", "avi", "mov"}


class VideoConverter:
    """Convert video files via ffmpeg."""

    category = "video"

    def __init__(self) -> None:
        self._ffmpeg = shutil.which("ffmpeg")

    def can_handle(self, source: Path, target_format: str) -> bool:
        return self._ffmpeg is not None and target_format.lower() in SUPPORTED_FORMATS

    def convert(self, source: Path, target: Path, target_format: str) -> Path:
        if self._ffmpeg is None:
            raise ConversionError("ffmpeg binary not found in PATH")

        command = [
            self._ffmpeg,
            "-y",
            "-i",
            str(source),
            str(target),
        ]
        try:
            subprocess.run(
                command,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
        except subprocess.CalledProcessError as exc:
            raise ConversionError(exc.stderr.decode("utf-8", errors="ignore")) from exc
        return target

