"""FastAPI application entrypoint for Converti."""

from __future__ import annotations

import logging
import shutil
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Iterable
import threading
import time

from fastapi import (
    BackgroundTasks,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette import status

from .config import settings
from .converters import SUPPORTED_TARGETS, available_categories, convert_file
from .converters.base import ConversionError
from .jobs import JobFileResult, JobManager, JobStatus

logger = logging.getLogger("converti")

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings.job_storage_dir.mkdir(parents=True, exist_ok=True)
job_manager = JobManager()
executor = ThreadPoolExecutor(max_workers=settings.max_concurrent_jobs)


def serialize_job(job):
    return {
        "jobId": job.job_id,
        "category": job.category,
        "targetFormat": job.target_format,
        "status": job.status.value,
        "progress": job.progress,
        "totalFiles": job.total_files,
        "processedFiles": job.processed_files,
        "error": job.error,
        "results": [
            {
                "sourceName": result.source_name,
                "outputName": result.output_name,
                "status": result.status.value,
                "error": result.error,
            }
            for result in job.results
        ],
    }


def _job_directory(job_id: str) -> Path:
    base = settings.job_storage_dir / job_id
    base.mkdir(parents=True, exist_ok=True)
    return base


def _input_directory(job_id: str) -> Path:
    directory = _job_directory(job_id) / "input"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _output_directory(job_id: str) -> Path:
    directory = _job_directory(job_id) / "output"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _zip_path(job_id: str) -> Path:
    return _job_directory(job_id) / "converted.zip"


def _unique_name(candidate: str, existing: Iterable[str]) -> str:
    if candidate not in existing:
        return candidate
    stem = Path(candidate).stem
    suffix = Path(candidate).suffix
    index = 1
    while True:
        new_name = f"{stem}_{index}{suffix}"
        if new_name not in existing:
            return new_name
        index += 1


def _process_job(job_id: str) -> None:
    job = job_manager.get_job(job_id)
    if job is None:
        logger.warning("Job %s vanished before processing", job_id)
        return

    if job.status is JobStatus.CANCELLED:
        logger.info("Job %s cancelled before start", job_id)
        _delete_job_artifacts(job_id)
        job_manager.delete_job(job_id)
        return

    job_manager.update_job(job_id, status=JobStatus.PROCESSING, error=None)
    failures = 0
    for result in job.results:
        if job.status is JobStatus.CANCELLED:
            logger.info("Job %s cancelled during processing", job_id)
            break

        output_path = result.output_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            convert_file(
                job.category,
                result.source_path,
                output_path,
                job.target_format,
            )
            result.status = JobStatus.COMPLETED
        except ConversionError as exc:
            failures += 1
            result.status = JobStatus.FAILED
            result.error = str(exc)
            logger.warning("Conversion failed for %s: %s", result.source_name, exc)
        except Exception as exc:  # pragma: no cover - safety net
            failures += 1
            result.status = JobStatus.FAILED
            result.error = f"Unexpected error: {exc}"
            logger.exception("Unexpected error for %s", result.source_name)
        finally:
            job_manager.increment_processed(job_id)

    if job.status is JobStatus.CANCELLED:
        for result in job.results:
            if result.status in (JobStatus.PENDING, JobStatus.PROCESSING):
                result.status = JobStatus.CANCELLED
                result.error = "Cancelled"
        job.error = job.error or "Cancelled by user"
        _delete_job_artifacts(job_id)
        job_manager.delete_job(job_id)
        return

    final_status = JobStatus.COMPLETED if failures == 0 else JobStatus.FAILED
    error = None
    if failures:
        error = f"{failures} file(s) failed during conversion"
    job_manager.update_job(job_id, status=final_status, error=error)
    if final_status is JobStatus.FAILED and failures == len(job.results):
        output_dir = _output_directory(job_id)
        shutil.rmtree(output_dir, ignore_errors=True)



def _delete_job_artifacts(job_id: str) -> None:
    shutil.rmtree(_job_directory(job_id), ignore_errors=True)


def cleanup_expired_jobs() -> None:
    retention_days = max(0, settings.job_retention_days)
    if retention_days <= 0:
        return

    settings.job_storage_dir.mkdir(parents=True, exist_ok=True)
    cutoff = time.time() - retention_days * 86400
    keep_ids: set[str] = set()

    for existing_job in list(job_manager.list_jobs()):
        if existing_job.created_at < cutoff:
            logger.info("Removing expired job %s", existing_job.job_id)
            job_manager.delete_job(existing_job.job_id)
            _delete_job_artifacts(existing_job.job_id)
        else:
            keep_ids.add(existing_job.job_id)

    for job_dir in settings.job_storage_dir.iterdir():
        if not job_dir.is_dir():
            continue
        job_id = job_dir.name
        if job_id in keep_ids:
            continue
        try:
            mtime = job_dir.stat().st_mtime
        except FileNotFoundError:
            continue
        if mtime < cutoff:
            logger.info("Removing expired job directory %s", job_dir)
            shutil.rmtree(job_dir, ignore_errors=True)


def _retention_worker() -> None:
    while True:
        try:
            cleanup_expired_jobs()
        except Exception as exc:  # pragma: no cover
            logger.exception("Job retention cleanup failed: %s", exc)
        interval_hours = max(6, settings.job_retention_days)
        time.sleep(interval_hours * 3600)
@app.on_event("startup")
async def on_startup() -> None:
    cleanup_expired_jobs()
    if settings.job_retention_days > 0:
        thread = threading.Thread(target=_retention_worker, daemon=True)
        thread.start()
@app.get(f"{settings.api_prefix}/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get(f"{settings.api_prefix}/categories")
async def list_categories() -> dict[str, list[str]]:
    return {category: SUPPORTED_TARGETS[category] for category in available_categories()}


@app.post(f"{settings.api_prefix}/convert")
async def convert_files(
    background_tasks: BackgroundTasks,
    category: str = Form(...),
    target_format: str = Form(...),
    files: list[UploadFile] = File(...),
) -> JSONResponse:
    if category not in SUPPORTED_TARGETS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported category '{category}'",
        )

    target_format = target_format.lower()
    if target_format not in SUPPORTED_TARGETS[category]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported target format '{target_format}'",
        )

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files were provided for conversion",
        )

    job = job_manager.create_job(
        category=category,
        target_format=target_format,
        total_files=len(files),
    )

    input_dir = _input_directory(job.job_id)
    output_dir = _output_directory(job.job_id)
    existing_output_names: set[str] = set()

    for index, upload in enumerate(files):
        filename = upload.filename or f"file_{index}"
        safe_name = Path(filename).name or f"file_{index}"
        input_path = input_dir / safe_name
        output_name_candidate = f"{Path(safe_name).stem}.{target_format}"
        output_name = _unique_name(output_name_candidate, existing_output_names)
        existing_output_names.add(output_name)
        output_path = output_dir / output_name

        with input_path.open("wb") as destination:
            shutil.copyfileobj(upload.file, destination)

        upload.file.close()

        job.results.append(
            JobFileResult(
                source_name=safe_name,
                source_path=input_path,
                output_name=output_name,
                output_path=output_path,
            ),
        )

    background_tasks.add_task(executor.submit, _process_job, job.job_id)

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"jobId": job.job_id},
    )


