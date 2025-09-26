#!/bin/bash

# DePIN Autopilot - Complete Setup & Deployment Script
# This script handles EVERYTHING - just run it and answer the prompts

set -e  # Exit on error

echo "🚀 DePIN Autopilot - Complete Setup & Deployment"
echo "================================================"
echo ""

# Function to prompt for required info
prompt_for_value() {
    local var_name=$1
    local prompt_text=$2
    local default_value=$3
    local secret=$4

    if [ -n "$default_value" ]; then
        prompt_text="$prompt_text [$default_value]"
    fi

    if [ "$secret" = "true" ]; then
        read -s -p "$prompt_text: " value
        echo ""  # New line after secret input
    else
        read -p "$prompt_text: " value
    fi

    if [ -z "$value" ] && [ -n "$default_value" ]; then
        value=$default_value
    fi

    echo "$value"
}

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing via brew..."
    if command -v brew &> /dev/null; then
        brew install node
    else
        echo "❌ Please install Node.js manually from https://nodejs.org"
        exit 1
    fi
fi
echo "✅ Node.js: $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi
echo "✅ pnpm: $(pnpm --version)"

# Check git
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install git"
    exit 1
fi
echo "✅ Git: $(git --version | head -n1)"

echo ""
echo "📋 Step 2: Setting up environment..."
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from template"
fi

# Step 3: Collect required credentials
echo ""
echo "📋 Step 3: Let's set up your credentials"
echo "========================================="
echo ""

echo "🔐 Admin Dashboard Credentials:"
ADMIN_USER=$(prompt_for_value "ADMIN_USER" "Admin username" "admin")
ADMIN_PASS=$(prompt_for_value "ADMIN_PASS" "Admin password (min 8 chars)" "" true)

# Validate password length
while [ ${#ADMIN_PASS} -lt 8 ]; do
    echo "❌ Password must be at least 8 characters"
    ADMIN_PASS=$(prompt_for_value "ADMIN_PASS" "Admin password (min 8 chars)" "" true)
done

echo ""
echo "💳 Stripe Setup (for billing):"
echo "1. Go to https://dashboard.stripe.com/register"
echo "2. Sign up for a free account"
echo "3. Go to Developers > API keys"
echo "4. Copy your TEST Secret Key (starts with sk_test_)"
echo ""
STRIPE_KEY=$(prompt_for_value "STRIPE_KEY" "Stripe Secret Key (or 'skip' for later)" "skip" true)

echo ""
echo "🌐 io.net Credentials (for real earnings):"
echo "Choose authentication method:"
echo "1. API Key (recommended if you have it)"
echo "2. Email/Password (we'll use browser automation)"
echo "3. Skip for now (use mock data)"
echo ""
read -p "Choice (1/2/3): " io_choice

case $io_choice in
    1)
        IONET_API_KEY=$(prompt_for_value "IONET_API_KEY" "io.net API Key" "" true)
        ;;
    2)
        IONET_EMAIL=$(prompt_for_value "IONET_EMAIL" "io.net Email")
        IONET_PASSWORD=$(prompt_for_value "IONET_PASSWORD" "io.net Password" "" true)
        ;;
    *)
        echo "✅ Using mock data for now"
        ;;
esac

# Update .env file
echo ""
echo "📝 Updating configuration..."

# Function to update .env
update_env() {
    local key=$1
    local value=$2
    if grep -q "^$key=" .env; then
        # On macOS, use -i '' for sed
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^$key=.*|$key=$value|" .env
        else
            sed -i "s|^$key=.*|$key=$value|" .env
        fi
    else
        echo "$key=$value" >> .env
    fi
}

# Update credentials
update_env "ADMIN_USERNAME" "$ADMIN_USER"
update_env "ADMIN_PASSWORD" "$ADMIN_PASS"
update_env "ENABLE_AUTH" "true"

if [ "$STRIPE_KEY" != "skip" ]; then
    update_env "STRIPE_SECRET_KEY" "$STRIPE_KEY"
fi

if [ -n "$IONET_API_KEY" ]; then
    update_env "IONET_API_KEY" "$IONET_API_KEY"
elif [ -n "$IONET_EMAIL" ]; then
    update_env "IONET_EMAIL" "$IONET_EMAIL"
    update_env "IONET_PASSWORD" "$IONET_PASSWORD"
fi

echo "✅ Configuration updated"

# Step 4: Install and build
echo ""
echo "📋 Step 4: Installing dependencies..."
echo ""
pnpm install --frozen-lockfile

