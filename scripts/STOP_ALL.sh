#!/bin/bash
# STOP_ALL.sh - Stop all ReZ services
# Usage: ./scripts/STOP_ALL.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Stopping all ReZ services..."

# Services to stop with their ports
services=(
    "rez-merchant-service:4005"
    "rez-wallet-service:4004"
    "rez-payment-service:4001"
    "rez-order-service:4006"
    "rez-socket-service:4007"
    "ReStopapa-backend:8000"
)

for svc in "${services[@]}"; do
    name="${svc%%:*}"
    port="${svc##*:}"

    # Kill by PID file if exists
    pid_file="$SCRIPT_DIR/pids/${name}.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 1
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$pid_file"
    fi

    # Also kill by port
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Killing process on port $port..."
        lsof -Pi :$port -sTCP:LISTEN -t | xargs kill 2>/dev/null || true
    fi

    # Kill by name pattern
    pkill -f "$name" 2>/dev/null || true
done

# Clean up log files (optional - comment out to preserve logs)
# rm -f "$SCRIPT_DIR/logs"/*.log

echo "All services stopped"
