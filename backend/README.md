# Backend (ASP.NET Core + EF Core + MySQL)

This is the Web API and static file host. It stores device readings, provides authenticated endpoints for the dashboard/history, and exposes a small public ingestion endpoint for the gateway when a shared token is configured.

- Framework: .NET 9 (ASP.NET Core)
- Data: EF Core + Pomelo MySQL provider
- Auth: ASP.NET Core Identity (cookie-based). Password policy is relaxed in Development only.

## How static web is served
`backend/IoTApi/IoTApi.csproj` links the `web/` folder so that its content is copied to `wwwroot/` at build/publish time. You typically edit files under `web/`, then build/run the backend.

## Configuration
Configuration comes from `appsettings*.json` and environment variables.

Important settings:
- `ConnectionStrings:DefaultConnection` — MySQL connection string.
  - Example: `Server=127.0.0.1;Database=colbergtech;User=iot_api;Password=1234;`
  - If not set, the app uses a similar fallback value for convenience in dev.
- `ApiToken` — Optional shared secret for gateway ingestion. When set, `POST /api/readings` requires header `Authorization: Bearer <token>`.
- `ASPNETCORE_ENVIRONMENT` — Use `Development` to enable Swagger and relaxed Identity password policy.
- `ASPNETCORE_URLS` — e.g. `http://0.0.0.0:5000` to listen on port 5000.

## Run (development)
From repository root or this folder:
```
dotnet run --project backend/IoTApi
```
Open:
- Swagger (dev only): `http://localhost:5000/swagger`
- Login: `http://localhost:5000/login`
- Register: `http://localhost:5000/register`
- Dashboard (auth required): `http://localhost:5000/dashboard`
- History (auth required): `http://localhost:5000/history`

The database schema is auto-migrated on startup.

## API endpoints (overview)
- `POST /api/readings` — Ingest a reading (AllowAnonymous, guarded by `ApiToken` if configured)
  - Body: `{ "deviceId": "1", "timestamp": "2025-01-01T12:00:00Z", "ledOn": true }`
  - Response: `{ ok: true, id }`
- `GET /api/readings/latest` — Latest reading
- `GET /api/readings/status` — Overall status (OK/ALARM + staleness)
- `GET /api/readings/status-per-device` — Latest status per device
- `GET /api/readings/history/{deviceId}?limit=100` — History for a device

Auth endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

## Migrations
Migrations are included; the app calls `db.Database.Migrate()` on startup.

To add a new migration (requires the EF Core tools):
```
dotnet tool install --global dotnet-ef
cd backend/IoTApi
DOTNET_ENVIRONMENT=Development dotnet ef migrations add <Name>
DOTNET_ENVIRONMENT=Development dotnet ef database update
```

## Production notes
- Use a strong MySQL user/password and restrict network access.
- Configure HTTPS termination (reverse proxy) and secure cookies.
- Provide a strong `ApiToken` if using the public ingestion endpoint.
