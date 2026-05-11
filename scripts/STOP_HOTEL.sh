#!/bin/bash
# Hotel Ecosystem Stop Script

echo "Stopping Hotel Ecosystem services..."

# Kill by PID files
for pidfile in /tmp/hotel-pms.pid /tmp/stayown.pid /tmp/rez-mind.pid; do
    if [ -f "$pidfile" ]; then
        pid=$(cat "$pidfile")
        kill $pid 2>/dev/null && echo "Stopped process $pid"
        rm "$pidfile"
    fi
done

# Kill by port
for port in 3008 4015 4017; do
    pid=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        kill $pid 2>/dev/null && echo "Stopped port $port"
    fi
done

echo "Done!"
