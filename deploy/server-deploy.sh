#!/bin/bash
set -e

echo "=== Server: Deploying ==="

cd ~/IoT
git pull origin main

cd backend/IoTApi
~/.dotnet/dotnet publish -c Release -o ~/iot-api-publish
sudo systemctl restart iot-api

sudo cp ~/IoT/deploy/iot-api-dev.service /etc/systemd/system/iot-api-dev.service
sudo systemctl daemon-reload
sudo systemctl enable iot-api-dev >/dev/null 2>&1 || true
sudo systemctl restart iot-api-dev || sudo systemctl start iot-api-dev

echo "=== Deploy complete ==="