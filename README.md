
# Converti – Allround Datei-Konverter

Converti ist eine moderne Webapplikation zum Konvertieren verschiedenster Dateiarten – Bilder, Audio, Video und Dokumente. Die Anwendung besteht aus einer FastAPI-Backend-API mit modularen Konverterdiensten und einer Vite/React-Oberfläche mit Drag-and-Drop Workflow.

## Features

- Übersichtliche Startseite mit Kategorien (Bilder, Audio, Video, Dokumente) und unterstützten Zielformaten.
- Drag & Drop Upload für mehrere Dateien gleichzeitig inkl. Auswahl des Zielformats.
- Fortschrittsverfolgung, Job-Status und Einzel-/Sammel-Downloads der konvertierten Dateien.
- Browserseitiger Verlauf speichert die letzten Konvertierungen (erneute Downloads auch nach Reload).
- Modular erweiterbare Converter für unterschiedliche Dateitypen (Pillow, ffmpeg, pandoc).
- Docker-Setup für Backend (uvicorn) und Frontend (nginx).

> **Hinweis:** Für Audio/Video/Dokument-Konvertierung werden externe Binaries (`ffmpeg`, `pandoc`) benötigt. Das Backend-Dockerimage installiert diese Tools automatisch. Lokal müssen sie separat im `PATH` vorhanden sein.

## Projektstruktur

```
converti/
├─ backend/
│  ├─ app/
│  │  ├─ converters/      # Konkrete Konverter-Implementierungen
│  │  ├─ config.py        # Settings via Pydantic
│  │  ├─ jobs.py          # Job- und Fortschrittsverwaltung
│  │  └─ main.py          # FastAPI Entry-Point
│  └─ requirements.txt
├─ frontend/
│  ├─ src/
│  │  ├─ components/      # UI Komponenten (Dropzone, Progress, etc.)
│  │  ├─ pages/           # HomePage & ConvertPage
│  │  ├─ styles/          # globale Styles
│  │  └─ utils/           # API-Client & Helpers
│  ├─ package.json
│  └─ nginx.conf
├─ Dockerfile.backend
├─ Dockerfile.frontend
└─ docker-compose.yml
```

## Lokale Entwicklung

### Backend

1. Python 3.11 installieren und virtuelles Environment anlegen.
2. Abhängigkeiten installieren:

   ```bash
   pip install -r backend/requirements.txt
   ```

3. Sicherstellen, dass `ffmpeg` und `pandoc` verfügbar sind (z. B. via `brew install ffmpeg pandoc` oder Paketmanager).
4. Backend starten:

   ```bash
   uvicorn app.main:app --app-dir backend --reload --port 8000
   ```

   Danach ist die API unter `http://localhost:8000/api` erreichbar (Swagger UI: `/docs`).

### Frontend

1. Node.js ≥ 20.x installieren.
2. Abhängigkeiten installieren:

   ```bash
   cd frontend
   npm install
   ```

3. Optional Basis-URL der API setzen (Standard: `http://localhost:8000/api`):

   ```bash
   echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env.local
   ```

4. Dev-Server starten:

   ```bash
   npm run dev
   ```

   Frontend läuft dann unter `http://localhost:5173`.

## Docker

Die Docker-Konfiguration erstellt zwei Services (Backend & Frontend) und verbindet sie über ein gemeinsames Netzwerk.

```bash
docker compose up --build
```

- Backend: `http://localhost:8000/api`
- Frontend: `http://localhost:8080`

Die Job-Daten werden persistent im Volume `backend_storage` abgelegt.

### Wichtige Build-Argumente / Umgebungsvariablen

- `VITE_API_BASE_URL` (Frontend Build Arg): Basis-URL für die API (Standard: `http://backend:8000/api` in Docker, `http://localhost:8000/api` lokal).
- `CONVERTI_ALLOWED_ORIGINS`: Kommagetrennte Liste erlaubter Origins für CORS (Standard: `*`).
- `CONVERTI_JOB_STORAGE_DIR`: Pfad für temporäre Job-Dateien (Standard: `./storage/jobs`).

## Erweiterungsideen

- Fortschritt via Server-Sent-Events oder WebSockets anstatt Polling.
- Unterstützung zusätzlicher Konverter (z. B. Archive, eBooks).
- Authentifizierung, Benutzerkonten und Job-Historie.
- Warteschlange/Worker (Celery, RQ) für skalierbare Background Jobs.
- Persistente Datenbank zur Job-Verwaltung.

## Lizenz

MIT-Lizenz – nutze Converti gern als Ausgangspunkt für eigene Projekte.
