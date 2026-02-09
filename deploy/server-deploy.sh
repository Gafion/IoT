#!/bin/bash
set -e

echo "=== Server: Deploying ==="

cd ~/IoT
git pull origin main

cd backend/IoTApi
~/.dotnet/dotnet publish -c Release -o ~/iot-api-publish
sudo systemctl restart iot-api

echo "=== Deploy complete ==="