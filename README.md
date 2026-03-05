# Hotel Reservations Premium

Sistema fullstack de reservaciones para hotel:
- Backend API: FastAPI + SQLAlchemy (async)
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Respaldo automatico: Google Drive (CSV actualizado en cada alta/cambio/baja)
- Hosting objetivo: Railway (API) + Neubox (frontend estatico)

## Funcionalidades
- Alta de reservaciones con:
  - nombre del huesped
  - email y telefono
  - check-in / check-out
  - hora de llegada
  - numero de personas
  - pagado / no pagado
  - monto total
  - notas
- Panel admin para:
  - listar reservaciones con filtros
  - cambiar estado de pago
  - eliminar reservaciones
- Sincronizacion automatica a Google Drive (archivo CSV centralizado)

## Estructura
```text
reservaciones/
  backend/    # FastAPI API + sync Google Drive
  frontend/   # React + Vite + TS + Tailwind
```

## Requisitos
- Python 3.11+
- Node.js 20+
- npm 10+

## Backend local
```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:
```text
GET http://localhost:8000/api/v1/health
```

## Frontend local
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

App local:
```text
http://localhost:5173
```

## Variables de entorno

Backend (`backend/.env`):
- `APP_NAME`: nombre de la API
- `ENVIRONMENT`: `development` o `production`
- `API_V1_PREFIX`: prefijo base, default `/api/v1`
- `DATABASE_URL`: SQLite local o PostgreSQL de Railway
- `CORS_ORIGINS`: URL(s) permitidas separadas por coma
- `ADMIN_TOKEN`: token para endpoints admin (`X-Admin-Token`)
- `GOOGLE_DRIVE_ENABLED`: `true` / `false`
- `GOOGLE_SERVICE_ACCOUNT_JSON`: JSON de service account (plano o base64)
- `GOOGLE_DRIVE_FOLDER_ID`: carpeta destino en Drive
- `GOOGLE_DRIVE_FILE_NAME`: nombre del CSV (ej. `hotel_reservations.csv`)

Frontend (`frontend/.env`):
- `VITE_API_BASE_URL`: URL publica de la API (ej. `https://tu-api.up.railway.app/api/v1`)
- `VITE_ADMIN_TOKEN`: mismo valor de `ADMIN_TOKEN` del backend

## Configurar Google Drive automatico
1. Crear proyecto en Google Cloud.
2. Habilitar Google Drive API.
3. Crear Service Account y generar llave JSON.
4. Crear carpeta en Google Drive para respaldos.
5. Compartir esa carpeta con el email de la service account (permiso Editor).
6. Colocar en backend:
   - `GOOGLE_DRIVE_ENABLED=true`
   - `GOOGLE_DRIVE_FOLDER_ID=<folder_id>`
   - `GOOGLE_SERVICE_ACCOUNT_JSON=<json o base64>`

Para convertir JSON a base64 en PowerShell:
```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content .\service-account.json -Raw)))
```

## Deploy backend en Railway
1. Crear nuevo proyecto y conectar el repo.
2. Configurar `Root Directory` en `backend`.
3. Definir variables de entorno del backend.
4. Agregar plugin PostgreSQL (opcional pero recomendado para produccion).
5. Verificar que `DATABASE_URL` apunte a PostgreSQL.
6. Railway detecta `Procfile` y levanta:
   - `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
7. Probar:
   - `GET /api/v1/health`

## Deploy frontend en Neubox
1. En local, construir frontend:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```
2. Subir el contenido de `frontend/dist/` a `public_html` en Neubox.
3. Confirmar que `.htaccess` existe en la raiz publicada (incluido desde `frontend/public/.htaccess`).
4. Si usas dominio propio, actualizar `CORS_ORIGINS` en Railway con esa URL.

## Endpoints principales
- Publico:
  - `POST /api/v1/public/reservations`
  - `GET /api/v1/public/reservations/{reservation_id}`
- Admin (requieren `X-Admin-Token`):
  - `GET /api/v1/admin/reservations`
  - `PATCH /api/v1/admin/reservations/{reservation_id}`
  - `DELETE /api/v1/admin/reservations/{reservation_id}`

## Calidad y buenas practicas
- Frontend con TypeScript estricto y ESLint:
  ```bash
  cd frontend
  npm run lint
  ```
- Configuracion por entorno en backend/frontend.
- CORS configurable.
- Validaciones de negocio en API (fechas, estado de pago, cantidades).
- Codigo y archivos en UTF-8 para evitar mojibake.

## Documentacion oficial recomendada
- FastAPI: https://fastapi.tiangolo.com/
- SQLAlchemy: https://docs.sqlalchemy.org/
- React: https://react.dev/
- Vite: https://vite.dev/guide/
- Tailwind CSS: https://tailwindcss.com/docs
- Railway: https://docs.railway.com/
- Google Drive API: https://developers.google.com/drive/api/guides/about-sdk
