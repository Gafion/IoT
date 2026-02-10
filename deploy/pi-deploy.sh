#!/bin/bash
set -e

echo "=== Raspberry Pi: Deploying ==="

cd ~/IoT
git pull origin main

cd gateway
# Ensure venv exists
if [ ! -d "venv" ]; then
  python3 -m venv venv
  ./venv/bin/python -m ensurepip --upgrade
fi

./venv/bin/python -m pip install --upgrade pip
./venv/bin/python -m pip install -r requirements.txt

# Quick smoke test (non-fatal)
( cd ~/IoT && ./gateway/venv/bin/python -m unittest test_gateway.py ) || true

# Update systemd service for current user and paths
USERNAME=$(whoami)
HOMEDIR=$(eval echo "~$USERNAME")
sudo usermod -a -G dialout "$USERNAME" || true
sudo sed -e "s|^User=.*|User=$USERNAME|" \
         -e "s|^WorkingDirectory=.*|WorkingDirectory=$HOMEDIR/IoT/gateway|" \
         -e "s|^ExecStart=.*|ExecStart=$HOMEDIR/IoT/gateway/venv/bin/python -u gateway.py|" \
         gateway.service | sudo tee /etc/systemd/system/iot-gateway.service >/dev/null

sudo systemctl daemon-reload
sudo systemctl restart iot-gateway.service

echo "=== Deploy complete ==="
sudo journalctl -u iot-gateway -f