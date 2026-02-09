#!/bin/bash
set -e

echo "=== Server: First-time setup ==="

sudo apt update
sudo apt install -y git curl

# .NET 9 SDK
curl -fsSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 9.0
echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc
echo 'export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools' >> ~/.bashrc
export DOTNET_ROOT=$HOME/.dotnet
export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools

cd ~
if [ ! -d "IoT" ]; then
  git clone https://github.com/Gafion/IoT.git
fi

cd ~/IoT/backend/IoTApi
$DOTNET_ROOT/dotnet publish -c Release -o ~/iot-api-publish

sudo cp ~/IoT/deploy/iot-api.service /etc/systemd/system/
sudo cp ~/IoT/deploy/iot-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable iot-api iot-web

echo "=== Setup complete ==="