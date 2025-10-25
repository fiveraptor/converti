## Converti – Container Deployment

### Schritt 1: Repository klonen

```bash
git clone https://github.com/fiveraptor/converti.git
cd converti
```

### Schritt 2: Docker Compose ausführen

```bash
docker compose up -d
```

Standardmäßig startet die App auf diesen Ports:

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api

Du kannst die Port-Mappings im `docker-compose.yml` unter `ports:` anpassen. Ebenso lassen sich Umgebungsvariablen wie `CONVERTI_ALLOWED_ORIGINS` oder `CONVERTI_JOB_STORAGE_DIR` überschreiben.

Zum Stoppen:

```bash
docker compose down
```

Job-Daten bleiben im Volume `backend_storage` persistent. Bei Updates reicht ein `docker compose pull` und `docker compose up -d`.

---

## Für Entwickler

Converti ist eine FastAPI/React-Anwendung. Unterstützte Konvertierungen: Bilder (Pillow) sowie Audio/Video (FFmpeg). Der Browser speichert eine Historie laufender und abgeschlossener Jobs.

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

API: http://localhost:8000/api (Swagger unter `/docs`). FFmpeg muss lokal verfügbar sein.

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev-Server: http://localhost:5173. Setze `VITE_API_BASE_URL`, wenn du einen anderen API-Endpunkt nutzen möchtest.

### Roadmap-Ideen

- Echtzeit-Progress via WebSockets/SSE
- Zusätzliche Converter (Archive, Dokumente ...)
- Authentifizierung & persistente Job-Datenbank
- Worker-Queue für Skalierung

### Lizenz

MIT – nutze Converti gerne als Basis für eigene Projekte.
