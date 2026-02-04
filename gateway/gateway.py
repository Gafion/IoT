import json
import time
import serial
import os
from datetime import datetime, timezone
from urllib import request, error

SERIAL_PORT = os.environ.get("IOT_SERIAL_PORT", "/dev/ttyACM0")
BAUDRATE = int(os.environ.get("IOT_BAUDRATE", "9600"))

API_URL = os.environ.get("IOT_API_URL", "http://10.101.30.141:5000/api/readings")
API_TOKEN = os.environ.get("IOT_API_TOKEN", "htxK2Vck07IRpJmgm1WsE2tSRBRtjZ3IMW+yEinHrGg=")
DEVICE_ID = os.environ.get("IOT_DEVICE_ID", "1")

HTTP_TIMEOUT_SECONDS = 5

def iso_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def parse_bool(v) -> bool:
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return bool(v)
    if isinstance(v, str):
        s = v.strip().lower()
        if s in ("true", "1", "yes", "on"):
            return True
        if s in ("false", "0", "no", "off"):
            return False
    raise ValueError(f"Invalid boolean value: {v!r}")


def post_reading(payload: dict) -> tuple[int, str]:
    if not API_TOKEN:
        raise RuntimeError("IOT_API_TOKEN is not set")

    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        API_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_TOKEN}",
        },
    )

    with request.urlopen(req, timeout=HTTP_TIMEOUT_SECONDS) as resp:
        resp_body = resp.read().decode("utf-8", errors="replace")
        return resp.status, resp_body

def main():
    print(f"Serial: {SERIAL_PORT} @ {BAUDRATE}")
    print(f"API: {API_URL}")
    print(f"Device: {DEVICE_ID}")

    with serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1) as ser:
        time.sleep(2)

        backoff = 1.0
        while True:
            line = ser.readline().decode("utf-8", errors="replace").strip()
            if not line:
                continue

            try:
                msg = json.loads(line)
                led_on = parse_bool(msg["led_on"])

                payload = {
                    "deviceId": DEVICE_ID,
                    "timestamp": iso_utc_now(),
                    "ledOn": led_on,
                }

                status, _resp_body = post_reading(payload)
                print(f"POST {status}: ledOn={led_on}")

                backoff = 1.0

            except error.HTTPError as e:
                body = e.read().decode("utf-8", errors="replace")
                print(f"POST {e.code}: {body}")
                time.sleep(backoff)
                backoff = min(backoff * 2.0, 30.0)

            except Exception as e:
                print(f"SKIP ({type(e).__name__}): {e} | RAW: {line}")
                time.sleep(1)


if __name__ == "__main__":
    main()