#!/bin/bash
# enable-mongodb-auth.sh
# Enable MongoDB authentication across all ReZ services
# Run this script after creating MongoDB users in Atlas

set -e

echo "=========================================="
echo "ReZ MongoDB AUTH Enablement Script"
echo "=========================================="
echo ""

# Check for required environment variables
if [ -z "$MONGODB_USERNAME" ] || [ -z "$MONGODB_PASSWORD" ]; then
    echo "ERROR: MONGODB_USERNAME and MONGODB_PASSWORD must be set"
    echo ""
    echo "Usage:"
    echo "  export MONGODB_USERNAME=your_username"
    echo "  export MONGODB_PASSWORD=your_password"
    echo "  export MONGODB_AUTH_SOURCE=admin"
    echo "  ./enable-mongodb-auth.sh"
    exit 1
fi

MONGODB_AUTH_SOURCE="${MONGODB_AUTH_SOURCE:-admin}"
ENVIRONMENT="${1:-staging}"

echo "Configuration:"
echo "  Username: $MONGODB_USERNAME"
echo "  Auth Source: $MONGODB_AUTH_SOURCE"
echo "  Environment: $ENVIRONMENT"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Creating MongoDB Atlas user..."

# Check if mongosh is installed
if ! command -v mongosh &> /dev/null; then
    echo "mongosh not found. Please install MongoDB Shell:"
    echo "  brew install mongosh"
    exit 1
fi

# Instructions for user to run in MongoDB Atlas
cat << 'INSTRUCTIONS'

To create the MongoDB user:

1. Go to MongoDB Atlas > Security > Database Access
2. Click "Add New Database User"
3. Select "Password Authentication"
4. Enter:
   - Username: rez_app
   - Password: (use the same as MONGODB_PASSWORD)
5. Add roles:
   - readWrite on rez, rez_auth, rez_orders, rez_payments, rez_wallet
   - readWrite on rez_karma, rez_gamification, rez_ads, rez_marketing
6. Click "Add User"

Then update your MONGODB_URI to:
  mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/rez?authSource=admin

INSTRUCTIONS

echo ""
echo "Next steps:"
echo "1. Create MongoDB Atlas user (instructions above)"
echo "2. Update MONGODB_URI in each service's .env"
echo "3. Test connection with: mongosh \"$MONGODB_URI\" --authenticationDatabase admin"
echo "4. Deploy to $ENVIRONMENT"
echo ""
echo "Done!"
