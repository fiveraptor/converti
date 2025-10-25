
## Converti – Allround File Converter

Converti is a modern web application for converting media files – currently images, audio, and video. The backend is powered by FastAPI and provides job tracking, while the React/Vite frontend delivers a drag‑and‑drop workflow with progress monitoring and download management.

### Features

- Modern responsive UI with drag & drop uploads and real-time progress.
- Supports multiple files per job and parallel conversion queueing.
- Built-in browser history to revisit and download previous jobs.
- Backend converts images via Pillow and audio/video via FFmpeg.
- Ready-to-run Docker images for backend (uvicorn) and frontend (nginx).

### Project Structure

```
converti/
├─ backend/
│  ├─ app/
│  │  ├─ converters/      # Image & media converter implementations
│  │  ├─ config.py        # Settings via Pydantic
│  │  ├─ jobs.py          # In-memory job tracking
│  │  └─ main.py          # FastAPI entrypoint
│  └─ requirements.txt
├─ frontend/
│  ├─ src/
│  │  ├─ components/      # UI building blocks
│  │  ├─ pages/           # Home & convert workflow
│  │  ├─ hooks/           # API + history hooks
│  │  └─ styles/          # Global styling
│  ├─ package.json
│  └─ nginx.conf
├─ Dockerfile.backend
├─ Dockerfile.frontend
└─ docker-compose.yml
```

### Local Development

#### Backend

```bash
python -m venv .venv
.venv/Scripts/activate  # Windows
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

The API is available at `http://localhost:8000/api` (Swagger UI at `/docs`). FFmpeg must be available on your PATH.

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`. Use `VITE_API_BASE_URL` to point to a custom API endpoint.

### Docker

Published images:

- `jorisbieg/converti-backend`
- `jorisbieg/converti-frontend`

To run both services:

```bash
docker compose up -d
```

Backend is exposed on `http://localhost:8000/api`, frontend on `http://localhost:8080`.

### Ideas / Next Steps

- WebSockets or Server-Sent Events for instant progress updates.
- Additional converter modules (archives, documents, etc.).
- Authentication, user accounts, and persistent job storage.
- Background worker queue for horizontal scaling.

### License

MIT – feel free to use Converti as a starting point for your own projects.
