# IoT Project — Arduino + Gateway + ASP.NET Core API + Web

This repository contains a full, end‑to‑end IoT demo:
- Arduino (UNO R4 WiFi) reads an HC‑SR04 ultrasonic sensor and toggles an LED; it emits compact JSON over serial when the LED state changes.
- A Python gateway reads serial data and forwards readings to a backend over HTTP, with local SQLite buffering for offline resilience.
- An ASP.NET Core API (with Identity + EF Core/MySQL) stores readings and serves a simple dashboard and history pages.
- Static web assets (HTML/CSS/JS) are bundled and served by the backend.
- Deployment scripts and systemd units for server and Raspberry Pi.

## Repository layout
- `arduino/` — PlatformIO project for UNO R4 WiFi + HC‑SR04 distance sensor
- `backend/` — ASP.NET Core Web API (`backend/IoTApi`) + EF Core + Identity + MySQL
- `gateway/` — Python serial‑to‑HTTP forwarder with offline buffering
- `web/` — Static web (HTML/CSS/JS). Copied to backend output at build time
- `deploy/` — systemd services and helper scripts for server and Raspberry Pi

## Quick start (local development)
### Prerequisites
- .NET SDK 9.0+
- Python 3.10+
- MySQL 8.x (or compatible) reachable by the backend
- PlatformIO (for firmware) if you plan to flash the Arduino

### 1) Start the backend API and web
The backend copies `web/` into its `wwwroot` at build/publish (see `IoTApi.csproj`).

Suggested environment for development:
- `ASPNETCORE_ENVIRONMENT=Development` (enables Swagger and relaxed Identity password rules)
- `ASPNETCORE_URLS=http://0.0.0.0:5000` (optional)
- `ConnectionStrings:DefaultConnection=Server=127.0.0.1;Database=colbergtech;User=iot_api;Password=1234;` (or set your own)
- `ApiToken=<your-shared-gateway-token>` (optional; when set, POST from gateway must include `Authorization: Bearer <token>`)

Run:
```
dotnet run --project backend/IoTApi
```
Open:
- Swagger (dev only): `http://localhost:5000/swagger`
- Login: `http://localhost:5000/login`
- Register: `http://localhost:5000/register`
- Dashboard (auth required): `http://localhost:5000/dashboard`
- History (auth required): `http://localhost:5000/history`

The database is auto‑migrated on startup.

### 2) Run the gateway
From `gateway/`:
```
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
IOT_API_URL=http://localhost:5000/api/readings \
IOT_API_TOKEN=<your-shared-gateway-token> \
IOT_SERIAL_PORT=/dev/ttyACM0 IOT_BAUDRATE=9600 IOT_DEVICE_ID=1 \
./venv/bin/python gateway.py
```
The gateway stores unsent payloads in `gateway/gateway.db` and retries with exponential backoff.

### 3) Flash the Arduino (optional)
Connect an UNO R4 WiFi with an HC‑SR04 and an LED:
- `trigPin=9`, `echoPin=10`, `LED_PIN=11`
- LED turns ON when distance < 20 cm
- 9600 baud; JSON lines like: `{ "led_on": true }`

From `arduino/`:
```
pio run -t upload
```
Use a serial monitor at 9600 baud to observe output.

## API overview
Authenticated endpoints require cookie auth (login/register via web) unless otherwise noted.

- `POST /api/readings` (AllowAnonymous with shared bearer token when `ApiToken` is configured)
  - Body: `{ "deviceId": "1", "timestamp": "2025-01-01T12:00:00Z", "ledOn": true }`
  - Stores a reading; returns `{ ok: true, id }`.
- `GET /api/readings/latest` — Latest reading
- `GET /api/readings/status` — OK/ALARM + staleness
- `GET /api/readings/status-per-device` — Latest per device
- `GET /api/readings/history/{deviceId}?limit=100` — Recent history

Auth endpoints:
- `POST /api/auth/register` — create user (also used by web UI)
- `POST /api/auth/login` — sign in (cookie auth)
- `POST /api/auth/logout` — sign out

## Deployment
See `deploy/` for scripts and systemd units.
- Server: `server-setup.sh` (first‑time), `server-deploy.sh` (update/publish), units `iot-api.service`, `iot-web.service`, and `iot-api-dev.service`.
- Raspberry Pi (gateway): `pi-setup.sh` provisions Python venv, installs requirements, creates/enables `iot-gateway.service`.

## Security notes
- When `ApiToken` is set in backend configuration, gateway POSTs must include `Authorization: Bearer <token>` and will be rejected otherwise.
- In Development, password policy is intentionally relaxed. Use strong passwords in Production and configure HTTPS.

## License
See `LICENSE` for details.
