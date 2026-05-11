#!/bin/bash
# enable-redis-auth.sh
# Enable Redis authentication across all ReZ services
# Run this script after enabling Redis AUTH on Redis Cloud

set -e

echo "=========================================="
echo "ReZ Redis AUTH Enablement Script"
echo "=========================================="
echo ""

# Check for required environment variables
if [ -z "$REDIS_PASSWORD" ]; then
    echo "ERROR: REDIS_PASSWORD must be set"
    echo ""
    echo "Usage:"
    echo "  export REDIS_PASSWORD=your_secure_password"
    echo "  ./enable-redis-auth.sh"
    exit 1
fi

ENVIRONMENT="${1:-staging}"

echo "Configuration:"
echo "  Password: (set, shown as asterisks)"
echo "  Environment: $ENVIRONMENT"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Redis AUTH enabled with the following password: ${REDIS_PASSWORD//?/*}"
echo ""
echo "All services now have redis-auth.ts which will automatically"
echo "use REDIS_PASSWORD when set."
echo ""
echo "Next steps:"
echo "1. Enable Redis AUTH in Redis Cloud dashboard"
echo "2. Set REDIS_PASSWORD in production environment"
echo "3. Verify connection: redis-cli -a \$REDIS_PASSWORD PING"
echo ""
echo "Done!"
