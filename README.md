## Converti � Container Deployment

### Schritt 1: Repository klonen

```bash
git clone https://github.com/fiveraptor/converti.git
cd converti
```

### Schritt 2: Docker Compose ausf�hren

```bash
docker compose up -d
```

Standardm��ig startet die App auf diesen Ports:

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api

Du kannst die Port-Mappings im `docker-compose.yml` unter `ports:` anpassen. Ebenso lassen sich Umgebungsvariablen wie `CONVERTI_ALLOWED_ORIGINS` oder `CONVERTI_JOB_STORAGE_DIR` �berschreiben.

Zum Stoppen:

```bash
docker compose down
```

Job-Daten bleiben im Volume `backend_storage` persistent. Bei Updates reicht ein `docker compose pull` und `docker compose up -d`.

---

## F�r Entwickler

Converti ist eine FastAPI/React-Anwendung. Unterst�tzte Konvertierungen: Bilder (Pillow) sowie Audio/Video (FFmpeg). Der Browser speichert eine Historie laufender und abgeschlossener Jobs.

### Projektstruktur

```
converti/
+- backend/
�  +- app/
�  �  +- converters/
�  �  +- config.py
�  �  +- jobs.py
�  �  +- main.py
�  +- requirements.txt
+- frontend/
�  +- src/
�  �  +- components/
�  �  +- pages/
�  �  +- hooks/
�  �  +- styles/
�  +- package.json
�  +- nginx.conf
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

API: http://localhost:8000/api (Swagger unter `/docs`). FFmpeg muss lokal verf�gbar sein.

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev-Server: http://localhost:5173. Setze `VITE_API_BASE_URL`, wenn du einen anderen API-Endpunkt nutzen m�chtest.

### Roadmap-Ideen

- Echtzeit-Progress via WebSockets/SSE
- Zus�tzliche Converter (Archive, Dokumente ...)
- Authentifizierung & persistente Job-Datenbank
- Worker-Queue f�r Skalierung

### Lizenz

MIT � nutze Converti gerne als Basis f�r eigene Projekte.
