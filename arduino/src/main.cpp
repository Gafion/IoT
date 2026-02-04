#include <Arduino.h>

#define LED_PIN 11
constexpr int trigPin = 9;
constexpr int echoPin = 10;

// Valid range: up to 40 cm
constexpr double MAX_DISTANCE = 40.0;

// Noise reduction
constexpr int FILTER_SIZE = 5;
double readings[FILTER_SIZE];
int readingIndex = 0;
bool bufferFull = false;

bool prevLedOn = false;
bool firstRead = true;

double readDistance() {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    unsigned long duration = pulseIn(echoPin, HIGH, 30000);
    if (duration == 0) {
        return -1.0;
    }
    return (duration * 0.0343) / 2.0;
}

double getFilteredDistance() {
    double raw = readDistance();

    // Validation
    if (raw < 0.0 || raw > MAX_DISTANCE) {
        return -1.0;
    }

    // Add to buffer
    readings[readingIndex] = raw;
    readingIndex = (readingIndex + 1) % FILTER_SIZE;
    if (readingIndex == 0) bufferFull = true;

    // Calculate average
    int count = bufferFull ? FILTER_SIZE : readingIndex;
    if (count == 0) return raw;

    double sum = 0.0;
    for (int i = 0; i < count; i++) {
        sum += readings[i];
    }
    return sum / count;
}

void setup() {
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    Serial.begin(9600);

    for (int i = 0; i < FILTER_SIZE; i++) {
        readings[i] = 0.0;
    }
}

void loop() {
    double distance = getFilteredDistance();

    bool valid = distance >= 0.0;
    bool ledOn = valid && (distance < 20.0);

    digitalWrite(LED_PIN, ledOn ? HIGH : LOW);

    if (ledOn != prevLedOn || firstRead) {
        Serial.print("{\"distance\": ");
        if (valid) {
            Serial.print(distance, 2);
        } else {
            Serial.print("null");
        }
        Serial.print(", \"led_on\": ");
        Serial.print(ledOn ? "true" : "false");
        Serial.println("}");

        prevLedOn = ledOn;
        firstRead = false;
    }

    delay(100);
}