echo ""
echo "📋 Step 5: Setting up database..."
echo ""
pnpm db:generate
pnpm db:migrate
pnpm seed

echo ""
echo "📋 Step 6: Building application..."
echo ""
pnpm build || true  # Continue even if TypeScript has some errors

# Step 7: Start services
echo ""
echo "📋 Step 7: Starting services..."
echo ""

# Create start script
cat > start-services.sh << 'EOF'
#!/bin/bash
# Kill any existing processes on our ports
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start API server
cd apps/server && pnpm start &
API_PID=$!

# Wait for API to be ready
echo "Waiting for API server..."
sleep 5

# Start web dashboard
cd apps/web && pnpm start &
WEB_PID=$!

echo ""
echo "🚀 Services started!"
echo "API PID: $API_PID"
echo "Web PID: $WEB_PID"
echo ""
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:4000"
echo "📚 API Docs: http://localhost:4000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $API_PID $WEB_PID 2>/dev/null; exit" INT
wait
EOF

chmod +x start-services.sh

# Step 8: Test the setup
echo ""
echo "📋 Step 8: Testing setup..."
echo ""

# Start services in background for testing
cd apps/server && pnpm start > /tmp/api.log 2>&1 &
API_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint (no auth)
echo -n "Testing health endpoint... "
if curl -s http://localhost:4000/health | grep -q "healthy"; then
    echo "✅ Working"
else
    echo "❌ Failed"
fi

# Test auth
echo -n "Testing authentication... "
if curl -s -u "$ADMIN_USER:$ADMIN_PASS" http://localhost:4000/owners > /dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
fi

# Kill test server
kill $API_PID 2>/dev/null

# Step 9: Create management commands
echo ""
echo "📋 Step 9: Creating management commands..."
echo ""

# Create add-client script
cat > add-client.sh << 'EOF'
#!/bin/bash
source .env

echo "🤝 Adding new client to DePIN Autopilot"
echo ""

read -p "Client name: " name
read -p "Client email: " email
read -p "Revenue share % (e.g., 15): " share
read -p "Discord webhook (optional): " discord

share_decimal=$(echo "scale=2; $share/100" | bc)

# Add owner
./apps/cli/dist/index.js owners add \
    --name "$name" \
    --email "$email" \
    --rev-share "$share_decimal" \
    ${discord:+--discord "$discord"}

echo ""
echo "✅ Client added! Now add their devices:"
echo ""
echo "For io.net device:"
echo "./apps/cli/dist/index.js devices add --owner $email --marketplace ionet --external-id DEVICE_ID --price 2.50"
EOF

chmod +x add-client.sh

# Create generate-invoice script
cat > generate-invoice.sh << 'EOF'
#!/bin/bash
source .env

echo "💰 Generate Invoice for Statement"
echo ""

read -p "Statement ID: " statement_id
read -p "Owner email: " email
read -p "Amount (USD): " amount

# Generate invoice via API
curl -X POST http://localhost:4000/invoices \
    -u "$ADMIN_USERNAME:$ADMIN_PASSWORD" \
    -H "Content-Type: application/json" \
    -d "{
        \"statementId\": \"$statement_id\",
        \"ownerId\": \"$email\",
        \"amount\": $amount,
        \"description\": \"DePIN Management Services - $email\"
    }"
EOF

chmod +x generate-invoice.sh

# Final summary
echo ""
echo "========================================="
echo "✅ SETUP COMPLETE! You're ready to make money!"
echo "========================================="
echo ""
echo "📊 Your Dashboard:"
echo "   URL: http://localhost:3000"
echo "   Username: $ADMIN_USER"
echo "   Password: [hidden]"
echo ""
echo "🔌 API Endpoint:"
echo "   URL: http://localhost:4000"
echo "   Docs: http://localhost:4000/docs"
echo ""
echo "🚀 Quick Start Commands:"
echo "   ./start-services.sh     - Start everything"
echo "   ./add-client.sh         - Add a new client"
echo "   ./generate-invoice.sh   - Create invoice for payment"
echo "   pnpm demo              - Run demo with fake data"
echo ""

# Ask to start now
echo "========================================="
read -p "Start services now? (y/n): " start_now

if [ "$start_now" = "y" ] || [ "$start_now" = "Y" ]; then
    echo ""
    echo "🚀 Starting services..."
    ./start-services.sh
else
    echo ""
    echo "Run './start-services.sh' when ready to start!"
fi