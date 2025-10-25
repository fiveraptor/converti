"""Base converter interface."""

from __future__ import annotations

from pathlib import Path
from typing import Protocol


class ConversionError(RuntimeError):
    """Raised when a specific conversion fails."""


class Converter(Protocol):
    """Protocol every converter implementation must follow."""

    category: str

    def can_handle(self, source: Path, target_format: str) -> bool:
        ...

    def convert(self, source: Path, target: Path, target_format: str) -> Path:
        ...

