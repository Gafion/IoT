#!/bin/bash
set -e

echo "=== Raspberry Pi: Deploying ==="

cd ~/IoT
git pull origin main

cd gateway
./venv/bin/python -m pip install --upgrade pip
./venv/bin/python -m pip install -r requirements.txt

sudo cp gateway.service /etc/systemd/system/iot-gateway.service
sudo systemctl daemon-reload
sudo systemctl restart iot-gateway.service

echo "=== Deploy complete ==="