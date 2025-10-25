## Converti - Container Deployment

### Schritt 1: Repository klonen

```bash
git clone https://github.com/fiveraptor/converti.git
cd converti
```

### Schritt 2: Docker Compose ausfuehren

```bash
docker compose up -d
```

Standardports:

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api

Anpassungen nimmst du direkt in `docker-compose.yml` vor:

- `ports:` - externe Ports aendern
- `CONVERTI_ALLOWED_ORIGINS` - erlaubte Origins fuer CORS
- `CONVERTI_JOB_RETENTION_DAYS` - automatische Aufraeumung alter Jobs (Standard 7 Tage)
- `CONVERTI_JOB_STORAGE_DIR` - Pfad fuer temporare Dateien

Stoppen kannst du die Container mit `docker compose down`. Jobdaten bleiben im Volume `backend_storage` erhalten. Fuer Updates genuegen `docker compose pull` und danach `docker compose up -d`.

---

## Fuer Entwickler

Converti basiert auf FastAPI (Backend) und React/Vite (Frontend). Unterstuetzte Konvertierungen: Bilder (Pillow) sowie Audio/Video (FFmpeg). Der Browser speichert eine lokale Historie abgeschlossener Jobs.

### Projektstruktur

```
converti/
+- backend/
¦  +- app/
¦  ¦  +- converters/
¦  ¦  +- config.py
¦  ¦  +- jobs.py
¦  ¦  +- main.py
¦  +- requirements.txt
+- frontend/
¦  +- src/
¦  ¦  +- components/
¦  ¦  +- pages/
¦  ¦  +- hooks/
¦  ¦  +- styles/
¦  +- package.json
¦  +- nginx.conf
+- Dockerfile.backend
+- Dockerfile.frontend
+- docker-compose.yml
```

### Lokale Entwicklung

#### Backend

```bash
python -m venv .venv
.venv/Scripts/activate  # Windows
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

API: http://localhost:8000/api (Swagger unter `/docs`). FFmpeg muss lokal verfuegbar sein.

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev-Server: http://localhost:5173. Setze `VITE_API_BASE_URL`, wenn ein anderer API-Endpunkt verwendet werden soll.

### Roadmap-Ideen

- Echtzeit-Progress via WebSockets/SSE
- Weitere Converter (Archive etc.)
- Authentifizierung & persistente Jobdatenbank
- Worker-Queue fuer Skalierung

### Lizenz

MIT - nutze Converti gerne als Basis fuer eigene Projekte.
