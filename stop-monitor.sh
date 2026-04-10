#!/bin/bash

echo "🛑 Stopping Glass System Monitor..."

docker compose down --remove-orphans

echo "✅ Glass Monitor stopped successfully!"