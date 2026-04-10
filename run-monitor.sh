#!/bin/bash

# Glass System Monitor - Launcher Script
# Handles X11 authorization and starts the monitor

set -e

echo "🚀 Starting Glass System Monitor..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create X authority file if it doesn't exist
XAUTH=/tmp/.docker.xauth
if [ ! -f $XAUTH ]; then
    echo "🔐 Creating X authority file..."
    touch $XAUTH
    chmod 644 $XAUTH
    
    # Add current display to X authority
    if command -v xauth >/dev/null 2>&1; then
        xauth nlist $DISPLAY 2>/dev/null | sed -e 's/^..../ffff/' | xauth -f $XAUTH nmerge - 2>/dev/null || true
    fi
fi

# Set environment variables
export DISPLAY=${DISPLAY:-:0}
export XAUTHORITY=$XAUTH

# Create logs directory
mkdir -p logs

# Check if monitor is already running
if docker ps | grep -q glass-system-monitor; then
    echo "⚠️  Glass Monitor is already running!"
    echo "   Use './stop-monitor.sh' to stop it first."
    exit 0
fi

# Build and start the container
echo "📦 Building container (first time may take a while)..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build

echo ""
echo "✅ Glass System Monitor started successfully!"
echo ""
echo "📊 Features:"
echo "  • Glass transparent UI with blur effect"
echo "  • Real-time CPU, RAM, Temperature monitoring"
echo "  • n8n workflow status integration"
echo "  • Color-coded alerts (Green/Orange/Red)"
echo "  • Glow effects for high usage"
echo "  • System tray integration"
echo ""
echo "🎯 The monitor will appear in the bottom-right corner"
echo "💡 Hover over the window to see glow effects"
echo "🔧 To stop: ./stop-monitor.sh"
echo "📜 To view logs: docker logs -f glass-system-monitor"
echo ""
echo "Happy monitoring! 🚀"