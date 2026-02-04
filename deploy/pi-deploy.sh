#!/bin/bash
set -e

echo "=== Raspberry Pi: Deploying ==="

cd ~/IoT
git pull origin main

cd gateway
./venv/bin/pip install -r requirements.txt

sudo cp gateway.service /etc/systemd/system/iot-gateway.service
sudo systemctl daemon-reload
sudo systemctl restart iot-gateway.service

echo "=== Deploy complete ==="