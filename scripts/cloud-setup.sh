#!/bin/bash
# Cloud environment setup script for the Storefront repo.
# Paste this into the "Setup script" field of your cloud environment at claude.ai/code.
# It runs once as root on Ubuntu 24.04; the result is cached when it finishes in about five minutes.
# Pre-installed already: Node 22, PostgreSQL 16, Docker, git. Not pre-installed: .NET SDK, Flutter.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

install_dotnet() {
  # .NET 10 is in Ubuntu 24.04's own archive (noble-updates)
  apt-get update
  apt-get install -y dotnet-sdk-10.0
  dotnet tool install --global dotnet-ef
  ln -sf /root/.dotnet/tools/dotnet-ef /usr/local/bin/dotnet-ef
}

install_flutter() {
  git clone --depth 1 --branch stable https://github.com/flutter/flutter.git /opt/flutter
  git config --global --add safe.directory /opt/flutter
  ln -sf /opt/flutter/bin/flutter /usr/local/bin/flutter
  ln -sf /opt/flutter/bin/dart /usr/local/bin/dart
  flutter config --no-analytics
  flutter --version   # downloads the Dart SDK
}

install_dotnet > /tmp/setup-dotnet.log 2>&1 &
DOTNET_PID=$!
install_flutter > /tmp/setup-flutter.log 2>&1 &
FLUTTER_PID=$!

wait $DOTNET_PID  || { cat /tmp/setup-dotnet.log;  exit 1; }
wait $FLUTTER_PID || { cat /tmp/setup-flutter.log; exit 1; }

dotnet --info | head -n 5
flutter --version