@app.get(f"{settings.api_prefix}/jobs/{{job_id}}")
async def get_job(job_id: str):
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return serialize_job(job)


@app.get(f"{settings.api_prefix}/jobs/{{job_id}}/download")
async def download_job(job_id: str):
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.status is not JobStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job is not completed yet",
        )

    zip_path = _zip_path(job_id)
    if not zip_path.exists():
        output_dir = _output_directory(job_id)
        if not output_dir.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Converted files not found",
            )
        archive_path = shutil.make_archive(str(zip_path.with_suffix("")), "zip", output_dir)
        zip_path = Path(archive_path)

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=f"{settings.app_name.lower()}_{job_id}.zip",
    )


@app.get(f"{settings.api_prefix}/jobs/{{job_id}}/files/{{filename}}")
async def download_single_file(job_id: str, filename: str):
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    normalized = Path(filename).name
    for result in job.results:
        if result.output_name == normalized and result.status is JobStatus.COMPLETED:
            if not result.output_path.exists():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Converted file missing",
                )
            return FileResponse(
                result.output_path,
                filename=result.output_name,
            )
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="File not found for this job",
    )


@app.delete(f"{settings.api_prefix}/jobs/{{job_id}}")
async def delete_job(job_id: str):
    job = job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if job.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
        _delete_job_artifacts(job_id)
        job_manager.delete_job(job_id)
        return {"deleted": True}

    job_manager.cancel_job(job_id, "Cancelled by user")
    return JSONResponse(status_code=status.HTTP_202_ACCEPTED, content={"cancelled": True})




