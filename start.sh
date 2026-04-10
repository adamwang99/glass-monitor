#!/bin/bash
# Glass Monitor Launcher
cd "$(dirname "$0")"

# Kill any existing instances
killall -9 electron 2>/dev/null
sleep 1

export DISPLAY=:1
export ELECTRON_DISABLE_SANDBOX=1
npm start
