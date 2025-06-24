#\!/bin/bash
set -e

echo "🔄 Updating system..."
sudo apt-get update -y

echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "📦 Installing additional tools..."
sudo apt-get install -y git curl jq

echo "✅ VM setup completed\!"
docker --version
docker-compose --version
