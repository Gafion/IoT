#!/bin/bash
set -e

echo "=== Raspberry Pi: First-time setup ==="

sudo apt update
sudo apt install -y python3 python3-venv python3-serial git

cd ~
if [ ! -d "IoT" ]; then
  git clone https://github.com/Gafion/IoT.git
fi

cd  ~/IoT/gateway
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

sudo cp gateway.service /etc/systemd/system/iot-gateway.service
sudo systemctl daemon-reload
sudo systemctl enable iot-gateway

echo "=== Setup complete ==="