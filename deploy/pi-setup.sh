#!/bin/bash
set -e

echo "=== Raspberry Pi: First-time setup ==="

sudo apt update
sudo apt install -y python3 python3-venv python3-serial git sqlite3

cd ~
if [ ! -d "IoT" ]; then
  git clone https://github.com/Gafion/IoT.git
else
  git -C ~/IoT pull origin main || true
fi

cd ~/IoT/gateway
python3 -m venv venv
./venv/bin/python -m ensurepip --upgrade
./venv/bin/python -m pip install --upgrade pip
./venv/bin/python -m pip install -r requirements.txt

# Quick smoke test (non-fatal)
( cd ~/IoT && ./gateway/venv/bin/python -m unittest test_gateway.py ) || true

# Ensure service runs as current user and correct paths
USERNAME=$(whoami)
HOMEDIR=$(eval echo "~$USERNAME")
sudo usermod -a -G dialout "$USERNAME" || true
sudo sed -e "s|^User=.*|User=$USERNAME|" \
         -e "s|^WorkingDirectory=.*|WorkingDirectory=$HOMEDIR/IoT/gateway|" \
         -e "s|^ExecStart=.*|ExecStart=$HOMEDIR/IoT/gateway/venv/bin/python -u gateway.py|" \
         gateway.service | sudo tee /etc/systemd/system/iot-gateway.service >/dev/null

sudo systemctl daemon-reload
sudo systemctl enable iot-gateway
sudo systemctl restart iot-gateway.service

echo "=== Setup complete ==="