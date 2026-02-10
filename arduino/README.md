# Arduino firmware (UNO R4 WiFi + HC‑SR04)

This PlatformIO project reads distance from an HC‑SR04 ultrasonic sensor and toggles an LED when an object is detected within ~20 cm. Each time the LED state changes, a compact JSON line is printed to serial for the gateway to consume.

## Hardware
- Board: Arduino UNO R4 WiFi (`board = uno_r4_wifi`)
- Sensor: HC‑SR04
- Pins (see `src/main.cpp`):
  - `trigPin = 9`
  - `echoPin = 10`
  - `LED_PIN = 11`
- Threshold: LED ON when `distance < 20.0` cm
- Baud rate: `9600`

Example serial output (emitted only when state changes):
```
{"led_on": true}
{"led_on": false}
```

## Build and upload
Prerequisites: [PlatformIO](https://platformio.org/)

From this directory:
```
pio run -t upload
```
Use a serial monitor at 9600 baud to observe output.

## Notes
- Simple moving average filtering smooths noisy distance readings (`FILTER_SIZE = 5`).
- The sketch prints only on changes to reduce traffic and storage.
