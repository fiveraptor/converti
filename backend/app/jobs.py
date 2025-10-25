"""In-memory job tracking for conversion tasks."""

from __future__ import annotations

import threading
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any


class JobStatus(str, Enum):
    """Lifecycle state of a conversion job."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class JobFileResult:
    """Represents the outcome of converting a single file."""

    source_name: str
    source_path: Path
    output_name: str
    output_path: Path
    status: JobStatus = JobStatus.PENDING
    error: str | None = None


@dataclass
class ConversionJob:
    """Data model for a conversion job."""

    job_id: str
    category: str
    target_format: str
    total_files: int
    created_at: float = field(default_factory=time.time)
    status: JobStatus = JobStatus.PENDING
    processed_files: int = 0
    results: list[JobFileResult] = field(default_factory=list)
    error: str | None = None

    @property
    def progress(self) -> float:
        if self.total_files == 0:
            return 0.0
        return min(1.0, self.processed_files / self.total_files)


class JobManager:
    """Thread-safe job registry."""

    def __init__(self) -> None:
        self._jobs: dict[str, ConversionJob] = {}
        self._lock = threading.RLock()

    def create_job(
        self,
        *,
        category: str,
        target_format: str,
        total_files: int,
    ) -> ConversionJob:
        job_id = uuid.uuid4().hex
        job = ConversionJob(
            job_id=job_id,
            category=category,
            target_format=target_format,
            total_files=total_files,
        )
        with self._lock:
            self._jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> ConversionJob | None:
        with self._lock:
            return self._jobs.get(job_id)

    def update_job(self, job_id: str, **updates: Any) -> ConversionJob:
        with self._lock:
            job = self._jobs[job_id]
            for key, value in updates.items():
                setattr(job, key, value)
            return job

    def increment_processed(self, job_id: str) -> ConversionJob:
        with self._lock:
            job = self._jobs[job_id]
            job.processed_files += 1
            return job

    def delete_job(self, job_id: str) -> None:
        with self._lock:
            self._jobs.pop(job_id, None)

    def list_jobs(self) -> list[ConversionJob]:
        with self._lock:
            return list(self._jobs.values())
