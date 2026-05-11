#!/bin/bash
# Start REZ Core Events services

echo "Starting REZ Core Events..."

# Event Platform (4008)
cd services/event-platform && npm start &
sleep 2

# Action Engine (4009)
cd ../action-engine && npm start &

echo "Core Events started"
wait
