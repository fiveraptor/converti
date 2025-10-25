
## Converti – Container Deployment

Ready-made Docker images are available on Docker Hub:

- `jorisbieg/converti-frontend`
- `jorisbieg/converti-backend`

### Quick Start

```bash
docker compose up -d
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api

Job data is persisted automatically in the named volume `backend_storage`.

### Customize

- Set `CONVERTI_ALLOWED_ORIGINS` to restrict CORS.
- Override `CONVERTI_JOB_STORAGE_DIR` if you want a different on-disk location.

---

## For Developers

Converti is built with FastAPI (backend) and React/Vite (frontend). It supports converting images (Pillow) and audio/video (FFmpeg), with drag-and-drop uploads, progress polling, and a browser-side job history.

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

The API is available at http://localhost:8000/api (Swagger UI at `/docs`). FFmpeg must be available on your PATH.

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs at http://localhost:5173. Set `VITE_API_BASE_URL` to target a custom API endpoint.

### Roadmap Ideas

- Real-time progress via WebSockets/SSE.
- Additional converters (archives, documents, etc.).
- Authentication, user accounts, and persistent job storage.
- Background worker queue for horizontal scaling.

### License

MIT – feel free to use Converti as a starting point for your own projects.
