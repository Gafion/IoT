# Deploy scripts and services

This folder contains helper scripts and systemd unit files to run the backend API (and optionally the web) on a Linux server, and to run the Python gateway on a Raspberry Pi.

## Server (backend)
### Files
- `server-setup.sh` — One-time setup on a fresh server:
  - Installs Git and .NET 9 SDK (user-local)
  - Clones the repo into `~/IoT`
  - Publishes the backend into `~/iot-api-publish`
  - Installs and enables `iot-api.service` and `iot-web.service`
- `server-deploy.sh` — Idempotent deploy/update script:
  - Fetches and resets to `origin/main`
  - Publishes the backend into `~/iot-api-publish`
  - Restarts `iot-api`
  - Installs/enables `iot-api-dev.service` (dev instance) and restarts it
- `iot-api.service` — systemd unit for the published backend
- `iot-api-dev.service` — systemd unit for a dev instance (runs from source/`dotnet run` or configured path)
- `iot-web.service` — optional systemd unit to serve static web separately (if needed)

### Usage (server)
Run setup (first time):
```
bash deploy/server-setup.sh
```
Deploy new version:
```
bash deploy/server-deploy.sh
```
Manage services:
```
sudo systemctl status iot-api
sudo systemctl restart iot-api
sudo journalctl -u iot-api -f
```

Notes:
- Ensure MySQL is reachable and `ConnectionStrings:DefaultConnection` is set for the service environment (via unit `Environment=` entries or environment files) and set `ApiToken` if using the gateway.
- Reverse proxy/HTTPS is recommended in production.

## Raspberry Pi (gateway)
### Files
- `pi-setup.sh` — One-time provisioning for the gateway on a Pi:
  - Installs Python, venv, pyserial, SQLite, Git
  - Clones/updates the repo into `~/IoT`
  - Creates a venv under `gateway/venv` and installs requirements
  - Runs a small smoke test (`python -m unittest test_gateway.py`)
  - Customizes `gateway.service` into `/etc/systemd/system/iot-gateway.service`
  - Adds current user to `dialout` and enables/starts the service

### Usage (Pi)
```
bash deploy/pi-setup.sh
```
Manage service:
```
sudo systemctl status iot-gateway
sudo systemctl restart iot-gateway
```

### Environment for gateway service
Configure via unit `Environment=` or `/etc/default/iot-gateway` (if you extend the unit):
- `IOT_API_URL`, `IOT_API_TOKEN`, `IOT_SERIAL_PORT`, `IOT_BAUDRATE`, `IOT_DEVICE_ID`
