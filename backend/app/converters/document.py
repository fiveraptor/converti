"""Document conversion using pandoc when available."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from .base import ConversionError

SUPPORTED_FORMATS = {"md", "html", "txt", "docx", "odt", "rtf", "pdf"}


class DocumentConverter:
    """Convert documents via pandoc."""

    category = "documents"

    def __init__(self) -> None:
        self._pandoc = shutil.which("pandoc")
        self._pdf_engine = shutil.which("tectonic")

    def can_handle(self, source: Path, target_format: str) -> bool:
        return self._pandoc is not None and target_format.lower() in SUPPORTED_FORMATS

    def convert(self, source: Path, target: Path, target_format: str) -> Path:
        if self._pandoc is None:
            raise ConversionError("pandoc binary not found in PATH")

        command = [self._pandoc, str(source), "-o", str(target)]

        if target_format.lower() == "pdf":
            if self._pdf_engine is None:
                raise ConversionError("PDF engine not found; install tectonic or texlive")
            command.extend(["--pdf-engine", "tectonic"])

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
