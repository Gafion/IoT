# Gateway (Serial ➜ HTTP with offline buffering)

A small Python service that reads JSON lines from the Arduino over serial and forwards them to the backend API. If the API is unreachable, it buffers payloads locally in SQLite and retries with exponential backoff.

## Requirements
- Python 3.10+
- `pip install -r requirements.txt`

## Environment variables
- `IOT_SERIAL_PORT` — Serial device (default: `/dev/ttyACM0`)
- `IOT_BAUDRATE` — Baud rate (default: `9600`)
- `IOT_API_URL` — Backend ingestion URL (default in code: `http://10.101.30.141:5000/api/readings` — override this!)
- `IOT_API_TOKEN` — Shared bearer token; must match backend `ApiToken` when configured
- `IOT_DEVICE_ID` — Identifier for the Arduino device (default: `1`)

## Run locally
```
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
IOT_API_URL=http://localhost:5000/api/readings \
IOT_API_TOKEN=<your-shared-token> \
IOT_SERIAL_PORT=/dev/ttyACM0 IOT_BAUDRATE=9600 IOT_DEVICE_ID=1 \
./venv/bin/python gateway.py
```

- Buffered entries are kept in `gateway.db` (SQLite) until successfully delivered.
- Input format (from Arduino): one JSON object per line, e.g. `{ "led_on": true }`.

## Systemd service
A template unit file `gateway.service` is provided. The Raspberry Pi setup script (`deploy/pi-setup.sh`) customizes and installs it as `iot-gateway.service`:
- Creates a virtualenv in `gateway/venv`
- Ensures the user is in the `dialout` group (serial access)
- Writes `/etc/systemd/system/iot-gateway.service`
- Enables and starts the service

Manual management examples:
```
sudo systemctl status iot-gateway
sudo systemctl restart iot-gateway
sudo journalctl -u iot-gateway -f
```
