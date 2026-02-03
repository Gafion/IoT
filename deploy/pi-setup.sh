#!/bin/bash
set -e

echo "=== Raspberry Pi: First-time setup ==="

sudo apt update
sudo apt install -y python3 python3-venv python3-serial git

cd ~
if [ ! -d "IoT" ]; then
  git clone https://github.com/gafion